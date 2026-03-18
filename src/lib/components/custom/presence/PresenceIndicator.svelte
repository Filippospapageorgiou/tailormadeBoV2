<script lang="ts">
	import { cn } from '$lib/utils';
	import type { PresenceStatus } from '$lib/models/presence.types';

	let { status, size = 'md' }: { status: PresenceStatus; size?: 'sm' | 'md' | 'lg' } = $props();

	const sizeMap = {
		sm: 'h-2 w-2',
		md: 'h-2.5 w-2.5',
		lg: 'h-3 w-3'
	} as const;

	const label = $derived(status === 'active' ? 'Ενεργός' : 'Αδρανής');
</script>

<span
	class={cn(
		'relative inline-block rounded-full',
		sizeMap[size],
		status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'
	)}
	title={label}
>
	{#if status === 'active'}
		<span
			class={cn(
				'absolute inset-0 animate-ping rounded-full opacity-75',
				'bg-emerald-500'
			)}
		></span>
	{/if}
</span>
