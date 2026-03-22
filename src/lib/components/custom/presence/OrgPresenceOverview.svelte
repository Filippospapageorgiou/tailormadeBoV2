<script lang="ts">
	import type { PresencePayload } from '$lib/models/presence.types';
	import { getPresenceList, onPresenceChange } from '$lib/hooks/use-presence.svelte';
	import {
		getOrgUsersPresence,
		type OrgUserPresence
	} from '../../../../routes/app/managment/organization_managment/[id]/data.remote';
	import { formatLastSeen } from '$lib/utils';
	import UserPresenceCard from './UserPresenceCard.svelte';
	import { Wifi, WifiOff } from '@lucide/svelte';

	let { orgId }: { orgId: number } = $props();

	// ── Server data: all org users with last_seen_at ──
	const orgUsersQuery = $derived(getOrgUsersPresence({ org_id: orgId }));
	let allUsers = $derived<OrgUserPresence[]>(
		orgUsersQuery.current?.success ? orgUsersQuery.current.users : []
	);

	// ── Realtime presence: who's currently connected ──
	let presenceList = $derived<PresencePayload[]>(getPresenceList(orgId));

	$effect(() => {
		return onPresenceChange(orgId, () => {
			presenceList = getPresenceList(orgId);
		});
	});

	// ── Deduplicate realtime presence by user_id ──
	let presenceMap = $derived(new Map(presenceList.map((u) => [u.user_id, u])));

	// ── Merge: categorize every org user into active / idle / offline ──
	interface MergedUser {
		id: string;
		full_name: string | null;
		avatar_url: string | null;
		status: 'active' | 'idle' | 'offline';
		device_type?: string;
		last_seen_at: string | null;
	}

	let mergedUsers = $derived<MergedUser[]>(
		allUsers.map((user) => {
			const presence = presenceMap.get(user.id);
			if (presence) {
				return {
					id: user.id,
					full_name: presence.full_name ?? user.full_name,
					avatar_url: presence.avatar_url ?? user.image_url,
					status: presence.status as 'active' | 'idle',
					device_type: presence.device_type,
					last_seen_at: null
				};
			}
			return {
				id: user.id,
				full_name: user.full_name,
				avatar_url: user.image_url,
				status: 'offline' as const,
				last_seen_at: user.last_seen_at
			};
		})
	);

	// ── Sort: active first, then idle, then offline (alphabetically within each) ──
	const STATUS_ORDER = { active: 0, idle: 1, offline: 2 };

	let sortedUsers = $derived(
		[...mergedUsers].sort((a, b) => {
			const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
			if (orderDiff !== 0) return orderDiff;
			return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'el');
		})
	);

	let activeCount = $derived(mergedUsers.filter((u) => u.status === 'active').length);
	let idleCount = $derived(mergedUsers.filter((u) => u.status === 'idle').length);
	let offlineCount = $derived(mergedUsers.filter((u) => u.status === 'offline').length);
</script>

<div class="space-y-3">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if activeCount > 0 || idleCount > 0}
				<Wifi class="h-4 w-4 text-emerald-500" />
			{:else}
				<WifiOff class="h-4 w-4 text-muted-foreground" />
			{/if}
			<h3 class="text-sm font-semibold">Κατάσταση χρηστών</h3>
		</div>

		<div class="flex items-center gap-3 text-xs text-muted-foreground">
			{#if activeCount > 0}
				<span class="flex items-center gap-1">
					<span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
					{activeCount} Ενεργοί
				</span>
			{/if}
			{#if idleCount > 0}
				<span class="flex items-center gap-1">
					<span class="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
					{idleCount} Αδρανείς
				</span>
			{/if}
			{#if offlineCount > 0}
				<span class="flex items-center gap-1">
					<span class="inline-block h-2 w-2 rounded-full bg-muted-foreground/40"></span>
					{offlineCount} Εκτός σύνδεσης
				</span>
			{/if}
		</div>
	</div>

	<!-- User list -->
	{#if sortedUsers.length === 0}
		<div class="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center">
			<p class="text-sm text-muted-foreground">Δεν βρέθηκαν χρήστες</p>
		</div>
	{:else}
		<div class="grid gap-2 sm:grid-cols-2">
			{#each sortedUsers as user (user.id)}
				<UserPresenceCard
					name={user.full_name}
					avatarUrl={user.avatar_url}
					status={user.status}
					deviceType={user.device_type}
					lastSeen={user.status === 'offline' ? formatLastSeen(user.last_seen_at) : null}
				/>
			{/each}
		</div>
	{/if}
</div>
