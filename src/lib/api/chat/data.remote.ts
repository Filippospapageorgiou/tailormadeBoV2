import { query, command, form } from '$app/server';
import { createServerClient } from '$lib/supabase/server';
import { requireAuthenticatedUser } from '$lib/supabase/shared';
import { z } from 'zod/v4';
import type { ChatConversation, ChatMessage } from '$lib/models/chat.types';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Generate a signed URL for a chat image path.
 * Returns null if path is null or signing fails.
 */
async function signImageUrl(
	supabase: ReturnType<typeof createServerClient>,
	imagePath: string | null
): Promise<string | null> {
	if (!imagePath) return null;
	const { data } = await supabase.storage.from('chat-images').createSignedUrl(imagePath, 3600); // 1 hour
	return data?.signedUrl ?? null;
}

/**
 * Attach a fresh signed URL to a raw message row.
 */
async function hydrateMessage(
	supabase: ReturnType<typeof createServerClient>,
	raw: Omit<ChatMessage, 'image_url'>
): Promise<ChatMessage> {
	return {
		...raw,
		image_url: await signImageUrl(supabase, raw.image_path)
	};
}

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

/**
 * All conversations for the current user, ordered by most-recent message first.
 * Includes the other participant's profile data.
 */
export const getConversations = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		const { data, error } = await supabase
			.from('chat_conversations')
			.select(
				`
				id, participant_a, participant_b, created_at, last_message_at,
				profile_a:profiles!participant_a(id, full_name, image_url, role_id, org_id, org:core_organizations(store_name)),
				profile_b:profiles!participant_b(id, full_name, image_url, role_id, org_id, org:core_organizations(store_name))
			`
			)
			.or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
			.order('last_message_at', { ascending: false });

		if (error) {
			console.error('[getConversations] Error:', error);
			return { success: false, message: 'Σφάλμα κατά την ανάκτηση συνομιλιών', conversations: [] };
		}

		const conversations: ChatConversation[] = (data ?? []).map((row) => {
			const isA = row.participant_a === user.id;
			const rawOther = isA ? (row.profile_b as any) : (row.profile_a as any);
			const orgName = rawOther?.org?.store_name ?? null;
			const { org: _org, ...profileFields } = rawOther ?? {};
			return {
				id: row.id,
				participant_a: row.participant_a,
				participant_b: row.participant_b,
				created_at: row.created_at,
				last_message_at: row.last_message_at,
				other_participant: { ...profileFields, org_name: orgName }
			};
		});

		return { success: true, message: 'Επιτυχής ανάκτηση συνομιλιών', conversations };
	} catch (err) {
		console.error('[getConversations] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα', conversations: [] };
	}
});

// ─────────────────────────────────────────────

/**
 * Find an existing conversation between the current user and another user,
 * or create one if it doesn't exist.
 *
 * Race-condition safe: if two clients insert concurrently, the unique index
 * triggers a 23505 error on the second insert — we catch it and re-fetch.
 */
const getOrCreateConversationSchema = z.object({
	otherUserId: z.string().uuid()
});

export const getOrCreateConversation = query(
	getOrCreateConversationSchema,
	async ({ otherUserId }) => {
		const supabase = createServerClient();
		const user = await requireAuthenticatedUser();

		try {
			// Step 1: look for an existing conversation (either participant ordering)
			const { data: existing } = await supabase
				.from('chat_conversations')
				.select('id')
				.or(
					`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`
				)
				.maybeSingle();

			if (existing) {
				return { success: true, message: 'Συνομιλία βρέθηκε', conversationId: existing.id };
			}

			// Step 2: create a new conversation
			const { data: created, error: insertError } = await supabase
				.from('chat_conversations')
				.insert({ participant_a: user.id, participant_b: otherUserId })
				.select('id')
				.single();

			if (insertError) {
				// 23505 = unique_violation — a concurrent insert won the race, fetch it
				if (insertError.code === '23505') {
					const { data: retry } = await supabase
						.from('chat_conversations')
						.select('id')
						.or(
							`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`
						)
						.maybeSingle();

					if (retry) {
						return { success: true, message: 'Συνομιλία βρέθηκε', conversationId: retry.id };
					}
				}

				console.error('[getOrCreateConversation] Insert error:', insertError);
				return {
					success: false,
					message: 'Σφάλμα κατά τη δημιουργία συνομιλίας',
					conversationId: -1
				};
			}

			return { success: true, message: 'Νέα συνομιλία δημιουργήθηκε', conversationId: created.id };
		} catch (err) {
			console.error('[getOrCreateConversation] Unexpected error:', err);
			return { success: false, message: 'Απρόσμενο σφάλμα', conversationId: -1 };
		}
	}
);

