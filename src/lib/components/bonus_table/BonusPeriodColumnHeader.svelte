<script lang="ts">
	import type { Column } from '@tanstack/table-core';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	type Props<TData, TValue> = {
		column: Column<TData, TValue>;
		title: string;
		class?: string;
	};

	let { column, title, class: className }: Props<any, any> = $props();

	let sortDirection = $derived(column.getIsSorted());
</script>

{#if column.getCanSort()}
	<Button
		variant="ghost"
		size="sm"
		class={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}
		onclick={() => column.toggleSorting()}
	>
		<span>{title}</span>
		{#if sortDirection === 'desc'}
			<ArrowDown class="ml-2 h-4 w-4" />
		{:else if sortDirection === 'asc'}
			<ArrowUp class="ml-2 h-4 w-4" />
		{:else}
			<ArrowUpDown class="ml-2 h-4 w-4 text-muted-foreground" />
		{/if}
	</Button>
{:else}
	<span class={className}>{title}</span>
{/if}