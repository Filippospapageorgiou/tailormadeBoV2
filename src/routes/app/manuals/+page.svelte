<script lang="ts">
	import { getPublishedManuals, markManualAsRead } from '../../../lib/api/manual/data.remote';
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Carousel from '$lib/components/ui/carousel';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		BookOpen,
		Search,
		X,
		RefreshCcw,
		CheckCircle2,
		User,
		Calendar,
		Eye,
		EyeOff
	} from 'lucide-svelte';
	import UserManualCard from './components/UserManualCard.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { toast } from 'svelte-sonner';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let query = getPublishedManuals({});
	let allManuals = $derived(query.current?.manuals ?? []);

	let searchQuery = $state('');
	let activeTab = $state('all');
	let showReadFilter = $state<string>('');
	let refreshAction = $state(false);

	// Sheet state
	let selectedManual = $state<ManualWithDetails | null>(null);
	let sheetOpen = $state(false);
	let markingAsRead = $state(false);

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

	async function refresh() {
		refreshAction = true;
		await query.refresh();
		refreshAction = false;
	}

	function openManual(manual: ManualWithDetails) {
		selectedManual = manual;
		sheetOpen = true;
	}

	async function handleMarkAsRead() {
		if (!selectedManual) return;
		markingAsRead = true;
		try {
			const result = await markManualAsRead({ id: selectedManual.id });
			if (result.success) {
				toast.success(result.message);
				await refresh();
				// Update selectedManual to reflect read status
				const updated = allManuals.find((m: any) => m.id === selectedManual!.id);
				if (updated) selectedManual = updated as ManualWithDetails;
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Παρουσιάστηκε σφάλμα');
		} finally {
			markingAsRead = false;
		}
	}

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('el-GR', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return '';
		}
	}

	let renderedContent = $derived(
		selectedManual?.content
			? DOMPurify.sanitize(marked.parse(selectedManual.content) as string)
			: ''
	);

	let hasMultipleImages = $derived(selectedManual?.media && selectedManual.media.length > 1);

	let hasActiveFilters = $derived(searchQuery || activeTab !== 'all' || showReadFilter);

	const categoryColors: Record<string, string> = {
		equipment: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
		cleaning: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
		sales: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
		customer_service: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
		safety: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
		inventory: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20',
		opening_closing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20',
		other: 'bg-muted text-muted-foreground ring-border'
	};
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

			<!-- Content area (no TabsContent needed - we filter via derived) -->
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
					<UserManualCard {manual} {index} onSelect={openManual} />
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Sheet Detail View -->
<Sheet.Root
	bind:open={sheetOpen}
	onOpenChange={(open) => {
		if (!open) selectedManual = null;
	}}
