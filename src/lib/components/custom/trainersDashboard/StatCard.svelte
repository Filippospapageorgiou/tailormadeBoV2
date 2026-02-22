<script lang="ts">
	import type { Component } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let {
		title = '',
		value = '',
		description = '',
		icon: Icon,
		trend,
		loading = false
	}: {
		title: string;
		value: string | number;
		description?: string;
		icon?: Component;
		trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
		loading?: boolean;
	} = $props();

	let trendPositive = $derived(trend?.direction === 'up');
	let trendNegative = $derived(trend?.direction === 'down');
</script>

<Card.Root
	class="group w-auto relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
>
	<!-- Subtle top accent line using your --primary (gold in light, white in dark) -->
	<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

	<Card.Content class="p-5">
		<!-- Header: title + icon -->
		<div class="mb-4 flex items-start justify-between">
			<p class="font-tailormade text-[13px] font-medium tracking-wide text-muted-foreground">
				{title}
			</p>
			{#if Icon}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary"
				>
					<Icon size={14} strokeWidth={1.75} />
				</div>
			{/if}
		</div>

		<!-- Value + trend badge -->
		<div class="flex items-end gap-3">
			{#if loading}
				<Skeleton class="h-9 w-28 rounded-md" />
			{:else}
				<span class="font-tailormade text-[2rem] font-semibold leading-none tracking-tight text-foreground">
					{value}
				</span>
			{/if}

			{#if trend && !loading}
				<div
					class={cn(
						'mb-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold',
						trendPositive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
						trendNegative && 'bg-destructive/10 text-destructive',
						!trendPositive && !trendNegative && 'bg-muted text-muted-foreground'
					)}
				>
					{#if trendPositive}
						<TrendingUp size={11} strokeWidth={2.5} />
					{:else if trendNegative}
						<TrendingDown size={11} strokeWidth={2.5} />
					{:else}
						<Minus size={11} strokeWidth={2.5} />
					{/if}
					{Math.abs(trend.value)}%
				</div>
			{/if}
		</div>

		<!-- Description -->
		{#if description && !loading}
			<p class="mt-2 text-[12px] text-muted-foreground/60">{description}</p>
		{/if}
	</Card.Content>
</Card.Root>