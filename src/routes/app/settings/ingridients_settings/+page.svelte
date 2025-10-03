<script lang="ts">
	import { getIngridients, deleteIngredient, editIngredient, addIngredient } from './data.remote';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { X, Pencil, Trash2, RefreshCcw, Plus } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Ingredient } from '$lib/models/database.types';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const unitItems = $state([
		{ value: 'γραμμάρια (g)', label: 'γραμμάρια (g)' },
		{ value: 'κιλά (kg)', label: 'κιλά (kg)' },
		{ value: 'μιλιλίτρα (ml)', label: 'μιλιλίτρα (ml)' },
		{ value: 'λίτρα (l)', label: 'λίτρα (l)' },
		{ value: 'κουταλιά της σούπας (tbsp)', label: 'κουταλιά της σούπas (tbsp)' }
	]);

	let query = getIngridients();

	let refreshAction = $state(false);
	async function refresh() {
		refreshAction = true;
		await query.refresh();
		clearAllFilters();
		refreshAction = false;
	}

	let allIngridients = $derived(query.current?.ingredients ?? []);
	let searchQuery = $state('');

	let categories = $derived([...new Set(allIngridients.map((i) => i.category).filter(Boolean))]);

	let filteredIngridients = $derived(() => {
		let ingredients = allIngridients;

		if (value) {
			ingredients = ingredients.filter((i) => i.category === value);
		}

		if (searchQuery) {
			ingredients = ingredients.filter(
				(ingridient) =>
					ingridient.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
					(ingridient.description &&
						ingridient.description.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
			);
		}
		return ingredients;
	});

	let value = $state('');

	const triggerContent = $derived(categories.find((c) => c === value) ?? 'select a category');

	let editingIngredient = $state<Ingredient | null>(null);
	let editFormData = $state({
		name: '',
		category: '',
		measurement_unit: '',
		description: ''
	});

	let addingIngredient = $state(false);
	let addFormData = $state({
		name: '',
		category: '',
		measurement_unit: '',
		description: ''
	});

	// Delete dialog state
	let deletingIngredient = $state<Ingredient | null>(null);

	function clearSearch() {
		searchQuery = '';
	}

	function clearAllFilters() {
		value = '';
		searchQuery = '';
	}

	function openEditDialog(ingredient: Ingredient) {
		editingIngredient = ingredient;
		editFormData = {
			name: ingredient.name,
			category: ingredient.category || '',
			measurement_unit: ingredient.measurement_unit || '',
			description: ingredient.description || ''
		};
	}

	function openDeleteDialog(ingredient: Ingredient) {
		deletingIngredient = ingredient;
	}

	async function handleEdit() {
		if (!editingIngredient) return;
		let id = editingIngredient.id;
		editingIngredient = null;
		showProgress('Updating ingredient...');

		try {
			const result = await editIngredient({
				id: id,
				...editFormData
			});
			editingIngredient = null;

			if (result.success) {
				await query.refresh();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message;
			} else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result.message || 'Failed to update ingredient.';
			}
		} catch (error: any) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = error.message || 'An unexpected error occurred.';
		} finally {
			hideProgress();
		}
	}

	async function handleAdd() {
		addingIngredient = false;
		showProgress('Adding ingredient...');

		try {
			const result = await addIngredient(addFormData);

			if (result.success) {
				await query.refresh();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message;
				addFormData = { name: '', category: '', measurement_unit: '', description: '' };
			} else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result.message || 'Failed to add ingredient.';
			}
		} catch (error: any) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = error.message || 'An unexpected error occurred.';
		} finally {
			hideProgress();
		}
	}

	let returnMessage = $state('');
	async function handleDelete(id: number) {
		if (!id) return;

		showProgress('Deleting ingredient...');
		deletingIngredient = null;

		try {
			const result = await deleteIngredient({ ingridientId: id.toString() });
			returnMessage = result.message;
			if (result.success) {
				await query.refresh();
			} else {
				console.error('Failed to delete:', result.message);
			}
		} catch (error) {
			console.error('Error deleting ingredient:', error);
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = returnMessage;
		} finally {
			hideProgress();
			toast.show = true;
			toast.status = true;
			toast.title = 'Success';
			toast.text = returnMessage;
		}
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Our ingredients
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Πρόσθεσε, διάγραψε, ενήμερωσε τα υλίκα για να φτιαξούμε τις συντάγες μας
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Διαθέσιμα Συστατικά: <span class="font-semibold">{filteredIngridients()?.length}</span>
						/ {allIngridients.length}
					</p>
					{#if value || searchQuery}
						<Button
							variant="secondary"
							size="sm"
							onclick={clearAllFilters}
							class="h-6 cursor-pointer px-2 text-xs"
						>
							<X class="mr-1 h-3 w-3" />
							Clear filters
						</Button>
					{/if}
				</div>
			</div>

			<!-- Filters Section -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<!-- Category Select -->
					<div class="flex items-center gap-2">
						<Select.Root type="single" name="filterCategory" bind:value>
							<Select.Trigger class="w-full sm:w-[180px]">
								{triggerContent}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Categories</Select.Label>
									{#each categories as category}
										<Select.Item value={category ?? ''} label={category}>
											{category}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Search Input -->
				<div class="relative flex items-center gap-2">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								><Button
									variant="default"
									size="sm"
									class="h-6 cursor-pointer px-2 text-xs"
									onclick={() => (addingIngredient = true)}
								>
									<Plus class="mr-1 h-3 w-3" />
								</Button></Tooltip.Trigger
							>
							<Tooltip.Content>
								<p>Add Ingridient</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								><Button
									variant="secondary"
									size="sm"
									onclick={refresh}
									disabled={refreshAction}
									class="h-6 cursor-pointer px-2 text-xs"
								>
									<RefreshCcw class={`mr-2 h-4 w-4 ${refreshAction ? 'animate-spin-clockwise' : ''}`} />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Refresh ingridients</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Input
						bind:value={searchQuery}
						class="w-full py-1 pr-8 sm:w-72"
						placeholder="Filter Ingredients..."
					/>
					{#if searchQuery}
						<Button
							variant="ghost"
							size="icon"
							onclick={clearSearch}
							class="absolute right-1 h-7 w-7"
						>
							<X class="h-3 w-3" />
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Ingredients Grid -->
		{#if query.loading}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each Array(20) as _}
					<div
						class="group relative rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300"
					>
						<div class="mb-2 flex items-start justify-between">
							<div class="flex items-center">
								<Skeleton class="mr-1 h-4 w-8" />
								<Skeleton class="h-4 w-24" />
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2">
							<div class="flex items-center justify-between">
								<Skeleton class="h-5 w-20 rounded-full" />
								<Skeleton class="h-4 w-10" />
							</div>
							<Skeleton class="mt-1 h-4 w-full" />
							<Skeleton class="h-4 w-4/5" />

							<div class="mt-1 text-right">
								<Skeleton class="inline-block h-3 w-16" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredIngridients().length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<p class="mb-2 text-lg font-medium text-neutral-600">No ingredients found</p>
				<p class="text-sm text-neutral-400">Try adjusting your filters</p>
				<Button variant="outline" onclick={clearAllFilters} class="mt-4">Clear all filters</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each filteredIngridients() as ingredient (ingredient.id)}
					<div
						class="group relative rounded-lg border border-gray-100 bg-white p-3 shadow-sm
                    transition-all duration-300 hover:border-[#8B6B4A]/20 hover:shadow-md"
					>
						<!-- Header with ID, Name and Action Buttons -->
						<div class="mb-2 flex items-start justify-between gap-2">
							<div class="flex min-w-0 flex-1 items-center">
								<span class="mr-1 flex-shrink-0 text-xs text-[#8B6B4A]">#{ingredient.id}</span>
								<h3 class="truncate pl-1 text-sm font-medium text-neutral-800 sm:text-base">
									{ingredient.name}
								</h3>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-shrink-0 gap-1 transition-opacity">
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7 hover:bg-[#8B6B4A]/10 hover:text-[#8B6B4A]"
									onclick={() => openEditDialog(ingredient)}
								>
									<Pencil class="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7 hover:bg-red-50 hover:text-red-600"
									onclick={() => openDeleteDialog(ingredient)}
								>
									<Trash2 class="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-1">
							<div class="flex items-center justify-between">
								<span class="rounded-full bg-[#8B6B4A]/10 px-1.5 py-0.5 text-xs text-[#8B6B4A]">
									{ingredient.category || 'Χωρίς κατηγορία'}
								</span>
								<span class="text-xs text-neutral-700">
									{ingredient.measurement_unit || '-'}
								</span>
							</div>
							{#if ingredient.description}
								<p class="line-clamp-2 text-xs text-neutral-600">{ingredient.description}</p>
							{/if}

							<div class="text-right">
								<span class="text-xs text-neutral-400">
									{new Date(ingredient.updated_at).toLocaleDateString('el-GR')}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Edit Dialog -->
<Dialog.Root
	open={editingIngredient !== null}
	onOpenChange={(open) => !open && (editingIngredient = null)}
>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Edit Ingredient</Dialog.Title>
			<Dialog.Description>
				Make changes to the ingredient. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="edit-name" class="text-right">Name</Label>
				<Input id="edit-name" bind:value={editFormData.name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Category</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={editFormData.category}>
						<Select.Trigger class="w-full">
							{editFormData.category || 'Select a category'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Categories</Select.Label>
								{#each categories as category}
									<Select.Item value={category ?? ''} label={category}>
										{category}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="edit-unit" class="text-right">Unit</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={editFormData.measurement_unit}>
						<Select.Trigger class="w-full">
							{editFormData.measurement_unit || 'Select a category'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Measurment unit</Select.Label>
								{#each unitItems as unitItem}
									<Select.Item value={unitItem.value ?? ''} label={unitItem.label}>
										{unitItem.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="edit-description" class="text-right">Description</Label>
				<Input id="edit-description" bind:value={editFormData.description} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (editingIngredient = null)}>Cancel</Button>
			<Button onclick={handleEdit}>Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Add Dialog -->
<Dialog.Root open={addingIngredient} onOpenChange={(open) => !open && (addingIngredient = false)}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Add New Ingredient</Dialog.Title>
			<Dialog.Description>Fill in the details for the new ingredient.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-name" class="text-right">Name</Label>
				<Input id="add-name" bind:value={addFormData.name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Category</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={addFormData.category}>
						<Select.Trigger class="w-full">
							{addFormData.category || 'Select a category'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Categories</Select.Label>
								{#each categories as category}
									<Select.Item value={category ?? ''} label={category}>
										{category}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-unit" class="text-right">Unit</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={addFormData.measurement_unit}>
						<Select.Trigger class="w-full">
							{addFormData.measurement_unit || 'Select a unit'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Measurement unit</Select.Label>
								{#each unitItems as unitItem}
									<Select.Item value={unitItem.value ?? ''} label={unitItem.label}>
										{unitItem.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-description" class="text-right">Description</Label>
				<Input id="add-description" bind:value={addFormData.description} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (addingIngredient = false)}>Cancel</Button>
			<Button onclick={handleAdd}>Add Ingredient</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root
	open={deletingIngredient !== null}
	onOpenChange={(open) => !open && (deletingIngredient = null)}
>
	<Dialog.Content class="rounded-2xl p-6 shadow-lg sm:max-w-[425px]">
		<Dialog.Header class="space-y-3">
			<Dialog.Title class="text-xl font-semibold">Delete Ingredient</Dialog.Title>
			<Dialog.Description class="text-sm leading-relaxed text-gray-600">
				Are you sure you want to delete
				<span class="font-medium text-gray-900">
					"{deletingIngredient?.name}"
				</span>
				? This action
				<span class="font-semibold text-red-500">cannot</span> be undone.
				<br />
				<span class="mt-2 block font-semibold text-gray-800">
					Used in
					<span class="font-semiblod"
						>{deletingIngredient?.recipe_ingredients?.[0]?.count ?? 0}</span
					>
					recipe(s).
				</span>
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-100"
				onclick={() => (deletingIngredient = null)}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="cursor-pointer bg-red-600 font-medium text-white shadow-md hover:bg-red-700"
				onclick={() => deletingIngredient?.id !== undefined && handleDelete(deletingIngredient.id)}
			>
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