// ─────────────────────────────────────────────

/**
 * Cursor-based paginated messages for a conversation.
 * Returns 30 messages per page ordered newest-first.
 * Pass the lowest `id` from the previous page as `cursor` to load older messages.
 */
const getMessagesSchema = z.object({
	conversationId: z.number().int().positive(),
	cursor: z.number().int().positive().optional()
});

export const getMessages = query(getMessagesSchema, async ({ conversationId, cursor }) => {
	const supabase = createServerClient();
	await requireAuthenticatedUser();

	try {
		let q = supabase
			.from('chat_messages')
			.select('*')
			.eq('conversation_id', conversationId)
			.order('id', { ascending: false })
			.limit(30);

		if (cursor) {
			q = q.lt('id', cursor);
		}

		const { data, error } = await q.overrideTypes<Omit<ChatMessage, 'image_url'>[]>();

		if (error) {
			console.error('[getMessages] Error:', error);
			return {
				success: false,
				message: 'Σφάλμα κατά την ανάκτηση μηνυμάτων',
				messages: [],
				nextCursor: null
			};
		}

		const rows = data ?? [];

		// Generate signed URLs for any image messages
		const messages = await Promise.all(rows.map((row) => hydrateMessage(supabase, row)));

		// nextCursor: lowest id in this page — pass to next call to load older messages
		const nextCursor = rows.length === 30 ? rows[rows.length - 1].id : null;

		return { success: true, message: 'Επιτυχής ανάκτηση μηνυμάτων', messages, nextCursor };
	} catch (err) {
		console.error('[getMessages] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα', messages: [], nextCursor: null };
	}
});

// ─────────────────────────────────────────────

/**
 * Total unread message count across all conversations for the current user.
 * Used to drive the sidebar badge.
 */
export const getUnreadCount = query(async () => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		// Step 1: get conversation IDs the user is part of
		const { data: convRows, error: convError } = await supabase
			.from('chat_conversations')
			.select('id')
			.or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

		if (convError) {
			console.error('[getUnreadCount] Error fetching conversations:', convError);
			return { success: false, count: 0 };
		}

		const ids = convRows?.map((c) => c.id) ?? [];
		if (ids.length === 0) return { success: true, count: 0 };

		// Step 2: count unread messages in those conversations sent by others
		const { count, error } = await supabase
			.from('chat_messages')
			.select('id', { count: 'exact', head: true })
			.eq('is_read', false)
			.neq('sender_id', user.id)
			.in('conversation_id', ids);

		if (error) {
			console.error('[getUnreadCount] Error counting:', error);
			return { success: false, count: 0 };
		}

		return { success: true, count: count ?? 0 };
	} catch (err) {
		console.error('[getUnreadCount] Unexpected error:', err);
		return { success: false, count: 0 };
	}
});

// ─────────────────────────────────────────────
// COMMANDS
// ─────────────────────────────────────────────

const sendMessageSchema = z
	.object({
		conversationId: z.number().int().positive(),
		content: z.string().min(1).max(4000).optional(),
		imagePath: z.string().min(1).optional()
	})
	.refine((d) => d.content !== undefined || d.imagePath !== undefined, {
		message: 'Απαιτείται τουλάχιστον κείμενο ή εικόνα'
	});

export const sendMessage = command(
	sendMessageSchema,
	async ({ conversationId, content, imagePath }) => {
		const supabase = createServerClient();
		const user = await requireAuthenticatedUser();

		try {
			const { data, error } = await supabase
				.from('chat_messages')
				.insert({
					conversation_id: conversationId,
					sender_id: user.id,
					content: content ?? null,
					image_path: imagePath ?? null
				})
				.select('*')
				.single();

			if (error) {
				console.error('[sendMessage] Error:', error);
				return { success: false, message: 'Σφάλμα κατά την αποστολή μηνύματος' };
			}

			const message = await hydrateMessage(supabase, data);
			return { success: true, message: 'Μήνυμα εστάλη', data: message };
		} catch (err) {
			console.error('[sendMessage] Unexpected error:', err);
			return { success: false, message: 'Απρόσμενο σφάλμα' };
		}
	}
);

// ─────────────────────────────────────────────

const markConversationAsReadSchema = z.object({
	conversationId: z.number().int().positive()
});

export const markConversationAsRead = command(
	markConversationAsReadSchema,
	async ({ conversationId }) => {
		const supabase = createServerClient();
		const user = await requireAuthenticatedUser();

		try {
			const { error } = await supabase
				.from('chat_messages')
				.update({ is_read: true, read_at: new Date().toISOString() })
				.eq('conversation_id', conversationId)
				.eq('is_read', false)
				.neq('sender_id', user.id); // only mark messages sent by the other person

			if (error) {
				console.error('[markConversationAsRead] Error:', error);
				return { success: false, message: 'Σφάλμα κατά την ενημέρωση' };
			}

			return { success: true, message: 'Τα μηνύματα σημάνθηκαν ως αναγνωσμένα' };
		} catch (err) {
			console.error('[markConversationAsRead] Unexpected error:', err);
			return { success: false, message: 'Απρόσμενο σφάλμα' };
		}
	}
);

