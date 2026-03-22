import { getContext, setContext } from 'svelte';
import type { Profile } from '$lib/models/database.types';

const USER_PROFILE_KEY = Symbol('user_profile');

export class ProfileStore {
	id = $state('');
	username = $state('');
	email = $state('');
	imageUrl = $state('');
	role = $state('');
	orgId = $state<number | null>(null);
	role_id = $state<number | null>(null);
	role_name = $state('');
	can_close_register = $state(false);
	phone = $state('');
	isManager = $state(false);
	full_name = $state('');

	constructor(profile: Profile | null) {
		if (profile) {
			this.setProfile(profile);
		}
	}

	setProfile(profile: Profile | null) {
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
			this.full_name = profile.full_name;
		}
	}

	updateProfile(profile: Profile) {
		this.setProfile(profile);
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

	updateFullName(fullName: string) {
		this.full_name = fullName;
	}

	clear() {
		this.id = '';
		this.username = '';
		this.email = '';
		this.imageUrl = '';
		this.role = '';
		this.orgId = null;
		this.role_id = null;
		this.role_name = '';
		this.can_close_register = false;
		this.phone = '';
		this.isManager = false;
		this.full_name = '';
	}
}

// Global store instance for use outside of components (like in login)
let globalProfileStore: ProfileStore | null = null;

export function setProfileContext(profile: Profile | null): ProfileStore {
	const store = new ProfileStore(profile);
	setContext(USER_PROFILE_KEY, store);
	globalProfileStore = store;
	return store;
}

export function getProfileContext(): ProfileStore {
	return getContext(USER_PROFILE_KEY);
}

// Use this to update profile from anywhere (like login page)
export function updateGlobalProfile(profile: Profile | null) {
	if (globalProfileStore) {
		globalProfileStore.setProfile(profile);
	}
}

export function getGlobalProfileStore(): ProfileStore | null {
	return globalProfileStore;
}
