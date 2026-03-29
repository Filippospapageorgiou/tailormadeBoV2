<script lang="ts">
	import { cn } from '$lib/utils';

	let { status = 'in_progress' }: { status: string } = $props();

	const statusConfig: Record<string, { label: string; classes: string }> = {
		completed: {
			label: 'Ολοκληρωμένη',
			classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
		},
		in_progress: {
			label: 'Σε εξέλιξη',
			classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
		}
	};

	let config = $derived(
		statusConfig[status] ?? { label: status, classes: 'bg-muted text-muted-foreground' }
	);
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
		config.classes
	)}
>
	{config.label}
</span>
