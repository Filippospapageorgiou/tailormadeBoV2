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

	constructor(profile: Profile | null) {
		if (profile) {
			this.id = profile.id;
			this.username = profile.username;
			this.email = profile.email;
			this.imageUrl = profile.image_url;
			this.role = profile.role;
			this.orgId = profile.org_id;
		}
	}

	updateProfile(profile: Profile) {
		this.id = profile.id;
		this.username = profile.username;
		this.email = profile.email;
		this.imageUrl = profile.image_url;
		this.role = profile.role;
		this.orgId = profile.org_id;
	}

	updateUsername(newUsername: string) {
		this.username = newUsername;
	}

	updateAvatar(newAvatarUrl: string) {
		this.imageUrl = newAvatarUrl;
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