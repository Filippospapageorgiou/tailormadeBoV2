<script lang="ts">
	import { getBeverageIngredients, removeIngredientFromBeverage, updateRecipeIngredient } from '../data.remote';
	import { getIngridients } from '../../ingridients_settings/data.remote';
	import type { RecipeIngredient } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Trash2, Plus, Pencil, Save, X } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { addIngredientToBeverage } from '../data.remote';

	let { beverageId }: { beverageId: number } = $props();

	
	let query = getBeverageIngredients({ beverageId: beverageId.toString() });
	let ingredients = $derived(query.current?.ingredients ?? []);


	let allIngredientsQuery = getIngridients();
	let allIngredients = $derived(allIngredientsQuery.current?.ingredients ?? []);


	let editingIngredientId = $state<number | null>(null);
	let editFormData = $state({ quantity: 0, notes: '' });

	let addingIngredient = $state(false);
	let addFormData = $state({
		ingredient_id: '',
		quantity: 0,
		notes: ''
	});

	function startEdit(ingredient: RecipeIngredient) {
		editingIngredientId = ingredient.id;
		editFormData = {
			quantity: ingredient.quantity,
			notes: ingredient.notes || ''
		};
	}

	function cancelEdit() {
		editingIngredientId = null;
		editFormData = { quantity: 0, notes: '' };
	}

	async function handleUpdate(id: number) {
		showProgress('Updating ingredient...');
		
		try {
			const result = await updateRecipeIngredient({
				id,
				quantity: editFormData.quantity,
				notes: editFormData.notes
			});

			if (result.success) {
				await query.refresh();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message;
				cancelEdit();
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

	async function handleRemove(id: number) {
		showProgress('Removing ingredient...');
		
		try {
			const result = await removeIngredientFromBeverage({
				recipeIngredientId: id.toString()
			});

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
				toast.text = result.message || 'Failed to remove ingredient.';
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
		if (!addFormData.ingredient_id || addFormData.quantity <= 0) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = 'Please select an ingredient and enter a valid quantity.';
			return;
		}

		showProgress('Adding ingredient...');
		addingIngredient = false;

		try {
			const result = await addIngredientToBeverage({
				beverage_id: beverageId,
				ingredient_id: parseInt(addFormData.ingredient_id, 10),
				quantity: addFormData.quantity,
				notes: addFormData.notes
			});

			if (result.success) {
				await query.refresh();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message;
				addFormData = { ingredient_id: '', quantity: 0, notes: '' };
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

	// Get ingredient name by ID for the select
	let selectedIngredientName = $derived(() => {
		if (!addFormData.ingredient_id) return 'Select ingredient';
		const ingredient = allIngredients.find(ing => ing.id === parseInt(addFormData.ingredient_id, 10));
		return ingredient ? ingredient.name : 'Select ingredient';
	});
</script>

<div class="space-y-3">
	{#if query.loading}
		<!-- Loading State -->
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="flex items-center justify-between rounded-md border border-gray-200 p-3">
					<div class="flex-1 space-y-2">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-3 w-24" />
					</div>
					<Skeleton class="h-8 w-8" />
				</div>
			{/each}
		</div>
	{:else if ingredients.length === 0}
		<!-- Empty State -->
		<div class="rounded-md border border-dashed border-gray-300 p-6 text-center">
			<p class="mb-2 text-sm text-neutral-600">No ingredients added yet</p>
			<p class="mb-3 text-xs text-neutral-400">Start building your recipe</p>
			<Button
				variant="default"
				size="sm"
				class="cursor-pointer gap-2"
				onclick={() => (addingIngredient = true)}
			>
				<Plus class="h-4 w-4" />
				Add First Ingredient
			</Button>
		</div>
	{:else}
		<!-- Ingredients List -->
		<div class="space-y-2">
			{#each ingredients as ingredient (ingredient.id)}
				<div
					class="rounded-md border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
				>
					{#if editingIngredientId === ingredient.id}
						<!-- Edit Mode -->
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<Input
									type="number"
									bind:value={editFormData.quantity}
									placeholder="Quantity"
									class="w-24"
								/>
								<span class="text-sm text-neutral-600">
									{ingredient.ingredients.measurement_unit}
								</span>
								<span class="flex-1 text-sm font-medium text-neutral-800">
									{ingredient.ingredients.name}
								</span>
							</div>
							<Input
								bind:value={editFormData.notes}
								placeholder="Notes (optional)"
								class="text-sm"
							/>
							<div class="flex gap-2">
								<Button
									variant="default"
									size="sm"
									class="cursor-pointer gap-1"
									onclick={() => handleUpdate(ingredient.id)}
								>
									<Save class="h-3 w-3" />
									Save
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="cursor-pointer gap-1"
									onclick={cancelEdit}
								>
									<X class="h-3 w-3" />
									Cancel
								</Button>
							</div>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-baseline gap-2">
									<span class="font-medium text-neutral-800">
										{ingredient.ingredients.name}
									</span>
									<span class="text-sm text-[#8B6B4A]">
										{ingredient.quantity} {ingredient.ingredients.measurement_unit}
									</span>
								</div>
								{#if ingredient.notes}
									<p class="mt-1 text-xs text-neutral-500">{ingredient.notes}</p>
								{/if}
							</div>
							<div class="flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7 cursor-pointer hover:bg-[#8B6B4A]/10 hover:text-[#8B6B4A]"
									onclick={() => startEdit(ingredient)}
								>
									<Pencil class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7 cursor-pointer hover:bg-red-50 hover:text-red-600"
									onclick={() => handleRemove(ingredient.id)}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Add Ingredient Button -->
		<Button
			variant="default"
			size="sm"
			class="w-full cursor-pointer gap-2"
			onclick={() => (addingIngredient = true)}
		>
			<Plus class="h-4 w-4" />
			Add Ingredient
		</Button>
	{/if}
</div>

<!-- Add Ingredient Dialog -->
<Dialog.Root bind:open={addingIngredient}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Add Ingredient to Recipe</Dialog.Title>
			<Dialog.Description>
				Select an ingredient and specify the quantity needed for this recipe.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Ingredient</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={addFormData.ingredient_id}>
						<Select.Trigger class="w-full">
							{selectedIngredientName()}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Available Ingredients</Select.Label>
								{#each allIngredients as ingredient}
									<Select.Item value={ingredient.id.toString()} label={ingredient.name}>
										{ingredient.name} ({ingredient.measurement_unit})
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-quantity" class="text-right">Quantity</Label>
				<Input
					id="add-quantity"
					type="number"
					bind:value={addFormData.quantity}
					class="col-span-3"
					placeholder="e.g., 250"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-notes" class="text-right">Notes</Label>
				<Input
					id="add-notes"
					bind:value={addFormData.notes}
					class="col-span-3"
					placeholder="Optional notes"
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (addingIngredient = false)}>Cancel</Button>
			<Button onclick={handleAdd}>Add Ingredient</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>



