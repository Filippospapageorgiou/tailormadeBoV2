<script lang="ts">
	import { getIngridients,
		addIngredient,
		editIngredient,
		deleteIngredient
	 } from '../data.remote';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { X, Pencil, Trash2, RefreshCcw, Plus, Package, Filter, Search } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Ingredient } from '$lib/models/database.types';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from 'svelte-sonner';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	const unitItems = [
		{ value: 'γραμμάρια (g)', label: 'γραμμάρια (g)' },
		{ value: 'κιλά (kg)', label: 'κιλά (kg)' },
		{ value: 'μιλιλίτρα (ml)', label: 'μιλιλίτρα (ml)' },
		{ value: 'λίτρα (l)', label: 'λίτρα (l)' },
		{ value: 'κουταλιά της σούπας (tbsp)', label: 'κουταλιά της σούπας (tbsp)' }
	];

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

	const triggerContent = $derived(categories.find((c) => c === value) ?? 'Όλες οι κατηγορίες');

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

	let deletingIngredient = $state<Ingredient | null>(null);
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	// Category color mapping for visual variety
	const categoryColors: Record<string, string> = {};
	const colorPalette = [
		'bg-blue-500/10 text-blue-700 dark:text-blue-400',
		'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
		'bg-violet-500/10 text-violet-700 dark:text-violet-400',
		'bg-amber-500/10 text-amber-700 dark:text-amber-400',
		'bg-rose-500/10 text-rose-700 dark:text-rose-400',
		'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
		'bg-orange-500/10 text-orange-700 dark:text-orange-400',
		'bg-pink-500/10 text-pink-700 dark:text-pink-400'
	];

	function getCategoryColor(category: string | null): string {
		if (!category) return 'bg-muted text-muted-foreground';
		if (!categoryColors[category]) {
			const index = Object.keys(categoryColors).length % colorPalette.length;
			categoryColors[category] = colorPalette[index];
		}
		return categoryColors[category];
	}

	// Stats
	let stats = $derived.by(() => {
		const catCounts: Record<string, number> = {};
		for (const ing of allIngridients) {
			const cat = ing.category || 'Χωρίς κατηγορία';
			catCounts[cat] = (catCounts[cat] || 0) + 1;
		}
		return { total: allIngridients.length, categories: categories.length, catCounts };
	});

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
		deleteDialogOpen = true;
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
				showSuccessToast('Επιτυχία', result.message);
			} else {
				showFailToast('Σφάλμα', result.message);
			}
		} catch (error: any) {
			showFailToast('Σφάλμα', error.message);
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
				showSuccessToast('Επιτυχία', result.message);
				addFormData = { name: '', category: '', measurement_unit: '', description: '' };
			} else {
				showFailToast('Σφάλμα', result.message);
			}
		} catch (error: any) {
			showFailToast('Σφάλμα', error.message);
		} finally {
			hideProgress();
		}
	}

	async function handleDelete() {
		if (!deletingIngredient) return;

		isDeleting = true;
		try {
			const result = await deleteIngredient({ ingridientId: deletingIngredient.id.toString() });
			if (result.success) {
				toast.success(result.message);
				await query.refresh();
				deleteDialogOpen = false;
				deletingIngredient = null;
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			console.error('Error deleting ingredient:', error);
			toast.error(error.message);
		} finally {
			isDeleting = false;
		}
	}

	function cancelDelete() {
		deleteDialogOpen = false;
		deletingIngredient = null;
	}
</script>

<div class="space-y-6">
	<!-- Stats Row -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div
			class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-xs font-medium tracking-wide uppercase text-muted-foreground">
						Σύνολο
					</p>
					<p class="text-2xl font-bold tabular-nums tracking-tight">{stats.total}</p>
				</div>
				<div
					class="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15"
				>
					<Package class="h-5 w-5" />
				</div>
			</div>
			<p class="mt-2 text-[11px] text-muted-foreground">Συνολικά συστατικά</p>
		</div>

		<div
			class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-xs font-medium tracking-wide uppercase text-muted-foreground">
						Κατηγορίες
					</p>
					<p class="text-2xl font-bold tabular-nums tracking-tight">{stats.categories}</p>
				</div>
				<div
					class="rounded-lg bg-violet-500/10 p-2.5 text-violet-600 transition-colors group-hover:bg-violet-500/15 dark:text-violet-400"
				>
					<Filter class="h-5 w-5" />
				</div>
			</div>
			<p class="mt-2 text-[11px] text-muted-foreground">Διαφορετικές κατηγορίες</p>
		</div>

		<div
			class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-xs font-medium tracking-wide uppercase text-muted-foreground">
						Φιλτραρισμένα
					</p>
					<p class="text-2xl font-bold tabular-nums tracking-tight">
						{filteredIngridients()?.length}
					</p>
				</div>
				<div
					class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400"
				>
					<Search class="h-5 w-5" />
				</div>
			</div>
			<p class="mt-2 text-[11px] text-muted-foreground">Αποτελέσματα αναζήτησης</p>
		</div>

		<!-- Top Category -->
		<div
			class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-xs font-medium tracking-wide uppercase text-muted-foreground">
						Κορυφαία
					</p>
					<p class="truncate text-lg font-bold tracking-tight">
						{#if Object.entries(stats.catCounts).length > 0}
							{Object.entries(stats.catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'}
						{:else}
							-
						{/if}
					</p>
				</div>
				<div
					class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 transition-colors group-hover:bg-amber-500/15 dark:text-amber-400"
				>
					<Package class="h-5 w-5" />
				</div>
			</div>
			<p class="mt-2 text-[11px] text-muted-foreground">Κατηγορία με τα περισσότερα</p>
		</div>
	</div>

	<!-- Toolbar -->
	<div
		class="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex items-center gap-2">
			<Button
				variant="default"
				size="sm"
				class="h-8 cursor-pointer gap-2 px-3"
				onclick={() => (addingIngredient = true)}
			>
				<Plus class="h-4 w-4" />
				<span class="hidden sm:inline">Προσθήκη</span>
			</Button>

			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="secondary"
							size="sm"
							onclick={refresh}
							disabled={refreshAction}
							class="h-8 cursor-pointer px-3"
						>
							<RefreshCcw
								class={`h-4 w-4 ${refreshAction ? 'animate-spin-clockwise repeat-infinite' : ''}`}
							/>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Ανανέωση</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>

			<Select.Root type="single" name="filterCategory" bind:value>
				<Select.Trigger class="h-8 w-[170px] text-xs">
					{triggerContent}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Κατηγορίες</Select.Label>
						{#each categories as category}
							<Select.Item value={category ?? ''} label={category}>
								{category}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			{#if value || searchQuery}
				<Button
					variant="ghost"
					size="sm"
					onclick={clearAllFilters}
					class="h-8 cursor-pointer gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
				>
					<X class="h-3 w-3" />
					Καθαρισμός
				</Button>
			{/if}
		</div>

		<div class="relative flex items-center">
			<Search class="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				class="h-8 w-full py-1 pl-8 pr-8 text-sm sm:w-64"
				placeholder="Αναζήτηση συστατικών..."
			/>
			{#if searchQuery}
				<Button
					variant="ghost"
					size="icon"
					onclick={clearSearch}
					class="absolute right-1 h-6 w-6"
				>
					<X class="h-3 w-3" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- Content -->
	{#if query.loading}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(12) as _}
				<div class="rounded-xl border border-border/60 bg-card p-4">
					<div class="mb-3 flex items-center justify-between">
						<Skeleton class="h-5 w-28" />
						<Skeleton class="h-5 w-16 rounded-full" />
					</div>
					<Skeleton class="mb-2 h-4 w-full" />
					<Skeleton class="mb-3 h-4 w-3/4" />
					<div class="flex items-center justify-between">
						<Skeleton class="h-4 w-20" />
						<Skeleton class="h-4 w-12" />
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredIngridients().length === 0}
		<EmptyComp
			title={'Δεν βρέθηκαν συστατικά'}
			description={'Δοκιμάστε να αλλάξετε την αναζήτηση'}
			icon={Package as any}
			primaryLabel="Καθαρισμός Φίλτρων"
			onPrimaryClick={clearAllFilters}
			primaryIcon={X as any}
		/>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredIngridients() as ingredient (ingredient.id)}
				<div
					class="group relative flex flex-col rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md"
				>
					<!-- Top row: category badge + actions -->
					<div class="mb-3 flex items-start justify-between gap-2">
						<Badge
							variant="secondary"
							class={`text-[11px] font-medium ${getCategoryColor(ingredient.category ?? null)}`}
						>
							{ingredient.category || 'Χωρίς κατηγορία'}
						</Badge>

						<div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 hover:bg-primary/10 hover:text-primary"
								onclick={() => openEditDialog(ingredient)}
							>
								<Pencil class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
								onclick={() => openDeleteDialog(ingredient)}
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>

					<!-- Name -->
					<h3 class="mb-1 text-sm font-semibold text-foreground">{ingredient.name}</h3>

					<!-- Description -->
					{#if ingredient.description}
						<p class="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
							{ingredient.description}
						</p>
					{:else}
						<p class="mb-3 text-xs italic text-muted-foreground/50">Χωρίς περιγραφή</p>
					{/if}

					<!-- Bottom row -->
					<div class="mt-auto flex items-center justify-between border-t border-border/40 pt-2.5">
						<span class="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
							{ingredient.measurement_unit || 'N/A'}
						</span>
						<span class="text-[10px] tabular-nums text-muted-foreground/60">
							{new Date(ingredient.updated_at).toLocaleDateString('el-GR')}
						</span>
					</div>

					<!-- Subtle recipe count indicator -->
					{#if ingredient.recipe_ingredients?.[0]?.count}
						<div class="mt-2 flex items-center gap-1">
							<div class="h-1 w-1 rounded-full bg-primary/60"></div>
							<span class="text-[10px] text-muted-foreground">
								Σε {ingredient.recipe_ingredients[0].count} συνταγές
							</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Edit Dialog -->
<Dialog.Root
	open={editingIngredient !== null}
	onOpenChange={(open) => !open && (editingIngredient = null)}
>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Επεξεργασία Συστατικού</Dialog.Title>
			<Dialog.Description>
				Κάντε τις αλλαγές και πατήστε αποθήκευση.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="edit-name" class="text-right">Όνομα</Label>
				<Input id="edit-name" bind:value={editFormData.name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Κατηγορία</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={editFormData.category}>
						<Select.Trigger class="w-full">
							{editFormData.category || 'Επιλέξτε κατηγορία'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Κατηγορίες</Select.Label>
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
				<Label for="edit-unit" class="text-right">Μονάδα</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={editFormData.measurement_unit}>
						<Select.Trigger class="w-full">
							{editFormData.measurement_unit || 'Επιλέξτε μονάδα'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Μονάδα μέτρησης</Select.Label>
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
				<Label for="edit-description" class="text-right">Περιγραφή</Label>
				<Input id="edit-description" bind:value={editFormData.description} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (editingIngredient = null)}>Ακύρωση</Button>
			<Button onclick={handleEdit}>Αποθήκευση</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Add Dialog -->
<Dialog.Root open={addingIngredient} onOpenChange={(open) => !open && (addingIngredient = false)}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Νέο Συστατικό</Dialog.Title>
			<Dialog.Description>Συμπληρώστε τα στοιχεία του νέου συστατικού.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="add-name" class="text-right">Όνομα</Label>
				<Input id="add-name" bind:value={addFormData.name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Κατηγορία</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={addFormData.category}>
						<Select.Trigger class="w-full">
							{addFormData.category || 'Επιλέξτε κατηγορία'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Κατηγορίες</Select.Label>
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
				<Label for="add-unit" class="text-right">Μονάδα</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={addFormData.measurement_unit}>
						<Select.Trigger class="w-full">
							{addFormData.measurement_unit || 'Επιλέξτε μονάδα'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Μονάδα μέτρησης</Select.Label>
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
				<Label for="add-description" class="text-right">Περιγραφή</Label>
				<Input id="add-description" bind:value={addFormData.description} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (addingIngredient = false)}>Ακύρωση</Button>
			<Button onclick={handleAdd}>Προσθήκη</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation -->
<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή συστατικού"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το συστατικό;"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={deletingIngredient ? `${deletingIngredient.name} (ID: ${deletingIngredient.id})` : ''}
	{isDeleting}
	onConfirm={handleDelete}
	onCancel={cancelDelete}
>
	{#snippet children()}
		{#if deletingIngredient}
			<div class="rounded-lg p-4">
				<div class="flex items-center gap-3">
					<div>
						<p class="font-semibold">{deletingIngredient.name}</p>
						<p class="text-xs text-muted-foreground">
							{deletingIngredient.category || 'Χωρίς κατηγορία'} • {deletingIngredient.measurement_unit || '-'}
						</p>
						{#if deletingIngredient.recipe_ingredients?.[0]?.count}
							<p class="mt-1 text-xs font-medium text-orange-600">
								Χρησιμοποιείται σε {deletingIngredient.recipe_ingredients[0].count} συνταγές
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/snippet}
</DeleteConfirmDialog>
