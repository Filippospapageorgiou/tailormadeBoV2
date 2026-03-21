import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessage, ChatMessageRealtimePayload } from '$lib/models/chat.types';
import { markConversationAsRead } from '$lib/api/chat/data.remote';

/**
 * Hydrate a raw Realtime INSERT payload into a full ChatMessage.
 * Call this on the client after receiving a postgres_changes event.
 * Requires a browser Supabase client to generate the signed URL.
 */
async function hydrateChatMessagePayload(
	supabase: SupabaseClient,
	payload: ChatMessageRealtimePayload
): Promise<ChatMessage> {
	let image_url: string | null = null;

	if (payload.image_path) {
		const { data } = await supabase.storage
			.from('chat-images')
			.createSignedUrl(payload.image_path, 3600);
		image_url = data?.signedUrl ?? null;
	}

	return { ...payload, image_url };
}

// ─────────────────────────────────────────────
// SUBSCRIPTION 1 — Active conversation
// ─────────────────────────────────────────────

export interface ConversationSubscriptionCallbacks {
	/** Called when a new message arrives — append it to local state */
	onMessage: (message: ChatMessage) => void;
	/** Called after marking messages as read — refresh the badge */
	onRead: () => void;
}

/**
 * Subscribe to new messages in an active conversation.
 *
 * - Appends new messages to local state via `onMessage`
 * - Auto-marks messages as read when the receiver is viewing the conversation
 * - Calls `onRead` so the parent can refresh the badge count
 *
 * Use inside an `$effect()` — return value is the cleanup function.
 *
 * @example
 * $effect(() => {
 *   return subscribeToConversation(supabase, conversationId, userId, {
 *     onMessage: (msg) => messages = [msg, ...messages],
 *     onRead: () => {} // count synced via reactive query invalidation
 *   });
 * });
 */
export function subscribeToConversation(
	supabase: SupabaseClient,
	conversationId: number,
	currentUserId: string,
	callbacks: ConversationSubscriptionCallbacks
): () => void {
	const channel = supabase
		.channel(`chat_conversation_${conversationId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'chat_messages',
				filter: `conversation_id=eq.${conversationId}`
			},
			async (payload) => {
				const raw = payload.new as ChatMessageRealtimePayload;

				// Hydrate image path → signed URL on client side
				const message = await hydrateChatMessagePayload(supabase, raw);

				callbacks.onMessage(message);

				// Auto-mark as read if the receiver is actively viewing
				if (raw.sender_id !== currentUserId) {
					await markConversationAsRead({ conversationId });
					callbacks.onRead();
				}
			}
		)
		.subscribe();

	// Cleanup — returned for $effect teardown
	return () => {
		supabase.removeChannel(channel);
	};
}

// ─────────────────────────────────────────────
// SUBSCRIPTION 2 — Inbox badge
// ─────────────────────────────────────────────

/**
 * Subscribe to new messages across all the user's conversations.
 * Triggers `onNewMessage` only for messages in conversations the user is part of.
 *
 * Fetches the user's conversation IDs upfront and filters client-side,
 * since Supabase Realtime does not enforce RLS on postgres_changes.
 *
 * Use inside an `$effect()` on the chat inbox/layout — return value is cleanup.
 *
 * @example
 * $effect(() => {
 *   return subscribeToChatInbox(supabase, userId, () => chatStore.increment());
 * });
 */
export function subscribeToChatInbox(
	supabase: SupabaseClient,
	currentUserId: string,
	onNewMessage: () => void
): () => void {
	// Track the user's conversation IDs for client-side filtering
	let myConversationIds = new Set<number>();

	// Fetch conversation IDs the user is part of
	supabase
		.from('chat_conversations')
		.select('id')
		.or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
		.then(({ data }) => {
			myConversationIds = new Set((data ?? []).map((c) => c.id));
		});

	const channel = supabase
		.channel(`chat_inbox_${currentUserId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'chat_messages'
			},
			(payload) => {
				const raw = payload.new as ChatMessageRealtimePayload;

				// Only count messages from others AND in conversations we're part of
				if (raw.sender_id !== currentUserId && myConversationIds.has(raw.conversation_id)) {
					onNewMessage();
				}
			}
		)
		// Also listen for new conversations so we pick up newly created ones
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'chat_conversations'
			},
			(payload) => {
				const row = payload.new as { id: number; participant_a: string; participant_b: string };
				if (row.participant_a === currentUserId || row.participant_b === currentUserId) {
					myConversationIds.add(row.id);
				}
			}
		)
		.subscribe();

	return () => {
		supabase.removeChannel(channel);
	};
}
