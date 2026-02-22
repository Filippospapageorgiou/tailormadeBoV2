<script lang="ts">
	import { CheckCircle, Clock, RefreshCcw, Send } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { status }: { status: string } = $props();

	const config: Record<string, { label: string; icon: any; classes: string }> = {
		draft: {
			label: 'Πρόχειρο',
			icon: Clock,
			classes: 'bg-muted text-muted-foreground'
		},
		submitted: {
			label: 'Υποβλήθηκε',
			icon: Send,
			classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
		},
		reviewed: {
			label: 'Αξιολογήθηκε',
			icon: CheckCircle,
			classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
		},
		reopened: {
			label: 'Επαναλήφθηκε',
			icon: RefreshCcw,
			classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
		}
	};

	let cfg = $derived(config[status] ?? config.draft);
	let Icon = $derived(cfg.icon);
</script>

<div class={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.classes)}>
	<Icon class="h-3 w-3" />
	{cfg.label}
</div>