export type PresenceStatus = 'active' | 'idle' | 'offline';

/** The payload each client tracks (publishes) to the Presence channel */
export interface PresencePayload {
	user_id: string;
	full_name: string;
	avatar_url: string | null;
	status: PresenceStatus;
	device_type: 'desktop' | 'mobile' | 'tablet';
	org_id: number;
	online_at: string; // ISO timestamp of when they came online
}

export interface user_presence {
	id: number;
	user_id: string;
	org_id: number;
	last_seen_at: string;
	created_at: string;
}
