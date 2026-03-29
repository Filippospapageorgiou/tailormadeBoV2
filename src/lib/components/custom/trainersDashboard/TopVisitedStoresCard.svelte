<script lang="ts">
	import { Store, Medal, Wrench, MoreHorizontal } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	let {
		stores = []
	}: {
		stores: {
			org_id: number;
			store_name: string;
			location: string | null;
			visit_count: number;
			total_actions: number;
		}[];
	} = $props();

	const medalColors = ['text-yellow-500', 'text-zinc-400', 'text-amber-600'];
	const medalBg = ['bg-yellow-500/10', 'bg-zinc-400/10', 'bg-amber-600/10'];

	let maxCount = $derived(Math.max(...stores.map((s) => s.visit_count), 1));
</script>

<Card.Root
	class="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm"
>
	<div
		class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
	></div>

	<Card.Header class="px-0 pt-0 pb-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-md bg-accent p-2">
					<Store class="h-4 w-4 text-muted-foreground" />
				</div>
				<div>
					<Card.Title class="font-tailormade text-base">Top Καταστήματα</Card.Title>
					<Card.Description class="text-xs">Επισκέψεις ανά κατάστημα</Card.Description>
				</div>
			</div>
			<button
				class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50"
			>
				<MoreHorizontal class="h-4 w-4" />
			</button>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 space-y-1.5 px-0">
		{#if stores.length > 0}
			{#each stores as store, index}
				<div
					style="animation-delay: {index * 80}ms"
					class="animate-fade-in-down group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 {index < 3 ? medalBg[index] : ''}"
				>
					<!-- Rank -->
					<div class="flex h-5 w-5 flex-shrink-0 items-center justify-center">
						{#if index < 3}
							<Medal class="h-4 w-4 {medalColors[index]}" />
						{:else}
							<span class="text-xs font-medium tabular-nums text-muted-foreground"
								>{index + 1}</span
							>
						{/if}
					</div>

					<!-- Store info + bar -->
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium leading-tight">
							{store.store_name}
						</p>
						{#if store.location}
							<p class="truncate text-[11px] text-muted-foreground/60">
								{store.location}
							</p>
						{/if}
						<div class="mt-1 h-1 w-full rounded-full bg-muted/60">
							<div
								class="h-1 rounded-full bg-primary/70 transition-all duration-500"
								style="width: {(store.visit_count / maxCount) * 100}%"
							></div>
						</div>
					</div>

					<!-- Count badges -->
					<div class="flex flex-shrink-0 items-center gap-2 text-right">
						<div class="flex items-center gap-1">
							<Wrench class="h-3 w-3 text-muted-foreground" />
							<span class="font-game text-sm font-semibold tabular-nums">
								{store.visit_count}
							</span>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
				<Store class="mb-2 h-8 w-8 opacity-30" />
				<p class="text-sm">Δεν υπάρχουν δεδομένα</p>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border px-0 pb-0 pt-4">
		<div class="flex w-full items-center justify-between text-xs text-muted-foreground">
			<span>{stores.length} καταστήματα</span>
			<span class="tabular-nums">
				{stores.reduce((s, t) => s + t.visit_count, 0)} επισκέψεις σύνολο
			</span>
		</div>
	</Card.Footer>
</Card.Root>
