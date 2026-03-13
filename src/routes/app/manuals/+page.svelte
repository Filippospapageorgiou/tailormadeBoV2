<script lang="ts">
	import { getPublishedManuals } from '../../../lib/api/manual/data.remote';
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		BookOpen,
		Search,
		X,
		RefreshCcw,
		CheckCircle2,
		Eye,
		EyeOff
	} from 'lucide-svelte';
	import UserManualCard from './components/UserManualCard.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	let query = getPublishedManuals({});
	let allManuals = $derived(query.current?.manuals ?? []);

	let searchQuery = $state('');
	let activeTab = $state('all');
	let showReadFilter = $state<string>('');
	let refreshAction = $state(false);

	const categoryEntries = Object.entries(MANUAL_CATEGORY_LABELS) as [ManualCategory, string][];

	let availableCategories = $derived(
		categoryEntries.filter(([key]) => allManuals.some((m: any) => m.category === key))
	);

	let readCount = $derived(allManuals.filter((m: any) => m.is_read).length);
	let totalCount = $derived(allManuals.length);

	let filteredManuals = $derived.by(() => {
		let manuals = allManuals as ManualWithDetails[];

		if (activeTab !== 'all') {
			manuals = manuals.filter((m) => m.category === activeTab);
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

	let hasActiveFilters = $derived(searchQuery || activeTab !== 'all' || showReadFilter);

	async function refresh() {
		refreshAction = true;
		await query.refresh();
		refreshAction = false;
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="font-mono text-4xl tracking-wider">Εγχειρίδια</h1>
			<p class="mt-1 text-sm text-primary">Οδηγοί εκπαίδευσης και λειτουργίας για την ομάδα μας</p>
		</div>

		<!-- Tabs + Toolbar -->
		<Tabs.Root bind:value={activeTab} class="w-full">
			<!-- Tab navigation -->
			<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Tabs.List class="h-9 w-full overflow-x-auto sm:w-auto">
					<Tabs.Trigger value="all">Όλα</Tabs.Trigger>
					{#each availableCategories as [key, label] (key)}
						<Tabs.Trigger value={key}>{label}</Tabs.Trigger>
					{/each}
				</Tabs.List>

				<!-- Progress pill -->
				{#if totalCount > 0}
					<div
						class="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
					>
						<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
						<span
							>{readCount}<span class="text-muted-foreground/50">/{totalCount}</span> αναγνωσμένα</span
						>
					</div>
				{/if}
			</div>

			<!-- Toolbar: read filter + search -->
			<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-1.5">
					<Button
						variant={showReadFilter === 'unread' ? 'default' : 'outline'}
						size="sm"
						class="h-7 cursor-pointer gap-1.5 rounded-full px-3 text-[11px] {showReadFilter ===
						'unread'
							? ''
							: 'text-muted-foreground'}"
						onclick={() => (showReadFilter = showReadFilter === 'unread' ? '' : 'unread')}
					>
						<EyeOff class="h-3 w-3" />
						Μη αναγνωσμένα
					</Button>
					<Button
						variant={showReadFilter === 'read' ? 'default' : 'outline'}
						size="sm"
						class="h-7 cursor-pointer gap-1.5 rounded-full px-3 text-[11px] {showReadFilter ===
						'read'
							? ''
							: 'text-muted-foreground'}"
						onclick={() => (showReadFilter = showReadFilter === 'read' ? '' : 'read')}
					>
						<Eye class="h-3 w-3" />
						Αναγνωσμένα
					</Button>
				</div>

				<div class="flex items-center gap-2">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="outline"
									size="icon"
									onclick={refresh}
									disabled={refreshAction}
									class="h-8 w-8 cursor-pointer"
								>
									<RefreshCcw
										class={`h-3.5 w-3.5 ${refreshAction ? 'animate-spin-clockwise repeat-infinite' : ''}`}
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
		</Tabs.Root>

		<!-- Grid -->
		{#if query.loading}
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{#each Array(6) as _, i (i)}
					<div class="overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-sm">
						<Skeleton class="h-44 w-full" />
						<div class="space-y-3 p-4">
							<Skeleton class="h-5 w-4/5" />
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-2/3" />
							<div class="flex items-center gap-2 pt-1">
								<Skeleton class="h-3.5 w-16" />
								<Skeleton class="h-3.5 w-20" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredManuals.length === 0}
			<EmptyComp
				title={hasActiveFilters ? 'Δεν βρέθηκαν εγχειρίδια' : 'Δεν υπάρχουν εγχειρίδια ακόμα'}
				description={hasActiveFilters
					? 'Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης'
					: 'Τα εγχειρίδια εκπαίδευσης θα εμφανιστούν εδώ όταν δημοσιευτούν'}
				icon={BookOpen as any}
				primaryLabel="Καθαρισμός Φίλτρων"
				onPrimaryClick={() => {
					searchQuery = '';
					activeTab = 'all';
					showReadFilter = '';
				}}
				primaryIcon={X as any}
			/>
		{:else}
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{#each filteredManuals as manual, index (manual.id)}
					<UserManualCard {manual} {index} />
				{/each}
			</div>
		{/if}
	</main>
</div>
