<script lang="ts">
	import { FileDropZone, ACCEPT_IMAGE, MEGABYTE } from '$lib/components/ui/file-drop-zone/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Camera, X, ChevronDown, ChevronUp, ImageIcon, AlertTriangle, Plus } from 'lucide-svelte';
	import type { PhotoCategory } from '$lib/models/trainers.types';
	import { PHOTO_CATEGORY_LABELS, isProblemCategory } from '$lib/models/trainers.types';
	import { getEvaluationPhotosContext } from '$lib/stores/EvalutionPhotos.svelte';

	const store = getEvaluationPhotosContext();

	let expanded = $state(false);
	let dropdownOpen = $state(false);
	let activeCategories = $state<PhotoCategory[]>([]);

	const ALL_CATEGORIES: PhotoCategory[] = [
		'coffee_post',
		'espresso_machine',
		'machine_screen',
		'groops_showers',
		'portafilters',
		'grinders',
		'grinder_hopper',
		'water_filter',
		'tools',
		'problem_1',
		'problem_2',
		'problem_3'
	];

	// Categories not yet added
	const availableCategories = $derived(
		ALL_CATEGORIES.filter((c) => !activeCategories.includes(c))
	);

	function addCategory(category: PhotoCategory) {
		activeCategories = [...activeCategories, category];
		dropdownOpen = false;
		// Auto-expand when first category is added
		if (!expanded) expanded = true;
	}

	function removeCategory(category: PhotoCategory) {
		// Also remove all photos from this category
		const photos = store.getByCategory(category);
		photos.forEach((p) => store.removePhoto(p.id));
		activeCategories = activeCategories.filter((c) => c !== category);
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<Camera class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">Φωτογραφική Τεκμηρίωση</h4>
				<p class="text-xs text-muted-foreground">
					{store.totalPhotos} φωτογραφίες ·
					{#if store.hasProblemPhotos}
						<span class="text-amber-500">{store.problemPhotos.length} προβλήματα</span>
					{:else}
						κανένα πρόβλημα
					{/if}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Add Category Button -->
			<div class="relative">
				<button
					onclick={() => (dropdownOpen = !dropdownOpen)}
					disabled={availableCategories.length === 0}
					class="flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2 py-1.5
					       text-xs font-medium text-muted-foreground transition-colors
					       hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus class="h-3.5 w-3.5" />
					Κατηγορία
				</button>

				{#if dropdownOpen}
					<!-- Backdrop -->
					<button
						class="fixed inset-0 z-10"
						onclick={() => (dropdownOpen = false)}
						aria-label="Close dropdown"
					></button>

					<!-- Dropdown -->
					<div
						class="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border/60
						       bg-card shadow-lg"
					>
						<div class="max-h-64 overflow-y-auto">
							{#each availableCategories as category (category)}
								{@const isProblem = isProblemCategory(category)}
								<button
									onclick={() => addCategory(category)}
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs
									       transition-colors hover:bg-muted/60
									       {isProblem ? 'text-amber-500' : 'text-foreground'}"
								>
									{#if isProblem}
										<AlertTriangle class="h-3.5 w-3.5 shrink-0" />
									{:else}
										<ImageIcon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									{/if}
									{PHOTO_CATEGORY_LABELS[category] ?? category}
								</button>
							{/each}

							{#if availableCategories.length === 0}
								<p class="px-3 py-2 text-xs text-muted-foreground">Όλες οι κατηγορίες έχουν προστεθεί</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Expand/Collapse (only show if there are active categories) -->
			{#if activeCategories.length > 0}
				<button
					onclick={() => (expanded = !expanded)}
					class="text-muted-foreground transition-colors hover:text-foreground"
				>
					{#if expanded}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</button>
			{/if}
		</div>
	</div>


	{#if expanded && activeCategories.length > 0}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each activeCategories as category, i (category)}
				{@const photos = store.getByCategory(category)}
				{@const isProblem = isProblemCategory(category)}

				<div
					class="flex flex-col gap-2 overflow-hidden rounded-xl border bg-card/80 p-3
					{isProblem ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/60'}"
				>
					<!-- Category Header -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							{#if isProblem}
								<AlertTriangle class="h-3.5 w-3.5 text-amber-500" />
							{:else}
								<ImageIcon class="h-3.5 w-3.5 text-muted-foreground" />
							{/if}
							<span class="text-xs font-semibold">
								{i + 1}. {PHOTO_CATEGORY_LABELS[category] ?? category}
							</span>
						</div>
						<div class="flex items-center gap-1">
							{#if photos.length > 0}
								<Badge variant="secondary" class="text-[10px]">{photos.length}</Badge>
							{/if}
							<!-- Remove category button -->
							<button
								onclick={() => removeCategory(category)}
								class="rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-destructive"
								title="Αφαίρεση κατηγορίας"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					</div>

					<!-- Thumbnails -->
					{#if photos.length > 0}
						<div class="flex flex-wrap gap-1.5">
							{#each photos as photo (photo.id)}
								<div
									class="group relative h-14 w-14 overflow-hidden rounded-lg border border-border/60 bg-muted"
								>
									<img
										src={photo.previewUrl}
										alt={photo.file.name}
										class="h-full w-full object-cover"
									/>
									<button
										onclick={() => store.removePhoto(photo.id)}
										class="absolute inset-0 flex items-center justify-center bg-black/60
										       opacity-0 transition-opacity group-hover:opacity-100"
										title="Αφαίρεση"
									>
										<X class="h-4 w-4 text-white" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Problem description -->
					{#if isProblem && photos.length > 0}
						<InputGroup.Root>
							<InputGroup.Input
								placeholder="Περιγραφή προβλήματος..."
								value={photos[0]?.description ?? ''}
								oninput={(e) => {
									if (photos[0]) store.updateDescription(photos[0].id, e.currentTarget.value);
								}}
								class="text-xs"
							/>
						</InputGroup.Root>
					{/if}

					<!-- Drop Zone -->
					<FileDropZone
						accept={ACCEPT_IMAGE}
						maxFileSize={10 * MEGABYTE}
						fileCount={photos.length}
						onUpload={async (files) => store.addFiles(category, files)}
						class="h-24 {isProblem ? 'border-amber-500/30' : ''}"
					>
						<div class="flex flex-col items-center gap-1 text-muted-foreground">
							<Camera class="h-4 w-4" />
							<span class="text-[10px]">Προσθήκη φωτό</span>
						</div>
					</FileDropZone>
				</div>
			{/each}
		</div>
	{/if}
</div>