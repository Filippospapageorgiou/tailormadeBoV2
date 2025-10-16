<script lang="ts">
    import type { Beverage } from "$lib/models/database.types";
    import { goto } from "$app/navigation";
    import Label from "$lib/components/ui/label/label.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
    Input

    let { data } = $props();
    let beverages: Beverage[] = $derived(data.beverages);

    let searchQuery = $state('');

    let filteredBeverages = $derived(
        searchQuery
            ? beverages.filter(beverage => 
                beverage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (beverage.description && beverage.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            :beverages
    );



    const handleBeverageClick = (id: number) => {
        goto(`/app/recipes/${id}`);
    }
</script>


<div class="min-h-screen bg-white">
    <main class="container mx-auto px-4 md:px-6 pt-8 pb-20">
        <div class="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8">
            <div class="flex flex-col gap-1">
                <h1 class="text-4xl font-mono tracking-wider text-neutral-800">BEVERAGES</h1>
                <p class="text-sm text-[#8B6B4A]">Available Products: {beverages.length}</p>
            </div>
            <div class="w-full md:w-auto flex flex-col items-end">
                <Input bind:value={searchQuery} class="w-full md:w-72 py-1" placeholder='Filter beverages...' />
            </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {#each filteredBeverages as beverage (beverage.id)}
                <div 
                    role="button"
                    tabindex="0"
                    onclick={() => handleBeverageClick(beverage.id)}
                    onkeydown={(e) => e.key === 'Enter' && handleBeverageClick(beverage.id)}
                    class="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden cursor-pointer"
                >
                    <div class="aspect-square w-full overflow-hidden">
                        <img
                            src={beverage.image_url}
                            alt={beverage.name}
                            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div class="p-3">
                        <p class="text-xs text-[#8B6B4A] mb-1">#{beverage.id}</p>
                        <h2 class="text-base font-medium text-neutral-800 tracking-wide mb-1">{beverage.name}</h2>
                        {#if beverage.description}
                            <p class="text-xs text-neutral-600 line-clamp-2">{beverage.description}</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </main>
</div>
