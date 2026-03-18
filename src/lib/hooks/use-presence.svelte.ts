import { getDeviceType } from './use-device-type.svelte';
import { getProfileContext } from '$lib/stores/profile.svelte';
import type { PresencePayload, PresenceStatus } from '$lib/models/presence.types';
import type { SupabaseClient } from '@supabase/supabase-js';

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const ACTIVITY_THROTTLE = 5_000; // Only process activity events every 5s

/**
 * Reactive presence state per org — updated by the tracker's sync events.
 * The OrgPresenceOverview reads from this instead of creating a second channel.
 */
const presenceByOrg = new Map<number, PresencePayload[]>();
const presenceListeners = new Map<number, Set<() => void>>();

/** Subscribe to presence changes for an org. Returns an unsubscribe function. */
export function onPresenceChange(orgId: number, callback: () => void): () => void {
	if (!presenceListeners.has(orgId)) {
		presenceListeners.set(orgId, new Set());
	}
	presenceListeners.get(orgId)!.add(callback);
	return () => {
		presenceListeners.get(orgId)?.delete(callback);
	};
}

/** Get the current presence list for an org. */
export function getPresenceList(orgId: number): PresencePayload[] {
	return presenceByOrg.get(orgId) ?? [];
}

function notifyListeners(orgId: number) {
	presenceListeners.get(orgId)?.forEach((cb) => cb());
}

/** Get the full presenceByOrg map (all orgs that have been subscribed to). */
export function getAllPresence(): Map<number, PresencePayload[]> {
	return presenceByOrg;
}

/** Global listener — fires when ANY org's presence changes. */
const globalListeners = new Set<() => void>();

export function onAnyPresenceChange(callback: () => void): () => void {
	globalListeners.add(callback);
	return () => {
		globalListeners.delete(callback);
	};
}

function notifyGlobalListeners() {
	globalListeners.forEach((cb) => cb());
}

/**
 * Subscribe to presence channels for multiple orgs (read-only, no tracking).
 * Used by super admin to observe all orgs. Returns a cleanup function.
 */
export function subscribeToOrgPresence(supabase: SupabaseClient, orgIds: number[]): () => void {
	const channels: ReturnType<SupabaseClient['channel']>[] = [];

	for (const orgId of orgIds) {
		// Skip if this org already has a channel (e.g., the admin's own org from the tracker)
		const existing = supabase
			.getChannels()
			.find((ch) => ch.topic === `realtime:presence_org_${orgId}`);
		if (existing) continue;

		const channelName = `presence_org_${orgId}`;
		const channel = supabase.channel(channelName);

		channel
			.on('presence', { event: 'sync' }, () => {
				const state = channel.presenceState<PresencePayload>();
				presenceByOrg.set(orgId, Object.values(state).flat());
				notifyListeners(orgId);
				notifyGlobalListeners();
			})
			.subscribe();

		channels.push(channel);
	}

	return () => {
		for (const channel of channels) {
			supabase.removeChannel(channel);
		}
	};
}

/**
 * Starts presence tracking for the current user.
 * Call inside an $effect() — returns a cleanup function.
 */
export function startPresenceTracker(
	supabase: SupabaseClient,
	userId: string,
	orgId: number
): () => void {
	const profile = getProfileContext();
	const deviceType = getDeviceType();
	const onlineAt = new Date().toISOString();

	let status: PresenceStatus = 'active';
	let lastThrottledActivity = 0;
	let idleTimer: ReturnType<typeof setTimeout> | null = null;

	const channelName = `presence_org_${orgId}`;
	const channel = supabase.channel(channelName);

	function getPayload(): PresencePayload {
		return {
			user_id: userId,
			full_name: profile.full_name,
			avatar_url: profile.imageUrl || null,
			status,
			device_type: deviceType,
			org_id: orgId,
			online_at: onlineAt
		};
	}

	// --- Activity detection (throttled) ---

	function onActivity() {
		const now = Date.now();
		if (now - lastThrottledActivity < ACTIVITY_THROTTLE) return;
		lastThrottledActivity = now;

		if (status === 'idle') {
			status = 'active';
			channel.track(getPayload());
		}

		resetIdleTimer();
	}

	function resetIdleTimer() {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			status = 'idle';
			channel.track(getPayload());
		}, IDLE_TIMEOUT);
	}

	// --- Subscribe, listen for sync, and track ---

	channel
		.on('presence', { event: 'sync' }, () => {
			const state = channel.presenceState<PresencePayload>();
			presenceByOrg.set(orgId, Object.values(state).flat());
			notifyListeners(orgId);
			notifyGlobalListeners();
		})
		.subscribe(async (channelStatus) => {
			if (channelStatus === 'SUBSCRIBED') {
				await channel.track(getPayload());
			}
		});

	const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const;
	for (const event of events) {
		window.addEventListener(event, onActivity, { passive: true });
	}
	resetIdleTimer();

	// --- Cleanup (returned for $effect teardown) ---

	return () => {
		if (idleTimer) clearTimeout(idleTimer);
		for (const event of events) {
			window.removeEventListener(event, onActivity);
		}
		supabase.removeChannel(channel);
		presenceByOrg.delete(orgId);
		presenceListeners.delete(orgId);
	};
}
