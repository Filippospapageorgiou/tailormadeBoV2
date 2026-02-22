<script lang="ts">
	import { cn } from '$lib/utils';

	let { score }: { score: number | null } = $props();

	let percentage = $derived(score ?? 0);
	let color = $derived.by(() => {
		if (percentage >= 80) return 'bg-emerald-500';
		if (percentage >= 60) return 'bg-amber-500';
		if (percentage >= 40) return 'bg-orange-500';
		return 'bg-red-500';
	});
	let textColor = $derived.by(() => {
		if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
		if (percentage >= 60) return 'text-amber-600 dark:text-amber-400';
		if (percentage >= 40) return 'text-orange-600 dark:text-orange-400';
		return 'text-red-600 dark:text-red-400';
	});
</script>

{#if score !== null && score !== undefined}
	<div class="flex items-center gap-2.5">
		<div class="h-1.5 w-16 rounded-full bg-muted/60">
			<div
				class={cn('h-1.5 rounded-full transition-all duration-500', color)}
				style="width: {Math.min(percentage, 100)}%"
			></div>
		</div>
		<span class={cn('text-sm font-semibold tabular-nums', textColor)}>
			{score}
		</span>
	</div>
{:else}
	<span class="text-xs text-muted-foreground">—</span>
{/if}