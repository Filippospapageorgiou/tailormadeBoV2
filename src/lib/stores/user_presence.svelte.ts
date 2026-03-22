import { getAllPresence, onAnyPresenceChange } from '$lib/hooks/use-presence.svelte';

export type UserStatus = 'active' | 'idle' | 'offline';

/**
 * Reactively resolve a user's presence status across ALL subscribed org channels.
 *
 * Searches every org presence list (including the trainer virtual channel org_id=0),
 * so it works in cross-org contexts like chat.
 *
 * Includes a short retry on mount to handle the race condition where the
 * presence channel hasn't synced yet when the component first renders.
 */
export class UseUserStatus {
	#userId: string;
	#status = $state<UserStatus>('offline');

	constructor(userId: string) {
		this.#userId = userId;

		$effect(() => {
			// Resolve immediately in case presence data is already available
			this.#resolve();

			// Listen for any presence changes (sync events from any channel)
			const unsubPresence = onAnyPresenceChange(() => {
				this.#resolve();
			});

			// Retry briefly to catch the initial sync if it hasn't fired yet
			let retries = 0;
			const retryInterval = setInterval(() => {
				retries++;
				this.#resolve();
				if (this.#status !== 'offline' || retries >= 5) {
					clearInterval(retryInterval);
				}
			}, 500);

			return () => {
				unsubPresence();
				clearInterval(retryInterval);
			};
		});
	}

	#resolve() {
		const allPresence = getAllPresence();

		for (const [, presenceList] of allPresence) {
			const match = presenceList.find((u) => u.user_id === this.#userId);
			if (match) {
				this.#status = match.status as UserStatus;
				return;
			}
		}

		this.#status = 'offline';
	}

	get current(): UserStatus {
		return this.#status;
	}
}
