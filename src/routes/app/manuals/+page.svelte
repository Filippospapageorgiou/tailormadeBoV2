<script lang="ts">
	import { getPublishedManuals } from '../../../lib/api/manual/data.remote';
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { BookOpen, Search, X, RefreshCcw, CheckCircle2 } from 'lucide-svelte';
	import UserManualCard from './components/UserManualCard.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	let query = getPublishedManuals({});
	let allManuals = $derived(query.current?.manuals ?? []);

	let searchQuery = $state('');
	let activeCategory = $state<string>('');
	let showReadFilter = $state<string>('');
	let refreshAction = $state(false);

	const categoryEntries = Object.entries(MANUAL_CATEGORY_LABELS) as [ManualCategory, string][];

	// Unique categories present in the data
	let availableCategories = $derived(
		categoryEntries.filter(([key]) => allManuals.some((m: any) => m.category === key))
	);

	let readCount = $derived(allManuals.filter((m: any) => m.is_read).length);
	let totalCount = $derived(allManuals.length);

	let filteredManuals = $derived(() => {
		let manuals = allManuals as ManualWithDetails[];

		if (activeCategory) {
			manuals = manuals.filter((m) => m.category === activeCategory);
		}

		if (showReadFilter === 'unread') {
			manuals = manuals.filter((m) => !m.is_read);
		} else if (showReadFilter === 'read') {
			manuals = manuals.filter((m) => m.is_read);
		}

		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			manuals = manuals.filter(
				(m) =>
					m.title.toLowerCase().includes(q) ||
					(m.description && m.description.toLowerCase().includes(q)) ||
					m.content.toLowerCase().includes(q)
			);
		}

		return manuals;
	});

	async function refresh() {
		refreshAction = true;
		await query.refresh();
		refreshAction = false;
	}

	let hasActiveFilters = $derived(searchQuery || activeCategory || showReadFilter);
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="font-mono text-4xl tracking-wider">Εγχειρίδια</h1>
			<p class="mt-1 text-sm text-primary">Οδηγοί εκπαίδευσης και λειτουργίας για την ομάδα μας</p>

			<!-- Progress bar -->
			{#if totalCount > 0}
				<div class="mt-4 flex items-center gap-3">
					<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-emerald-500 transition-all duration-500"
							style="width: {(readCount / totalCount) * 100}%"
						></div>
					</div>
					<span class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
						<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
						{readCount}/{totalCount} αναγνωσμένα
					</span>
				</div>
			{/if}
		</div>

		<!-- Category chips + filters -->
		<div class="mb-6 space-y-3">
			<!-- Category filter chips -->
			{#if availableCategories.length > 1}
				<div class="flex flex-wrap items-center gap-2">
					<button
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all
							{activeCategory === ''
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'}"
						onclick={() => (activeCategory = '')}
					>
						Όλα
					</button>
					{#each availableCategories as [key, label]}
						<button
							class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all
								{activeCategory === key
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'}"
							onclick={() => (activeCategory = activeCategory === key ? '' : key)}
						>
							{label}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Search + read filter row -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-2">
					<button
						class="rounded-full border px-3 py-1 text-[11px] font-medium transition-all
							{showReadFilter === '' ? 'border-border bg-card text-muted-foreground' : ''}
							{showReadFilter === 'unread'
							? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
							: 'border-border bg-card text-muted-foreground hover:border-primary/50'}
							{showReadFilter === 'read' ? 'hidden' : ''}"
						onclick={() => (showReadFilter = showReadFilter === 'unread' ? '' : 'unread')}
					>
						Μη αναγνωσμένα
					</button>
					<button
						class="rounded-full border px-3 py-1 text-[11px] font-medium transition-all
							{showReadFilter === 'read'
							? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
							: 'border-border bg-card text-muted-foreground hover:border-primary/50'}
							{showReadFilter === 'unread' ? 'hidden' : ''}"
						onclick={() => (showReadFilter = showReadFilter === 'read' ? '' : 'read')}
					>
						Αναγνωσμένα
					</button>
				</div>

				<div class="flex items-center gap-2">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="secondary"
									size="icon"
									onclick={refresh}
									disabled={refreshAction}
									class="h-8 w-8 cursor-pointer"
								>
									<RefreshCcw
										class={`h-3.5 w-3.5 ${refreshAction ? 'animate-spin-clockwise' : ''}`}
									/>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content><p>Ανανέωση</p></Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<div class="relative">
						<Search
							class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							bind:value={searchQuery}
							class="h-8 w-full pr-8 pl-8 text-sm sm:w-56"
							placeholder="Αναζήτηση..."
						/>
						{#if searchQuery}
							<Button
								variant="ghost"
								size="icon"
								onclick={() => (searchQuery = '')}
								class="absolute top-1/2 right-0.5 h-7 w-7 -translate-y-1/2 cursor-pointer"
							>
								<X class="h-3 w-3" />
							</Button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		{#if query.loading}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{#each Array(6) as _, i}
					<div class="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm">
						<Skeleton class="h-56 w-full" />
						<div class="space-y-3 p-5">
							<Skeleton class="h-6 w-4/5" />
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-2/3" />
							<div class="flex items-center gap-2 pt-2">
								<Skeleton class="h-4 w-16" />
								<Skeleton class="h-4 w-20" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredManuals().length === 0}
			<EmptyComp
				title={hasActiveFilters ? 'Δεν βρέθηκαν εγχειρίδια' : 'Δεν υπάρχουν εγχειρίδια ακόμα'}
				description={hasActiveFilters
					? 'Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης'
					: 'Τα εγχειρίδια εκπαίδευσης θα εμφανιστούν εδώ όταν δημοσιευτούν'}
				icon={BookOpen as any}
				primaryLabel="Καθαρισμός Φίλτρων"
				onPrimaryClick={() => {
					searchQuery = '';
					activeCategory = '';
					showReadFilter = '';
				}}
				primaryIcon={X as any}
			/>
		{:else}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{#each filteredManuals() as manual, index (manual.id)}
					<UserManualCard {manual} {index} onRead={refresh} />
				{/each}
			</div>
		{/if}
	</main>
</div>
