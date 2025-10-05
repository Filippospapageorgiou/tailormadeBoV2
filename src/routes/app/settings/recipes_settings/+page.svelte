<script lang="ts">
    import { getBeverages } from './data.remote';
    import Button from '$lib/components/ui/button/button.svelte';
    import { X } from 'lucide-svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    let query = getBeverages();

    let beverages = $derived(query.current?.beverages ?? []);
    let totalBeverages = $derived(query.current?.totalBeverages ?? 0);

    let refreshAction = $state(false);
	async function refresh() {
		refreshAction = true;
		await query.refresh();
		//clearAllFilters();
		refreshAction = false;
	}

    let value = $state('');
    let searchQuery = $state('');

    function clearAllFilters() {
		value = '';
		searchQuery = '';
	}



</script>


<div class="min-h-screen">
    <main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
        <div class="mb-8 space-y-4">
            <div class="flex flex-col gap-2" >
                <h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Our Beverages
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Πρόσθεσε, διάγραψε, ενήμερωσε της συντάγες κάθως και τα υλικά τους.
				</p>
                <div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Διαθέσιμα Συστατικά: <span class="font-semibold">{totalBeverages}</span>
						/ {totalBeverages}
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
        </div>
    </main>
</div>