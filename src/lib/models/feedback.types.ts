// src/lib/models/feedback.types.ts
export interface Feedback {
	id: number;
	user_id: string;
	org_id: number;
	rating: number;
	comment: string;
	created_at: string;
}

export interface FeedbackWithUser extends Feedback {
	profiles: {
		id: string;
		username: string;
		email: string;
		image_url: string | null;
	};
	core_organizations: {
		id: number;
		store_name: string | null;
	};
}
