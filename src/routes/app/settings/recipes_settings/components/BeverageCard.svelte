<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, ImageOff } from 'lucide-svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import IngredientsList from './IngredientsList.svelte';
	import EditBeverageDialog from './EditBeverageDialog.svelte';
	import DeleteBeverageDialog from './DeleteBeverageDialog.svelte';

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
	class="group rounded-xl border border-border/50 dark:border-white/10 bg-card 
		   shadow-sm transition-all duration-300 
		   hover:border-primary/30 hover:shadow-md"
>
	<!-- Card Header: ID, Name, Actions -->
	<div class="border-b border-border/50 dark:border-white/10 p-4">
		<div class="flex items-start justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<span class="flex-shrink-0 text-xs font-medium text-primary">#{beverage.id}</span>
				<h3 class="truncate text-base font-semibold text-foreground sm:text-lg">
					{beverage.name}
				</h3>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-shrink-0 gap-1">
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
					onclick={openEditDialog}
				>
					<Pencil class="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 cursor-pointer hover:bg-red-500/10 hover:text-red-500"
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
			<div class="mb-3 overflow-hidden rounded-xl bg-muted">
				<img
					src={beverage.image_url}
					alt={beverage.name}
					class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			</div>
		{:else}
			<div
				class="mb-3 flex h-48 items-center justify-center rounded-xl 
					   bg-muted text-muted-foreground"
			>
				<div class="flex flex-col items-center gap-2">
					<ImageOff class="h-8 w-8" />
					<span class="text-xs">No image</span>
				</div>
			</div>
		{/if}

		<!-- Description -->
		{#if beverage.description}
			<p class="mb-3 line-clamp-2 text-sm text-muted-foreground">
				{beverage.description}
			</p>
		{:else}
			<p class="mb-3 text-sm italic text-muted-foreground/60">No description available</p>
		{/if}

		<!-- Execution Preview -->
		{#if beverage.execution}
			<div class="mb-3 rounded-lg bg-muted/50 dark:bg-muted/30 p-3">
				<p class="text-xs font-medium text-foreground mb-1">Execution:</p>
				<p class="line-clamp-2 text-xs text-muted-foreground">
					{beverage.execution}
				</p>
			</div>
		{/if}
	</div>

	<!-- Accordion: Ingredients -->
	<Accordion.Root type="multiple" bind:value={accordionValue} class="border-t border-border/50 dark:border-white/10">
		<Accordion.Item value="ingredients" class="border-b-0">
			<Accordion.Trigger
				class="flex w-full items-center justify-between px-4 py-3 
					   text-sm font-medium text-foreground 
					   hover:bg-muted/50 transition-colors"
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
<DeleteBeverageDialog bind:open={deletingBeverage} {beverage} {onUpdate} />