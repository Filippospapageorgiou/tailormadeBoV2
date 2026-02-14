<script lang="ts">
	import { getBeverages } from './data.remote';
	import { authenticatedAccess } from '$lib/api/bonus_managment/data.remote';
	import BeverageCard from './components/BeverageCard.svelte';
	import IngredientsTab from './components/IngredientsTab.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { X, RefreshCcw, Plus, Coffee, Package } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AddBeverageDialog from './components/AddBeverageDialog.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let query = getBeverages();

	let allBeverages = $derived(query.current?.beverages ?? []);
	let totalBeverages = $derived(query.current?.totalBeverages ?? 0);

	let searchQuery = $state('');
	let refreshAction = $state(false);
	let addingBeverage = $state(false);

	let activeTab = $state(page.url.searchParams.get('tab') || 'beverages');

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

	function handleTabChange(value: string | undefined) {
		if (!value) return;
		activeTab = value;
		const url = new URL(page.url);
		url.searchParams.set('tab', value);
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

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
	<div class="min-h-screen bg-background">
		<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
			<!-- Header Section -->
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="space-y-1">
					<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Συνταγές & Συστατικά</h1>
					<p class="text-sm text-muted-foreground">
						Πρόσθεσε, διάγραψε, ενημέρωσε τις συνταγές καθώς και τα υλικά τους.
					</p>
				</div>
			</div>

			<!-- Tabs Section -->
			<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full">
				<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
					<Tabs.Trigger
						value="beverages"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<Coffee class="h-4 w-4" />
						Ροφήματα
					</Tabs.Trigger>
					<Tabs.Trigger
						value="ingredients"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<Package class="h-4 w-4" />
						Συστατικά
					</Tabs.Trigger>
				</Tabs.List>

				<!-- Beverages Tab -->
				<Tabs.Content value="beverages" class="mt-6 animate-fade-in-left">
					<div class="space-y-6">
						<!-- Beverages Toolbar -->
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-2">
								<p class="text-xs text-muted-foreground md:text-sm">
									Διαθέσιμα Ροφήματα:
									<span class="font-semibold text-foreground">{filteredBeverages().length}</span>
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
												<span class="hidden sm:inline">Προσθήκη</span>
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>Νέο Ρόφημα</p>
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
													class={`h-4 w-4 repeat-infinite ${refreshAction ? 'animate-spin-clockwise' : ''}`}
												/>
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>Ανανέωση</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>

								<!-- Search Input -->
								<div class="relative flex items-center">
									<Input
										bind:value={searchQuery}
										class="w-full py-1 pr-8 sm:w-72"
										placeholder="Αναζήτηση ροφημάτων..."
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
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each Array(20) as _}
									<div
										class="rounded-xl border border-border/50 bg-card p-4 shadow-sm dark:border-white/10"
									>
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
										<Skeleton class="mb-3 h-48 w-full rounded-lg" />
										<Skeleton class="mb-2 h-4 w-full" />
										<Skeleton class="h-4 w-3/4" />
										<Skeleton class="mt-3 h-10 w-full rounded-lg" />
									</div>
								{/each}
							</div>
						{:else if filteredBeverages().length === 0}
							<EmptyComp
								title={'Δεν βρέθηκαν ροφήματα'}
								description={'Δοκιμάστε να αλλάξετε την αναζήτηση'}
								icon={Coffee as any}
								primaryLabel="Καθαρισμός Φίλτρων"
								onPrimaryClick={clearSearch}
								primaryIcon={X as any}
							/>
						{:else}
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each filteredBeverages() as beverage (beverage.id)}
									<BeverageCard {beverage} onUpdate={refresh} />
								{/each}
							</div>
						{/if}
					</div>
				</Tabs.Content>

				<!-- Ingredients Tab -->
				<Tabs.Content value="ingredients" class="mt-6 animate-fade-in-left">
					<IngredientsTab />
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
{/if}

<AddBeverageDialog bind:open={addingBeverage} onSuccess={refresh} />
