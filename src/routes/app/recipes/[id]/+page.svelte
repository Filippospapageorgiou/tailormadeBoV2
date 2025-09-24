<!-- routes/beverages/[id]/+page.svelte -->
<script lang="ts">
    import type { PageData } from './$types';
    import type { Beverage, RecipeIngredient } from '$lib/models/database.types';
    import { goto } from '$app/navigation';
    
    let { data }: { data: PageData } = $props();
    const { beverage, recipeIngredients } = $derived(data) as {
        beverage: Beverage;
        recipeIngredients: RecipeIngredient[];
    };
    
</script>

{#if beverage}
<div class="min-h-screen bg-white">
    <main class="container mx-auto px-4 md:px-6 pt-8 pb-20">
        <div class="max-w-4xl mx-auto">
            <!-- Header με ID και Όνομα -->
            <div class="mb-8">
                <p class="text-sm text-[#8B6B4A] mb-1">#{beverage.id}</p>
                <h1 class="text-3xl font-mono tracking-wider text-neutral-800">{beverage.name}</h1>
                {#if beverage.description}
                    <p class="text-neutral-600 mt-2">{beverage.description}</p>
                {/if}
            </div>

            <!-- Flex container για εικόνα και οδηγίες -->
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Εικόνα -->
                <div class="w-full md:w-1/2">
                    <div class="rounded-lg overflow-hidden shadow-lg">
                        <img
                            src={beverage.image_url || '/placeholder-beverage.jpg'}
                            alt={beverage.name}
                            class="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <!-- Οδηγίες -->
                <div class="w-full md:w-1/2">
                    <h2 class="text-2xl font-mono tracking-wider text-neutral-800 mb-6">
                        ΣΥΣΤΑΤΙΚΑ & ΟΔΗΓΙΕΣ
                    </h2>
                    
                    {#if recipeIngredients.length > 0}
                        <div class="space-y-4">
                            {#each recipeIngredients as { quantity, notes, ingredients }}
                                <div class="flex flex-col gap-1">
                                    <div class="flex items-baseline justify-between">
                                        <span class="text-[#8B6B4A]">
                                            {ingredients.name}
                                        </span>
                                        <span class="text-neutral-800">
                                            {quantity} {ingredients.measurement_unit}
                                        </span>
                                    </div>
                                    {#if notes}
                                        <p class="text-sm text-neutral-600">{notes}</p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-neutral-600">Δεν υπάρχουν διαθέσιμες πληροφορίες συνταγής.</p>
                    {/if}
                </div>
            </div>

            <div class="mt-12 max-w-4xl mx-auto">
                <h2 class="text-2xl font-mono tracking-wider text-neutral-800 mb-6">
                    ΕΚΤΕΛΕΣΗ
                </h2>
                
                {#if beverage.execution}
                    <div >
                        {#if beverage.execution.includes('- ')}
                            <ol class="list-none space-y-4">
                                {#each beverage.execution.split('- ') as step, i}
                                    {#if step.trim()}
                                        <li class="flex items-start">
                                            <div class="flex-shrink-0 bg-[#8B6B4A] text-white rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5">
                                                <span class="text-sm font-semibold">{i}</span>
                                            </div>
                                            <div class="text-neutral-700 leading-relaxed">
                                                {step.trim()}
                                            </div>
                                        </li>
                                    {/if}
                                {/each}
                            </ol>
                        {:else}
                            <p class="text-neutral-700 leading-relaxed">{beverage.execution}</p>
                        {/if}
                    </div>
                {:else}
                    <p class="text-neutral-600">Δεν υπάρχουν διαθέσιμες οδηγίες εκτέλεσης.</p>
                {/if}
            </div>

            <!-- Back Button -->
            <div class="flex justify-center mt-12">
                <button 
                    onclick={() => goto('/app/recipes')}
                    class="inline-flex items-center px-6 py-2 text-sm font-medium text-[#8B6B4A] bg-white cursor-pointer
                           border border-[#8B6B4A] rounded-lg hover:bg-[#8B6B4A] hover:text-white 
                           transition-colors duration-300"
                >
                    Πίσω στα Ροφήματα
                </button>
            </div>
        </div>
    </main>
</div>
{/if}