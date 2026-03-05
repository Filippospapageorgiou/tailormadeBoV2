export interface Blog {
	id: number;
	title: string;
	description: string;
	content: string;
	images: string[];
	tags: string[];
	author_id: string;
	published: boolean;
	created_at: string;
	updated_at: string;
	profile: {
		username: string;
		image_url: string;
	};
}

export interface BeverageVideo {
	url: string;
	title?: string;
}

export interface Beverage {
	id: number;
	name: string;
	description: string;
	execution: string | null;
	image_url: string | null;
	video_urls: BeverageVideo[];
	public: boolean | null;
	created_at: string;
	updated_at: string;
}

export interface Ingredient {
	id: number;
	name: string;
	category?: string;
	description?: string;
	measurement_unit?: string;
	recipe_ingredients: { count: number }[];
	created_at: string;
	updated_at: string;
}

export interface RecipeIngredient {
	id: number;
	beverage_id: number;
	ingredient_id: number;
	quantity: number;
	notes?: string;
	ingredients: Pick<Ingredient, 'name' | 'measurement_unit'>;
	created_at: string;
	updated_at: string;
}

export interface Profile {
	id: string;
	username: string;
	email: string;
	role: string;
	created_at: string;
	updated_at: string;
	image_url: string;
	org_id: number;
	role_id: number;
	role_name: string;
	badge_color: string;
	can_close_register: boolean;
	phone: string;
	display_order: number;
	is_manager: boolean;
	full_name:string;
}

export interface RoleTypes {
	id: number;
	created_at: string;
	updated_at: string;
	role_name: string;
}

export interface Organization {
	id: number;
	store_name: string | null;
	email: string | null;
	phone: string | null;
	status: boolean | null;
	country: string | null;
	created_at: string;
	updated_at: string | null;
	location: string | null;
	latitude:number | null,
	longitude:number | null;
}

export interface verification_codes {
	id: number;
	email: string;
	code: string;
	created_at: string;
	expires_at: string;
	is_used: boolean;
}

export interface importantPhoneCalls{
	id:number;
	org_id:number;
	associated_company:string;
	manager_full_name:string;
	department:string | null;
	notes:string | null;
	is_active:boolean;
	email: string;
	phone: string;
	created_at: string;
	updated_at: string;
}
