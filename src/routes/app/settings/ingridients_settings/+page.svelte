<script lang="ts">
	import { getIngridients } from './data.remote';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { X } from 'lucide-svelte';


	let query = getIngridients();

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

	const triggerContent = $derived(
        categories.find((c) => c === value) ?? "select a category"
    );

	function clearCategory() {
		value = '';
	}

	function clearSearch() {
		searchQuery = '';
	}

	function clearAllFilters() {
		value = '';
		searchQuery = '';
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">Our ingredients</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Πρόσθεσε, διάγραψε, ενήμερωσε τα υλίκα για να φτιαξούμε τις συντάγες μας
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Διαθέσιμα Συστατικά: <span class="font-semibold">{filteredIngridients()?.length}</span> / {allIngridients.length}
					</p>
					{#if value || searchQuery}
						<Button
							variant="ghost"
							size="sm"
							onclick={clearAllFilters}
							class="h-6 px-2 text-xs"
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
						<Select.Root 
							type="single" 
							name="filterCategory"
							bind:value
						>
							<Select.Trigger class="w-full sm:w-[180px]">
								{triggerContent}							
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Categories</Select.Label>
									{#each categories as category}
										<Select.Item
											value={category ?? ''}
											label={category}
										>
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
				<Button
					variant="outline"
					onclick={clearAllFilters}
					class="mt-4"
				>
					Clear all filters
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each filteredIngridients() as ingredient (ingredient.id)}
					<div
						class="group relative rounded-lg border border-gray-100 bg-white p-3 shadow-sm
                    transition-all duration-300 hover:border-[#8B6B4A]/20 hover:shadow-md"
					>
						<div class="mb-2 flex items-start justify-between">
							<div class="flex items-center">
								<span class="mr-1 text-xs text-[#8B6B4A]">#{ingredient.id}</span>
								<h3 class="pl-1 text-sm font-medium text-neutral-800 sm:text-base">{ingredient.name}</h3>
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