<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { TrendingUp, TrendingDown, Minus, Store, Scale } from 'lucide-svelte';
	import type { ParsedExcelRow } from './types';

	let { data }: { data: ParsedExcelRow[] } = $props();

	// Summary calculations
	let summary = $derived({
		total: data.length,
		positive: data.filter((r) => r.kilo_difference > 0).length,
		negative: data.filter((r) => r.kilo_difference < 0).length,
		zero: data.filter((r) => r.kilo_difference === 0).length,
		totalDiff: data.reduce((sum, r) => sum + r.kilo_difference, 0)
	});

	function formatNumber(num: number, decimals: number = 1): string {
		return num.toLocaleString('el-GR', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		});
	}

	function formatPercentage(num: number): string {
		const sign = num > 0 ? '+' : '';
		return `${sign}${num.toFixed(2)}%`;
	}
</script>

<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Store class="h-5 w-5 text-primary" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">Σύνολο Καταστημάτων</p>
		</div>
		<div class="mt-4 flex items-baseline justify-between">
			<h2 class="text-3xl font-monospace tabular-nums">{summary.total}</h2>
			<span class="text-xs font-medium text-muted-foreground">Ενεργά</span>
		</div>
	</div>

	<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
				<TrendingUp class="h-5 w-5 text-green-600 dark:text-green-400" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">Θετική Αύξηση</p>
		</div>
		<div class="mt-4 flex items-baseline justify-between">
			<h2 class="text-3xl font-monospace tabular-nums">{summary.positive}</h2>
		</div>
	</div>

	<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
				<TrendingDown class="h-5 w-5 text-red-600 dark:text-red-400" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">Αρνητική Απόδοση</p>
		</div>
		<div class="mt-4 flex items-baseline justify-between">
			<h2 class="text-3xl font-monospace tabular-nums">{summary.negative}</h2>
		</div>
	</div>

	<div class="rounded-xl border border-border/50 bg-muted p-6 shadow-sm">
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
				<Scale class="h-5 w-5 text-blue-600 dark:text-blue-400" />
			</div>
			<p class="text-sm font-medium text-muted-foreground">Συνολική Διαφορά</p>
		</div>
		<div class="mt-4 flex items-baseline justify-between">
			<h2 class="text-3xl font-monospace tabular-nums">
				{formatNumber(summary.totalDiff)}
				<span class="text-base font-monospace text-muted-foreground">kg</span>
			</h2>

			<div
				class="flex items-center text-xs font-medium"
				class:text-green-600={summary.totalDiff > 0}
				class:text-green-400={summary.totalDiff > 0}
				class:text-red-600={summary.totalDiff < 0}
				class:text-red-400={summary.totalDiff < 0}
			>
				{#if summary.totalDiff > 0}
					<TrendingUp class="mr-1 h-3 w-3" /> +Vol
				{:else if summary.totalDiff < 0}
					<TrendingDown class="mr-1 h-3 w-3" /> -Vol
				{:else}
					<span class="text-muted-foreground">Stable</span>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="rounded-md border border-border/50 bg-card">
	<ScrollArea class="h-[600px] w-full rounded-md">
		<div
			class="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-3xl"
		>
			<div class="absolute inset-0 -z-30 bg-background/10"></div>

			<div
				class="absolute -top-24 -left-24 -z-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px]"
			></div>

			<div
				class="absolute -right-24 -bottom-24 -z-20 h-96 w-96 rounded-full bg-secondary/20 blur-[100px]"
			></div>

			<div
				class="absolute top-1/2 left-1/2 -z-20 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]"
			></div>

			<ScrollArea class="h-[600px] w-full">
				<Table.Root class="relative w-full">
					<Table.Header
						class="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-md dark:bg-black/5"
					>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="w-[80px] font-bold text-foreground/80">Org ID</Table.Head>
							<Table.Head class="font-bold text-foreground/80">Κατάστημα</Table.Head>
							<Table.Head class="text-right font-bold text-foreground/80">Τρέχον (kg)</Table.Head>
							<Table.Head class="text-right font-bold text-foreground/80"
								>Προηγούμενο (kg)</Table.Head
							>
							<Table.Head class="text-right font-bold text-foreground/80">Διαφορά</Table.Head>
							<Table.Head class="text-right font-bold text-foreground/80">% Μεταβολή</Table.Head>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#each data as row, index (row.org_id)}
							<Table.Row
								class="border-b border-white/5 transition-all hover:bg-white/10 dark:hover:bg-white/5"
								style="animation-delay: {index * 50}ms;"
							>
								<Table.Cell class="font-mono text-sm opacity-70 mix-blend-plus-lighter"
									>{row.org_id}</Table.Cell
								>
								<Table.Cell class="max-w-[250px] truncate font-medium text-foreground/90">
									{row.store_name}
								</Table.Cell>
								<Table.Cell class="text-right text-foreground/80 tabular-nums">
									{formatNumber(row.current_kilos)}
								</Table.Cell>
								<Table.Cell class="text-right text-foreground/80 tabular-nums">
									{formatNumber(row.previous_kilos)}
								</Table.Cell>
								<Table.Cell class="text-right">
									<span
										class="inline-flex items-center gap-1 font-medium tabular-nums"
										class:text-green-500={row.kilo_difference > 0}
										class:text-red-500={row.kilo_difference < 0}
										class:text-muted-foreground={row.kilo_difference === 0}
									>
										{#if row.kilo_difference > 0}
											<TrendingUp class="h-4 w-4" />
										{:else if row.kilo_difference < 0}
											<TrendingDown class="h-4 w-4" />
										{:else}
											<Minus class="h-4 w-4" />
										{/if}
										{row.kilo_difference > 0 ? '+' : ''}{formatNumber(row.kilo_difference)}
									</span>
								</Table.Cell>
								<Table.Cell class="text-right">
									<Badge
										variant="outline"
										class="border-white/10 bg-white/5 backdrop-blur-md {row.kilo_difference > 0
											? 'text-green-500 shadow-[0_0_10px_-3px_rgba(34,197,94,0.4)]'
											: row.kilo_difference < 0
												? 'text-red-500 shadow-[0_0_10px_-3px_rgba(239,68,68,0.4)]'
												: 'text-gray-500'}"
									>
										{formatPercentage(row.percentage_change)}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</ScrollArea>
		</div>
	</ScrollArea>
</div>
