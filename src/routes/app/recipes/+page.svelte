<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import RecipesLoading from '$lib/components/custom/recipes/recipesLoading.svelte';
	import RecipesErrorFallback from '$lib/components/custom/recipes/recipesErrorFallback.svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import NoAccess from '$lib/components/custom/register/noAccess.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';
	import { Coffee } from 'lucide-svelte';

	const profile = getProfileContext();

	let { data } = $props();
	let beverages: Beverage[] = $derived(data.beverages);

	let searchQuery = $state('');

	let filteredBeverages = $derived(
		searchQuery
			? beverages.filter(
					(beverage) =>
						beverage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(beverage.description &&
							beverage.description.toLowerCase().includes(searchQuery.toLowerCase()))
				)
			: beverages
	);

	const handleBeverageClick = (id: number) => {
		goto(`/app/recipes/${id}`);
	};
</script>

<svelte:boundary onerror={(e) => console.error('Recipes page error:', e)}>
	{#snippet failed(error, reset)}
		<RecipesErrorFallback
			error={error instanceof Error ? error : new Error(String(error ?? 'An error occurred'))}
			{reset}
		/>
	{/snippet}

	{#snippet pending()}
		<RecipesLoading />
	{/snippet}
	{#if profile.role_id === 6}
		<NoAccess />
	{:else}
		<div class="min-h-screen bg-background">
			<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
				<div
					class="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:gap-8"
				>
					<div class="flex flex-col gap-1">
						<h1 class="font-mono text-4xl tracking-wider">Ροφήματα</h1>
						<p class="text-sm text-primary">Διαθέσιμα ροφήματα: {beverages.length}</p>
					</div>
					<div class="flex w-full flex-col items-end md:w-auto">
						<Input
							bind:value={searchQuery}
							class="w-full py-1 md:w-72"
							placeholder="Αναζήτησε ροφήματα"
						/>
					</div>
				</div>
				{#if filteredBeverages.length === 0}
					<EmptyComp
						title="Δεν βρέθηκαν ροφήματα"
						description={'Δοκιμάστε να αλλάξετε τα φίλτρα'}
						icon={Coffee as any}
						primaryLabel={'Καθαρισμός Φίλτρων'}
						onPrimaryClick={() => (searchQuery = '')}
					/>
				{:else}
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{#each filteredBeverages as beverage, i (beverage.id)}
							<div
								style="animation-delay: {i * 150}ms; animation-fill-mode: backwards;"
								role="button"
								tabindex="0"
								onclick={() => handleBeverageClick(beverage.id)}
								onkeydown={(e) => e.key === 'Enter' && handleBeverageClick(beverage.id)}
								class="group relative animate-fade-in-right cursor-pointer overflow-hidden rounded-xl
			   border border-border/40 bg-card shadow-sm
			   transition-all duration-300 ease-out
			   hover:-translate-y-0.5 hover:shadow-lg dark:border-white/5
			   dark:hover:shadow-black/30"
							>
								<!-- Image container -->
								<div class="relative aspect-square w-full overflow-hidden bg-muted">
									<img
										src={beverage.image_url}
										alt={beverage.name}
										loading="lazy"
										decoding="async"
										width="400"
										height="400"
										class="h-full w-full object-cover
					   transition-transform duration-500 ease-out
					   group-hover:scale-108"
									/>

									<!-- Subtle overlay on hover -->
									<div
										class="absolute inset-0 bg-black/0 transition-colors
						duration-300 group-hover:bg-black/10 dark:group-hover:bg-black/20"
									></div>

									<!-- ID badge on image -->
									<span
										class="absolute top-2 left-2 rounded-md bg-white/90
						 px-2 py-0.5 font-mono
						 text-xs font-medium
						 text-muted-foreground
						 backdrop-blur-sm dark:bg-black/60"
									>
										#{beverage.id}
									</span>
								</div>

								<!-- Content -->
								<div class="space-y-1.5 p-3.5">
									<h2
										class="line-clamp-1 text-sm font-semibold tracking-tight
					   text-foreground transition-colors duration-200
					   group-hover:text-primary"
									>
										{beverage.name}
									</h2>

									{#if beverage.description}
										<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
											{beverage.description}
										</p>
									{/if}
								</div>

								<!-- Bottom accent line on hover -->
								<div
									class="absolute right-0 bottom-0 left-0 h-0.5 origin-left
					scale-x-0 bg-primary
					transition-transform duration-300 group-hover:scale-x-100"
								></div>
							</div>
						{/each}
					</div>
				{/if}
			</main>
		</div>
	{/if}
</svelte:boundary>
