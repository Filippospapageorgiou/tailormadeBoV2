<script lang="ts">
	import type { PresencePayload } from '$lib/models/presence.types';
	import { getPresenceList, onPresenceChange } from '$lib/hooks/use-presence.svelte';
	import UserPresenceCard from './UserPresenceCard.svelte';
	import { Wifi, WifiOff } from 'lucide-svelte';

	let { orgId }: { orgId: number } = $props();

	// Read from the shared presence state (populated by the tracker in the layout)
	let presenceList = $derived(<PresencePayload[]>getPresenceList(orgId));

	let activeCount = $derived(presenceList.filter((u) => u.status === 'active').length);
	let idleCount = $derived(presenceList.filter((u) => u.status === 'idle').length);

	let sortedUsers = $derived(
		[...new Map(presenceList.map((u) => [u.user_id, u])).values()].sort((a, b) => {
			if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
			return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'el');
		})
	);

	$effect(() => {
		// Subscribe to updates from the tracker's sync events
		return onPresenceChange(orgId, () => {
			presenceList = getPresenceList(orgId);
		});
	});
</script>

<div class="space-y-3">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if presenceList.length > 0}
				<Wifi class="h-4 w-4 text-emerald-500" />
			{:else}
				<WifiOff class="h-4 w-4 text-muted-foreground" />
			{/if}
			<h3 class="text-sm font-semibold">Συνδεδεμένοι χρήστες</h3>
		</div>

		{#if presenceList.length > 0}
			<div class="flex items-center gap-3 text-xs text-muted-foreground">
				<span class="flex items-center gap-1">
					<span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
					{activeCount} Ενεργοί
				</span>
				{#if idleCount > 0}
					<span class="flex items-center gap-1">
						<span class="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
						{idleCount} Αδρανείς
					</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- User list -->
	{#if presenceList.length === 0}
		<div class="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center">
			<p class="text-sm text-muted-foreground">Κανένας χρήστης δεν είναι συνδεδεμένος</p>
		</div>
	{:else}
		<div class="grid gap-2 sm:grid-cols-2">
			{#each sortedUsers as user (user.user_id)}
				<UserPresenceCard {user} />
			{/each}
		</div>
	{/if}
</div>