>
	<Sheet.Content side="right" class="w-full overflow-y-auto p-0 sm:max-w-xl">
		{#if selectedManual}
			<!-- Image section -->
			{#if selectedManual.media && selectedManual.media.length > 0}
				{#if hasMultipleImages}
					<div class="relative w-full">
						<Carousel.Root opts={{ loop: true }} class="w-full">
							<Carousel.Content>
								{#each selectedManual.media as mediaUrl, i (`${mediaUrl}-${i}`)}
									<Carousel.Item>
										<div class="relative h-56 w-full sm:h-64">
											<img
												src={mediaUrl}
												alt="{selectedManual.title} - {i + 1}"
												class="h-full w-full object-cover"
											/>
										</div>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							<Carousel.Previous
								class="left-3 h-9 w-9 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 dark:text-black"
							/>
							<Carousel.Next
								class="right-3 h-9 w-9 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 dark:text-black"
							/>
						</Carousel.Root>
					</div>
				{:else}
					<div class="relative h-56 w-full sm:h-64">
						<img
							src={typeof selectedManual.media[0] === 'string' ? selectedManual.media[0] : ''}
							alt={selectedManual.title}
							class="h-full w-full object-cover"
						/>
					</div>
				{/if}
			{/if}

			<!-- Header -->
			<div class="space-y-3 border-b border-border/50 px-6 pt-5 pb-4">
				<Badge
					class="rounded-full border-0 text-[11px] font-semibold ring-1 {categoryColors[
						selectedManual.category
					] || categoryColors.other}"
				>
					{MANUAL_CATEGORY_LABELS[selectedManual.category]}
				</Badge>
				<h2 class="text-xl leading-tight font-bold text-foreground sm:text-2xl">
					{selectedManual.title}
				</h2>
				{#if selectedManual.description}
					<p class="text-sm leading-relaxed text-muted-foreground">
						{selectedManual.description}
					</p>
				{/if}
				<div class="flex items-center gap-3 text-xs text-muted-foreground">
					{#if selectedManual.profiles}
						<span class="flex items-center gap-1.5">
							<User class="h-3.5 w-3.5" />
							{selectedManual.profiles.username}
						</span>
					{/if}
					<span class="flex items-center gap-1.5">
						<Calendar class="h-3.5 w-3.5" />
						{formatDate(selectedManual.created_at)}
					</span>
				</div>
			</div>

			<!-- Content body -->
			{#if selectedManual.content}
				<div class="px-6 py-5">
					<div class="preview-content" role="document" aria-label="Markdown preview">
						{#if selectedManual.content.trim()}
							{@html renderedContent}
						{:else}
							<p class="text-muted-foreground italic">Nothing to preview</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Footer action -->
			<div
				class="sticky bottom-0 border-t border-border/50 bg-background/95 px-6 py-4 backdrop-blur-sm"
			>
				{#if selectedManual.is_read}
					<span
						class="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
					>
						<CheckCircle2 class="h-4 w-4" />
						Αναγνωσμένο
					</span>
				{:else}
					<Button
						variant="default"
						class="w-full cursor-pointer gap-2"
						onclick={() => handleMarkAsRead()}
						disabled={markingAsRead}
					>
						{#if markingAsRead}
							<Spinner />
							Αποθήκευση...
						{:else}
							<CheckCircle2 class="h-4 w-4" />
							Σημείωσε ως αναγνωσμένο
						{/if}
					</Button>
				{/if}
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<style>
	/* Preview content styling */
	.preview-content :global(h1) {
		font-size: 1.875rem;
		line-height: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h2) {
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h3) {
		font-size: 1.25rem;
		line-height: 1.75rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(p) {
		margin-bottom: 1rem;
		line-height: 1.625;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(li) {
		margin-bottom: 0.25rem;
	}

	.preview-content :global(blockquote) {
		border-left-width: 4px;
		border-color: hsl(var(--muted-foreground));
		padding-left: 1rem;
		font-style: italic;
		margin-bottom: 1rem;
		color: hsl(var(--muted-foreground));
	}

	.preview-content :global(code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		color: hsl(var(--foreground));
	}

	.preview-content :global(pre) {
		background-color: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.preview-content :global(pre code) {
		background-color: transparent;
		padding: 0;
		border-radius: 0;
	}

	.preview-content :global(mark) {
		background-color: rgb(254 240 138);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}

	:global(.dark) .preview-content :global(mark) {
		background-color: rgb(133 77 14);
		color: rgb(254 243 199);
	}

	.preview-content :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	.preview-content :global(a:hover) {
		opacity: 0.8;
	}

	.preview-content :global(img) {
		max-width: 100%;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.preview-content :global(u) {
		text-decoration: underline;
	}

	.preview-content :global(del),
	.preview-content :global(s) {
		text-decoration: line-through;
	}

	.preview-content :global(hr) {
		border: none;
		border-top: 1px solid hsl(var(--border));
		margin: 1.5rem 0;
	}

	.preview-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.preview-content :global(th),
	.preview-content :global(td) {
		border: 1px solid hsl(var(--border));
		padding: 0.5rem;
		text-align: left;
	}

	.preview-content :global(th) {
		background-color: hsl(var(--muted));
		font-weight: 600;
	}
</style>
