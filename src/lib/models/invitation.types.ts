// src/lib/models/invitation.types.ts

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface OrganizationInvitation {
	id: number;
	org_id: number;
	email: string;
	role_id: number;
	token: string;
	invited_by: string; // UUID
	status: InvitationStatus;
	expires_at: string; // ISO timestamp
	accepted_at: string | null; // ISO timestamp
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
}

export interface OrganizationInvitationWithDetails extends OrganizationInvitation {
	organization: {
		id: number;
		store_name: string | null;
	};
	role: {
		id: number;
		role_name: string;
	};
	inviter: {
		id: string;
		username: string;
		email: string;
	};
}

export interface CreateInvitationInput {
	orgId: number;
	email: string;
	roleId: number;
}

export interface AcceptInvitationInput {
	token: string;
	username: string;
	password: string;
}