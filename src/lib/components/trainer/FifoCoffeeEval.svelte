<script lang="ts">
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { ChevronDown, ChevronUp, Coffee, TrendingUp, AlertTriangle, Clock } from 'lucide-svelte';
	import {
		getFifoCoffeeContext,
		computeFifoScore,
		FIFO_COFFEE_LABELS
	} from '$lib/stores/fifo-coffee.svelte';

	const store = getFifoCoffeeContext();

	let expanded = $state(false);

	const STATUS_CONFIG = {
		peak: {
			label: 'Peak',
			class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
			icon: TrendingUp
		},
		too_fresh: {
			label: 'Πολύ Φρέσκο',
			class: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
			icon: Clock
		},
		expired: {
			label: 'Ληγμένο',
			class: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
			icon: AlertTriangle
		},
		unknown: {
			label: '—',
			class: 'border-border/50 bg-muted/40 text-muted-foreground',
			icon: null
		}
	} as const;

	const scoredCount = $derived(store.items.filter((i) => i.roast_date).length);
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<Coffee class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">FIFO Coffee</h4>
				<p class="text-xs text-muted-foreground">
					{scoredCount}/{store.items.length} καφέδες · score {store.sectionScore}%
				</p>
			</div>
		</div>
		<button
			onclick={() => (expanded = !expanded)}
			class="text-muted-foreground transition-colors hover:text-foreground"
		>
			{#if expanded}
				<ChevronUp class="h-4 w-4" />
			{:else}
				<ChevronDown class="h-4 w-4" />
			{/if}
		</button>
	</div>

	{#if expanded}
		<div class="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80">
			{#each store.items as item (item.coffee_type)}
				{@const computed = computeFifoScore(item.roast_date)}
				{@const cfg = STATUS_CONFIG[computed.status]}

				<div class="flex flex-col gap-2 border-b border-border/30 px-3 py-3 last:border-0">
					<!-- Label + badges row -->
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">{FIFO_COFFEE_LABELS[item.coffee_type]}</span>
						<div class="flex items-center gap-2">
							{#if computed.daysOld !== null}
								<span class="text-xs text-muted-foreground tabular-nums">
									{computed.daysOld} μέρες
								</span>
							{/if}
							<span
								class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium {cfg.class}"
							>
								{#if cfg.icon}
									<cfg.icon class="h-3 w-3" />
								{/if}
								{cfg.label}
							</span>
							{#if item.roast_date}
								<span
									class="rounded-full border border-border/50 px-2 py-0.5 font-mono text-xs font-semibold
									{computed.score === 5
										? 'text-emerald-600 dark:text-emerald-400'
										: computed.score === 3
											? 'text-blue-600 dark:text-blue-400'
											: 'text-red-600 dark:text-red-400'}"
								>
									{computed.score}/5
								</span>
							{/if}
						</div>
					</div>

					<!-- Date picker — binds directly to item.roast_date in $state -->
					<InputCalendar
						id="fifo-{item.coffee_type}"
						bind:value={item.roast_date}
					/>
				</div>
			{/each}

			<!-- Summary footer -->
			{#if scoredCount > 0}
				<div
					class="flex items-center justify-between border-t border-border/40 bg-muted/20 px-3 py-2"
				>
					<span class="text-xs text-muted-foreground">Μέσο Score</span>
					<span
						class="font-mono text-sm font-bold
						{store.sectionScore >= 80
							? 'text-emerald-500'
							: store.sectionScore >= 60
								? 'text-amber-500'
								: 'text-red-500'}"
					>
						{store.sectionScore}%
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
