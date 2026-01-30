<!-- routes/beverages/[id]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import type { Beverage, RecipeIngredient } from '$lib/models/database.types';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const { beverage, recipeIngredients } = $derived(data) as {
		beverage: Beverage;
		recipeIngredients: RecipeIngredient[];
	};
</script>

{#if beverage}
	<div class="min-h-screen bg-background pt-2">
		<!-- Hero Section with Image -->
		<div class="relative h-[35vh] md:h-[45vh] w-full overflow-hidden">
			<img
				src={beverage.image_url || '/placeholder-beverage.jpg'}
				alt={beverage.name}
				class="absolute inset-0 w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>

			<!-- Back Button -->
			<div class="absolute top-4 left-4 z-10">
				<Button
					variant="secondary"
					size="icon"
					onclick={() => goto('/app/recipes')}
					class="rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm 
						   hover:bg-white dark:hover:bg-black/70 shadow-md border-0"
				>
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</div>
		</div>

		<!-- Main Content -->
		<main class="container mx-auto px-4 md:px-6 -mt-16 relative z-10 pb-20">
			<div class="max-w-4xl mx-auto">
				<!-- Header -->
				<div class="mb-10">
					<p class="text-sm text-primary mb-1">#{beverage.id}</p>
					<h1 class="text-3xl font-mono tracking-wider">{beverage.name}</h1>
					{#if beverage.description}
						<p class="mt-3 text-muted-foreground">{beverage.description}</p>
					{/if}
				</div>

				<!-- Ingredients -->
				<div class="mb-12">
					<h2 class="text-2xl font-mono tracking-wider mb-6">ΣΥΣΤΑΤΙΚΑ</h2>

					{#if recipeIngredients.length > 0}
						<div class="space-y-3">
							{#each recipeIngredients as { quantity, notes, ingredients }}
								<div
									class="flex items-baseline justify-between py-2 
										   border-b border-border/30 dark:border-white/10"
								>
									<span class="text-foreground">{ingredients.name}</span>
									<span class="text-muted-foreground font-mono text-sm">
										{quantity} {ingredients.measurement_unit}
									</span>
								</div>
								{#if notes}
									<p class="text-sm text-muted-foreground -mt-2 mb-2">{notes}</p>
								{/if}
							{/each}
						</div>
					{:else}
						<p class="text-muted-foreground">Δεν υπάρχουν διαθέσιμες πληροφορίες συνταγής.</p>
					{/if}
				</div>

				<!-- Execution -->
				<div class="mb-12">
					<h2 class="text-2xl font-mono tracking-wider mb-6">ΕΚΤΕΛΕΣΗ</h2>

					{#if beverage.execution}
						{#if beverage.execution.includes('- ')}
							<ol class="list-none space-y-4">
								{#each beverage.execution.split('- ') as step, i}
									{#if step.trim()}
										<li class="flex items-start">
											<div
												class="flex-shrink-0 bg-primary text-primary-foreground 
													   rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5"
											>
												<span class="text-sm font-semibold">{i}</span>
											</div>
											<p class="leading-relaxed text-foreground">{step.trim()}</p>
										</li>
									{/if}
								{/each}
							</ol>
						{:else}
							<p class="leading-relaxed text-foreground">{beverage.execution}</p>
						{/if}
					{:else}
						<p class="text-muted-foreground">Δεν υπάρχουν διαθέσιμες οδηγίες εκτέλεσης.</p>
					{/if}
				</div>

				<!-- Back Button -->
				<div class="flex justify-center pt-6 border-t border-border/30 dark:border-white/10">
					<Button
						variant="outline"
						onclick={() => goto('/app/recipes')}
						class="gap-2"
					>
						<ArrowLeft class="h-4 w-4" />
						Πίσω στα Ροφήματα
					</Button>
				</div>
			</div>
		</main>
	</div>
{/if}