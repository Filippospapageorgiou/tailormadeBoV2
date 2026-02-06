<script lang="ts">
	import { getAllManuals } from '$lib/api/manual/data.remote';
	import { authenticatedAccess } from '$lib/api/bonus_managment/data.remote';
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { X, RefreshCcw, Plus, BookOpen } from 'lucide-svelte';
	import ManualCard from './components/ManualCard.svelte';
	import AddManualDialog from './components/AddManualDialog.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { toast } from 'svelte-sonner';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	let auth = authenticatedAccess();
	let query = getAllManuals();
	let allManuals = $derived(query.current?.manuals ?? []);
	let totalManuals = $derived(allManuals.length);

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	// Filter states
	let searchQuery = $state('');
	let categoryFilter = $state('');
	let publishedFilter = $state<string>('');

	let page = $state(1);
	const perPage = 10;

	let creatingManual = $state(false);

	let refreshAction = $state(false);

	const categoryEntries = Object.entries(MANUAL_CATEGORY_LABELS) as [ManualCategory, string][];

	// Filtered manuals
	let filteredManuals = $derived(() => {
		let manuals = allManuals as ManualWithDetails[];

		if (categoryFilter) {
			manuals = manuals.filter((m) => m.category === categoryFilter);
		}

		if (publishedFilter === 'published') {
			manuals = manuals.filter((m) => m.published === true);
		} else if (publishedFilter === 'draft') {
			manuals = manuals.filter((m) => m.published === false);
		}

		if (searchQuery) {
			manuals = manuals.filter(
				(manual) =>
					manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(manual.description &&
						manual.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
					manual.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(manual.profiles &&
						manual.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		}

		return manuals;
	});

	let paginatedManuals = $derived(() => {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return filteredManuals().slice(start, end);
	});

	// Reset page when filters change
	$effect(() => {
		if (searchQuery || categoryFilter || publishedFilter) {
			page = 1;
		}
	});

	async function refresh() {
		refreshAction = true;
		await query.refresh();
		clearAllFilters();
		refreshAction = false;
	}

	function clearSearch() {
		searchQuery = '';
	}

	function clearAllFilters() {
		searchQuery = '';
		categoryFilter = '';
		publishedFilter = '';
		page = 1;
	}

	let hasActiveFilters = $derived(searchQuery || categoryFilter || publishedFilter);
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
			<!-- Header Section -->
			<div class="mb-8 space-y-4">
				<div class="flex flex-col gap-2">
					<h1 class="font-mono text-3xl tracking-wider text-foreground md:text-4xl">
						Διαχείριση Εγχειριδίων
					</h1>
					<p class="text-xs text-primary md:text-sm">
						Δημιουργήστε, επεξεργαστείτε και διαχειριστείτε τα εγχειρίδια εκπαίδευσης
					</p>
					<div class="flex items-center gap-2">
						<p class="text-xs text-muted-foreground md:text-sm">
							Εμφάνιση:
							<span class="font-semibold text-foreground">{filteredManuals().length}</span>
							/ {totalManuals} εγχειρίδια
						</p>
						{#if hasActiveFilters}
							<Button
								variant="secondary"
								size="sm"
								onclick={clearAllFilters}
								class="h-6 cursor-pointer px-2 text-xs"
							>
								<X class="mr-1 h-3 w-3" />
								Καθαρισμός φίλτρων
							</Button>
						{/if}
					</div>
				</div>

				<!-- Filters & Actions Section -->
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<!-- Published Status Filter -->
						<Select.Root type="single" bind:value={publishedFilter}>
							<Select.Trigger class="w-full sm:w-[160px]">
								{publishedFilter === 'published'
									? 'Δημοσιευμένα'
									: publishedFilter === 'draft'
										? 'Πρόχειρα'
										: 'Καταστάσεις'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Κατάσταση</Select.Label>
									<Select.Item value="" label="Όλες">Όλες οι Καταστάσεις</Select.Item>
									<Select.Item value="published" label="Δημοσιευμένα">Δημοσιευμένα</Select.Item>
									<Select.Item value="draft" label="Πρόχειρα">Πρόχειρα</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>

						<!-- Category Filter -->
						<Select.Root type="single" bind:value={categoryFilter}>
							<Select.Trigger class="w-full sm:w-[180px]">
								{categoryFilter
									? MANUAL_CATEGORY_LABELS[categoryFilter as ManualCategory]
									: 'Κατηγορίες'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Κατηγορίες</Select.Label>
									<Select.Item value="" label="Όλες">Όλες οι Κατηγορίες</Select.Item>
									{#each categoryEntries as [value, label]}
										<Select.Item {value} {label}>{label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Search Input & Actions -->
					<div class="flex items-center gap-2">
						<!-- Add Button -->
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="default"
										size="sm"
										class="h-8 cursor-pointer gap-2 px-3"
										onclick={() => (creatingManual = true)}
									>
										<Plus class="h-4 w-4" />
										<span class="hidden sm:inline">Νέο Εγχειρίδιο</span>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Δημιουργία Εγχειριδίου</p>
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
									<p>Ανανέωση</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>

						<!-- Search Input -->
						<div class="relative">
							<Input
								bind:value={searchQuery}
								class="w-full py-1 pr-8 sm:w-64"
								placeholder="Αναζήτηση εγχειριδίων..."
							/>
							{#if searchQuery}
								<Button
									variant="ghost"
									size="icon"
									onclick={clearSearch}
									class="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 cursor-pointer"
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
				<div class="space-y-3">
					{#each Array(5) as _}
						<div
							class="rounded-xl border border-border/50 bg-card p-4 shadow-sm dark:border-white/10"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-3">
									<div class="flex items-start gap-4">
										<Skeleton class="h-20 w-32 flex-shrink-0 rounded-lg" />
										<div class="flex-1 space-y-2">
											<Skeleton class="h-5 w-3/4" />
											<Skeleton class="h-4 w-full" />
											<Skeleton class="h-4 w-2/3" />
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Skeleton class="h-6 w-20 rounded-full" />
										<Skeleton class="h-6 w-24 rounded-full" />
										<Skeleton class="h-4 w-32" />
									</div>
								</div>
								<div class="flex gap-1">
									<Skeleton class="h-8 w-8 rounded-lg" />
									<Skeleton class="h-8 w-8 rounded-lg" />
									<Skeleton class="h-8 w-8 rounded-lg" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if filteredManuals().length === 0}
				<EmptyComp
					title="Δεν βρέθηκαν εγχειρίδια"
					description={hasActiveFilters
						? 'Δοκιμάστε να αλλάξετε τα φίλτρα'
						: 'Ξεκινήστε δημιουργώντας το πρώτο εγχειρίδιο'}
					icon={BookOpen as any}
					primaryLabel={hasActiveFilters ? 'Καθαρισμός Φίλτρων' : 'Νέο Εγχειρίδιο'}
					onPrimaryClick={hasActiveFilters ? clearAllFilters : () => (creatingManual = true)}
					primaryIcon={hasActiveFilters ? RefreshCcw : Plus as any}
				/>
			{:else}
				<!-- Manuals List -->
				<div class="space-y-3">
					{#each paginatedManuals() as manual (manual.id)}
						<ManualCard {manual} onUpdate={refresh} />
					{/each}
				</div>

				<!-- Pagination -->
				{#if filteredManuals().length > perPage}
					<div class="mt-8 flex justify-center">
						<Pagination.Root count={filteredManuals().length} bind:page {perPage}>
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.PrevButton />
								</Pagination.Item>
								{#each Array(Math.ceil(filteredManuals().length / perPage)) as _, i}
									<Pagination.Item>
										<Pagination.Link
											page={{ value: i + 1, type: 'page' }}
											isActive={page === i + 1}
										/>
									</Pagination.Item>
								{/each}
								<Pagination.Item>
									<Pagination.NextButton />
								</Pagination.Item>
							</Pagination.Content>
						</Pagination.Root>
					</div>
				{/if}
			{/if}
		</main>
	</div>
{/if}

<!-- Add Manual Dialog -->
<AddManualDialog bind:open={creatingManual} onSuccess={refresh} />
