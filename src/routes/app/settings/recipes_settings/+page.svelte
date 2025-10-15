<script lang="ts">
	import { authenticatedAccess, getBeverages } from './data.remote';
	import BeverageCard from './components/BeverageCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { X, RefreshCcw, Plus } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import AddBeverageDialog from './components/AddBeverageDialog.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';

	let auth = authenticatedAccess();
	let query = getBeverages();

	let allBeverages = $derived(query.current?.beverages ?? []);
	let totalBeverages = $derived(query.current?.totalBeverages ?? 0);


	let searchQuery = $state('');
	let refreshAction = $state(false);
	let addingBeverage = $state(false);

	// Filter beverages based on search
	let filteredBeverages = $derived(() => {
		if (!searchQuery) return allBeverages;

		return allBeverages.filter(
			(beverage) =>
				beverage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(beverage.description &&
					beverage.description.toLowerCase().includes(searchQuery.toLowerCase()))
		);
	});


	async function refresh() {
		refreshAction = true;
		await query.refresh();
		clearSearch();
		refreshAction = false;
	}

	function clearSearch() {
		searchQuery = '';
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Our Beverages
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Πρόσθεσε, διάγραψε, ενήμερωσε τις συνταγές καθώς και τα υλικά τους.
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Διαθέσιμα Ροφήματα: <span class="font-semibold"
							>{filteredBeverages().length}</span
						>
						/ {totalBeverages}
					</p>
					{#if searchQuery}
						<Button
							variant="secondary"
							size="sm"
							onclick={clearSearch}
							class="h-6 cursor-pointer px-2 text-xs"
						>
							<X class="mr-1 h-3 w-3" />
							Clear search
						</Button>
					{/if}
				</div>
			</div>

			<!-- Search & Actions Section -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-2">
					<!-- Add Button -->
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="default"
									size="sm"
									class="h-8 cursor-pointer gap-2 px-3"
									onclick={() => (addingBeverage = true)}
								>
									<Plus class="h-4 w-4" />
									<span class="hidden sm:inline">Add Beverage</span>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Add New Beverage</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<!-- Refresh Button -->
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
										class={`h-4 w-4 ${refreshAction ? 'animate-spin-clockwise' : ''}`}
									/>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Refresh Beverages</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>

				<!-- Search Input -->
				<div class="relative flex items-center">
					<Input
						bind:value={searchQuery}
						class="w-full py-1 pr-8 sm:w-72"
						placeholder="Search beverages..."
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

		<!-- Beverages Grid -->
		{#if query.loading}
			<!-- Loading Skeletons -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(20) as _}
					<div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
						<div class="mb-3 flex items-start justify-between">
							<div class="flex items-center gap-2">
								<Skeleton class="h-4 w-8" />
								<Skeleton class="h-5 w-32" />
							</div>
							<div class="flex gap-1">
								<Skeleton class="h-7 w-7 rounded" />
								<Skeleton class="h-7 w-7 rounded" />
							</div>
						</div>
						<Skeleton class="mb-3 h-48 w-full rounded" />
						<Skeleton class="mb-2 h-4 w-full" />
						<Skeleton class="h-4 w-3/4" />
						<Skeleton class="mt-3 h-10 w-full rounded" />
					</div>
				{/each}
			</div>
		{:else if filteredBeverages().length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<p class="mb-2 text-lg font-medium text-neutral-600">No beverages found</p>
				{#if searchQuery}
					<p class="text-sm text-neutral-400">Try adjusting your search</p>
					<Button variant="outline" onclick={clearSearch} class="mt-4 cursor-pointer"
						>Clear search</Button
					>
				{:else}
					<p class="text-sm text-neutral-400">Start by adding your first beverage</p>
					<Button
						variant="default"
						onclick={() => (addingBeverage = true)}
						class="mt-4 cursor-pointer gap-2"
					>
						<Plus class="h-4 w-4" />
						Add Beverage
					</Button>
				{/if}
			</div>
		{:else}
			<!-- Beverages Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredBeverages() as beverage (beverage.id)}
					<BeverageCard {beverage} onUpdate={refresh} />
				{/each}
			</div>
		{/if}
	</main>
</div>
{/if}

<AddBeverageDialog bind:open={addingBeverage} onSuccess={refresh} />