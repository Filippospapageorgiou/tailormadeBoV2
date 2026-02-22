<script lang="ts">
	import { Trophy, Medal, ClipboardList, MoreHorizontal } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let {
		trainers = []
	}: {
		trainers: {
			id: string;
			full_name: string | null;
			username: string;
			image_url: string | null;
			evaluation_count: number;
			active_assignments: number;
		}[];
	} = $props();

	const medalColors = ['text-yellow-500', 'text-zinc-400', 'text-amber-600'];
	const medalBg = ['bg-yellow-500/10', 'bg-zinc-400/10', 'bg-amber-600/10'];

	function getInitials(name: string | null, username: string): string {
		const source = name || username;
		return source
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	// Max evaluations for the bar width calculation
	let maxCount = $derived(Math.max(...trainers.map((t) => t.evaluation_count), 1));
</script>

<Card.Root
	class="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm h-full"
>
	<!-- Subtle top accent line -->
	<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

	<Card.Header class="pb-4 px-0 pt-0">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-md bg-accent p-2">
					<Trophy class="h-4 w-4 text-muted-foreground" />
				</div>
				<div>
					<Card.Title class="text-base font-tailormade">Top Trainers</Card.Title>
					<Card.Description class="text-xs">Αξιολογήσεις ανά εκπαιδευτή</Card.Description>
				</div>
			</div>
			<button class="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors">
				<MoreHorizontal class="h-4 w-4" />
			</button>
		</div>
	</Card.Header>

	<Card.Content class="flex-1 space-y-1.5 px-0">
		{#if trainers.length > 0}
			{#each trainers as trainer, index}
				<div
					style="animation-delay: {index * 80}ms"
					class="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50 animate-fade-in-down {index < 3 ? medalBg[index] : ''}"
				>
					<!-- Rank -->
					<div class="flex h-5 w-5 flex-shrink-0 items-center justify-center">
						{#if index < 3}
							<Medal class="h-4 w-4 {medalColors[index]}" />
						{:else}
							<span class="text-xs font-medium text-muted-foreground tabular-nums">{index + 1}</span>
						{/if}
					</div>

					<!-- Avatar -->
					<Avatar.Root class="h-8 w-8 flex-shrink-0">
						<Avatar.Image src={trainer.image_url} alt={trainer.username} class="dark:bg-white" />
						<Avatar.Fallback class="text-[10px] font-semibold">
							{getInitials(trainer.full_name, trainer.username)}
						</Avatar.Fallback>
					</Avatar.Root>

					<!-- Name + bar -->
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium leading-tight">
							{trainer.full_name || trainer.username}
						</p>
						<!-- Mini progress bar -->
						<div class="mt-1 h-1 w-full rounded-full bg-muted/60">
							<div
								class="h-1 rounded-full bg-primary/70 transition-all duration-500"
								style="width: {(trainer.evaluation_count / maxCount) * 100}%"
							></div>
						</div>
					</div>

					<!-- Count badge -->
					<div class="flex flex-shrink-0 items-center gap-1.5 text-right">
						<ClipboardList class="h-3 w-3 text-muted-foreground" />
						<span class="font-game text-sm font-semibold tabular-nums">
							{trainer.evaluation_count}
						</span>
					</div>
				</div>
			{/each}
		{:else}
			<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
				<Trophy class="mb-2 h-8 w-8 opacity-30" />
				<p class="text-sm">Δεν υπάρχουν δεδομένα</p>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="border-t border-border pt-4 px-0 pb-0">
		<div class="flex w-full items-center justify-between text-xs text-muted-foreground">
			<span>{trainers.length} εκπαιδευτές</span>
			<span class="tabular-nums">
				{trainers.reduce((s, t) => s + t.evaluation_count, 0)} αξιολογήσεις σύνολο
			</span>
		</div>
	</Card.Footer>
</Card.Root>