// ─────────────────────────────────────────────
// NEW CONVERSATION — user picker queries
// ─────────────────────────────────────────────

/**
 * Returns users the current user can start a conversation with.
 *
 * - Trainers (role_id 3): if orgId provided → all users of that org (excl. self)
 *                         if no orgId → all trainers (for trainer→trainer, kept for flexibility)
 * - Baristas / Managers:  all trainers (role_id 3)
 */
const getChatableUsersSchema = z.object({
	orgId: z.number().int().positive().optional()
});

export const getChatableUsers = query(getChatableUsersSchema, async ({ orgId }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	try {
		let q = supabase
			.from('profiles')
			.select('id, full_name, image_url, role_id, org_id, role')
			.neq('id', user.id); // exclude self

		if (orgId) {
			// Trainer picking from a specific org → everyone in that org
			q = q.eq('org_id', orgId);
		} else {
			// Barista/Manager → only trainers
			q = q.eq('role_id', 3);
		}

		const { data, error } = await q.order('full_name', { ascending: true });

		if (error) {
			console.error('[getChatableUsers] Error:', error);
			return { success: false, message: 'Σφάλμα κατά την ανάκτηση χρηστών', users: [] };
		}

		return { success: true, message: 'Επιτυχής ανάκτηση', users: data ?? [] };
	} catch (err) {
		console.error('[getChatableUsers] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα', users: [] };
	}
});

/**
 * Returns all organisations — used by the trainer's two-step new conversation picker.
 */
export const getChatableOrgs = query(async () => {
	const supabase = createServerClient();
	await requireAuthenticatedUser();

	try {
		const { data, error } = await supabase
			.from('core_organizations')
			.select('id, store_name')
			.order('store_name', { ascending: true });

		if (error) {
			console.error('[getChatableOrgs] Error:', error);
			return { success: false, message: 'Σφάλμα κατά την ανάκτηση οργανισμών', orgs: [] };
		}

		return { success: true, message: 'Επιτυχής ανάκτηση', orgs: data ?? [] };
	} catch (err) {
		console.error('[getChatableOrgs] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα', orgs: [] };
	}
});

// ─────────────────────────────────────────────
// IMAGE UPLOAD
// ─────────────────────────────────────────────

const uploadChatImageSchema = z.object({
	conversationId: z.number().int().positive(),
	image: z
		.instanceof(File)
		.refine((f) => f.size > 0, 'Το αρχείο είναι κενό')
		.refine((f) => f.size <= 10 * 1024 * 1024, 'Μέγιστο μέγεθος 10MB')
		.refine(
			(f) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(f.type),
			'Μόνο εικόνες επιτρέπονται'
		)
});

/**
 * Upload a chat image to Storage and insert a message with the image_path.
 * Atomic: if the DB insert fails the uploaded file is cleaned up.
 */
export const uploadChatImage = form(uploadChatImageSchema, async ({ conversationId, image }) => {
	const supabase = createServerClient();
	const user = await requireAuthenticatedUser();

	const ext = image.name.split('.').pop() ?? 'jpg';
	const filePath = `${conversationId}/${user.id}/${Date.now()}.${ext}`;

	try {
		// Upload file to Storage
		const buffer = await image.arrayBuffer();
		const { error: uploadError } = await supabase.storage
			.from('chat-images')
			.upload(filePath, buffer, { contentType: image.type, upsert: false });

		if (uploadError) {
			console.error('[uploadChatImage] Upload error:', uploadError);
			return { success: false, message: 'Σφάλμα κατά το ανέβασμα εικόνας' };
		}

		// Insert message row with the storage path
		const { error: msgError } = await supabase.from('chat_messages').insert({
			conversation_id: conversationId,
			sender_id: user.id,
			content: null,
			image_path: filePath
		});

		if (msgError) {
			// Rollback: remove the uploaded file
			await supabase.storage.from('chat-images').remove([filePath]);
			console.error('[uploadChatImage] DB insert error:', msgError);
			return { success: false, message: 'Σφάλμα κατά την αποστολή' };
		}

		return { success: true, message: 'Εικόνα εστάλη' };
	} catch (err) {
		console.error('[uploadChatImage] Unexpected error:', err);
		return { success: false, message: 'Απρόσμενο σφάλμα' };
	}
});
