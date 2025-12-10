import { getContext, setContext } from 'svelte';
import type { Profile } from '$lib/models/database.types';

const USER_PROFILE_KEY = Symbol('user_profile');

export class ProfileStore {
	id = $state('');
	username = $state('');
	email = $state('');
	imageUrl = $state('');
	role = $state('');
	orgId = $state();
	role_id = $state();
	role_name = $state('');
	can_close_register = $state(false);
	phone = $state('');
	isManager = $state(false);

	constructor(profile: Profile | null) {
		if (profile) {
			this.id = profile.id;
			this.username = profile.username;
			this.email = profile.email;
			this.imageUrl = profile.image_url;
			this.role = profile.role;
			this.orgId = profile.org_id;
			this.role_id = profile.role_id;
			this.role_name = profile.role_name;
			this.can_close_register = profile.can_close_register;
			this.phone = profile.phone;
			this.isManager = profile.is_manager;
		}
	}

	updateProfile(profile: Profile) {
		this.id = profile.id;
		this.username = profile.username;
		this.email = profile.email;
		this.imageUrl = profile.image_url;
		this.role = profile.role;
		this.orgId = profile.org_id;
		this.role_id = profile.role_id;
		this.role_name = profile.role_name;
		this.can_close_register = profile.can_close_register;
		this.phone = profile.phone;
		this.isManager = profile.is_manager;
	}

	updateUsername(newUsername: string) {
		this.username = newUsername;
	}

	updateAvatar(newAvatarUrl: string) {
		this.imageUrl = newAvatarUrl;
	}
	updatePhone(phone: string) {
		this.phone = phone;
	}
}

export function setProfileContext(profile: Profile | null) {
	const store = new ProfileStore(profile);
	setContext(USER_PROFILE_KEY, store);
	return store;
}

export function getProfileContext(): ProfileStore {
	return getContext(USER_PROFILE_KEY);
}
