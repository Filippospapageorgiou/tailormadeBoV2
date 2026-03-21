import type { Profile } from './database.types';

export interface ChatConversation {
	id: number;
	participant_a: string;
	participant_b: string;
	created_at: string;
	last_message_at: string;
	/** Number of unread messages from the other participant */
	unread_count: number;
	/** Preview of the most recent message in the conversation */
	last_message: {
		content: string | null;
		sender_id: string;
		has_image: boolean;
	} | null;
	/**
	 * The other participant in the conversation (not the current user).
	 * org_id reflects their primary org (profiles.org_id).
	 * org_name is the resolved store name from core_organizations.
	 * For trainers (role_id 3) org_id/org_name may be null.
	 */
	other_participant: Pick<
		Profile,
		'id' | 'full_name' | 'image_url' | 'role_id' | 'org_id' | 'org_name'
	> & {
		org_name: string | null;
	};
}

export interface ChatMessage {
	id: number;
	conversation_id: number;
	sender_id: string;
	/** Text body — null when the message is image-only */
	content: string | null;
	/** Raw Supabase Storage path — never persisted as a signed URL */
	image_path: string | null;
	/** Signed URL generated at read time by the API layer — not stored in DB */
	image_url: string | null;
	is_read: boolean;
	read_at: string | null;
	created_at: string;
}

export interface GetConversationsResult {
	success: boolean;
	conversations: ChatConversation[];
}

export interface GetMessagesResult {
	success: boolean;
	messages: ChatMessage[];
	/** Pass as `cursor` to the next getMessages() call to load the previous page */
	nextCursor: number | null;
}

export interface GetOrCreateConversationResult {
	success: boolean;
	conversationId: number;
}

export interface GetUnreadCountResult {
	success: boolean;
	count: number;
}

export interface SendMessageResult {
	success: boolean;
	message?: ChatMessage;
}

export interface MarkAsReadResult {
	success: boolean;
}

// ─────────────────────────────────────────────
// COMMAND INPUT SHAPES  (mirror Zod schemas in data.remote.ts)
// ─────────────────────────────────────────────

export interface SendMessageInput {
	conversationId: number;
	/** At least one of content or imagePath must be provided */
	content?: string;
	imagePath?: string;
}

export interface MarkConversationAsReadInput {
	conversationId: number;
}

// ─────────────────────────────────────────────
// REALTIME PAYLOAD
// ─────────────────────────────────────────────

/**
 * Shape of the Supabase Realtime INSERT payload for chat_messages.
 * image_url is NOT present in the raw payload — it must be generated
 * via createSignedUrl() after receiving the realtime event.
 */
export interface ChatMessageRealtimePayload {
	id: number;
	conversation_id: number;
	sender_id: string;
	content: string | null;
	image_path: string | null;
	is_read: boolean;
	read_at: string | null;
	created_at: string;
}
