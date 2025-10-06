<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import IngredientsList from './IngredientsList.svelte';
    import EditBeverageDialog from './EditBeverageDialog.svelte';

	let {
		beverage,
		onUpdate
	}: {
		beverage: Beverage;
		onUpdate: () => Promise<void>;
	} = $props();

	let editingBeverage = $state(false);
	let deletingBeverage = $state(false);
	let accordionValue = $state<string[]>([]);

	function openEditDialog() {
		editingBeverage = true;
	}

	function openDeleteDialog() {
		deletingBeverage = true;
	}
</script>

<div
	class="group rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-[#8B6B4A]/20 hover:shadow-md"
>
	<!-- Card Header: ID, Name, Actions -->
	<div class="border-b border-gray-100 p-4">
		<div class="mb-2 flex items-start justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<span class="flex-shrink-0 text-xs text-[#8B6B4A]">#{beverage.id}</span>
				<h3 class="truncate text-base font-semibold text-neutral-800 sm:text-lg">
					{beverage.name}
				</h3>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-shrink-0 gap-1">
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 cursor-pointer hover:bg-[#8B6B4A]/10 hover:text-[#8B6B4A]"
					onclick={openEditDialog}
				>
					<Pencil class="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 cursor-pointer hover:bg-red-50 hover:text-red-600"
					onclick={openDeleteDialog}
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>

	<!-- Card Body: Image & Description -->
	<div class="p-4">
		<!-- Beverage Image -->
		{#if beverage.image_url}
			<div class="mb-3 overflow-hidden rounded-lg">
				<img
					src={beverage.image_url}
					alt={beverage.name}
					class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			</div>
		{:else}
			<div
				class="mb-3 flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
			>
				<span class="text-sm">No image</span>
			</div>
		{/if}

		<!-- Description -->
		{#if beverage.description}
			<p class="mb-3 line-clamp-1 text-sm text-neutral-600">
				{beverage.description}
			</p>
		{:else}
			<p class="mb-3 text-sm italic text-neutral-400">No description available</p>
		{/if}

		
		{#if beverage.execution}
			<div class="mb-3 rounded-md bg-gray-50 p-2">
				<p class="text-xs font-medium text-neutral-700">Execution:</p>
				<p class="line-clamp-2 text-xs text-neutral-600">
					{beverage.execution}
				</p>
			</div>
		{/if}
	</div>

	<!-- Accordion: Ingredients -->
	<Accordion.Root type="multiple" bind:value={accordionValue} class="border-t border-gray-100">
		<Accordion.Item value="ingredients">
			<Accordion.Trigger
				class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-gray-50"
			>
				<span>Υλικά</span>
			</Accordion.Trigger>
			<Accordion.Content class="px-4 pb-4">
				<IngredientsList beverageId={beverage.id} />
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

<EditBeverageDialog bind:open={editingBeverage} {beverage} {onUpdate} />