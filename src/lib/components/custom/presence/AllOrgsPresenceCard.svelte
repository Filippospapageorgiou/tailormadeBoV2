<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { PresencePayload } from '$lib/models/presence.types';
	import {
		getAllPresence,
		onAnyPresenceChange,
		subscribeToOrgPresence
	} from '$lib/hooks/use-presence.svelte';
	import PresenceIndicator from './PresenceIndicator.svelte';
	import { Wifi } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface OrgInfo {
		id: number;
		store_name: string;
	}

	let {
		supabase,
		organizations
	}: {
		supabase: SupabaseClient;
		organizations: OrgInfo[];
	} = $props();

	let allUsers = $state<PresencePayload[]>([]);

	let totalOnline = $derived(allUsers.length);
	let totalActive = $derived(allUsers.filter((u) => u.status === 'active').length);
	let totalIdle = $derived(allUsers.filter((u) => u.status === 'idle').length);

	// Group by org_id → count
	let perOrg = $derived.by(() => {
		const map = new Map<number, { active: number; idle: number }>();
		for (const u of allUsers) {
			const entry = map.get(u.org_id) ?? { active: 0, idle: 0 };
			if (u.status === 'active') entry.active++;
			else entry.idle++;
			map.set(u.org_id, entry);
		}
		// Return only orgs that have online users, sorted by total desc
		return organizations
			.map((org) => {
				const counts = map.get(org.id);
				return counts ? { ...org, ...counts, total: counts.active + counts.idle } : null;
			})
			.filter((o): o is OrgInfo & { active: number; idle: number; total: number } => o !== null)
			.sort((a, b) => b.total - a.total);
	});

	const DEBOUNCE_MS = 500;

	function refreshState() {
		const presence = getAllPresence();
		allUsers = [...presence.values()].flat();
	}

	// Subscribe to all org channels + debounced listener for changes
	$effect(() => {
		const orgIds = organizations.map((o) => o.id);
		const unsubChannels = subscribeToOrgPresence(supabase, orgIds);

		let debounceTimer: ReturnType<typeof setTimeout> | null = null;
		const debouncedRefresh = () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(refreshState, DEBOUNCE_MS);
		};

		const unsubListener = onAnyPresenceChange(debouncedRefresh);

		// Read initial state
		refreshState();

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			unsubChannels();
			unsubListener();
		};
	});
</script>

<div
	class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
>
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Συνδεδεμένοι</p>
			<p class="text-2xl font-bold tracking-tight tabular-nums">{totalOnline}</p>
		</div>
		<div
			class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400"
		>
			<Wifi class="h-5 w-5" />
		</div>
	</div>

	<!-- Active / Idle breakdown -->
	<div class="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
		<span class="flex items-center gap-1">
			<PresenceIndicator status="active" size="sm" />
			{totalActive} ενεργοί
		</span>
		{#if totalIdle > 0}
			<span class="flex items-center gap-1">
				<PresenceIndicator status="idle" size="sm" />
				{totalIdle} αδρανείς
			</span>
		{/if}
	</div>

	<!-- Per-org breakdown -->
	{#if perOrg.length > 0}
		<div class="mt-3 space-y-1.5 border-t border-border/40 pt-3">
			{#each perOrg as org (org.id)}
				<button
					class="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-0.5 text-xs transition-colors hover:bg-muted/60"
					onclick={() => goto(`/app/managment/organization_managment/${org.id}?tab=presence`)}
				>
					<span class="truncate text-muted-foreground">{org.store_name}</span>
					<div class="flex items-center gap-2 tabular-nums">
						<span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
							<span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
							{org.active}
						</span>
						{#if org.idle > 0}
							<span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
								<span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"></span>
								{org.idle}
							</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
