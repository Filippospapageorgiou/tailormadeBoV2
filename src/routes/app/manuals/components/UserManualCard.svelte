<script lang="ts">
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { markManualAsRead } from '../../../../lib/api/manual/data.remote';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Carousel from '$lib/components/ui/carousel';
	import { BookOpen, CheckCircle2, User, Calendar, ChevronRight, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let {
		manual,
		index = 0,
		onRead
	}: {
		manual: ManualWithDetails;
		index?: number;
		onRead?: () => Promise<void>;
	} = $props();

	let expanded = $state(false);
	let markingAsRead = $state(false);

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

	function truncateText(text: string, maxLength: number = 220): string {
		if (!text) return '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	async function handleMarkAsRead() {
		markingAsRead = true;
		try {
			const result = await markManualAsRead({ id: manual.id });
			if (result.success) {
				toast.success(result.message);
				if (onRead) await onRead();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Παρουσιάστηκε σφάλμα');
		} finally {
			markingAsRead = false;
		}
	}

	const renderedContent = $derived(
		manual.content ? DOMPurify.sanitize(marked.parse(manual.content) as string) : ''
	);

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

	let hasMultipleImages = $derived(manual.media && manual.media.length > 1);
</script>

<div
	style="animation-delay: {index * 80}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-down overflow-hidden rounded-xl cursor-pointer border border-border/60 bg-background/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-md dark:bg-background/50 {manual.is_read ? 'opacity-70' : ''}"
	role="button"
	tabindex="0"
	onclick={() => (expanded = !expanded)}
	onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
>
	<!-- Hero Image -->
	<div class="relative h-48 w-full overflow-hidden sm:h-52">
		{#if manual.media && manual.media.length > 0}
			<img
				src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
				alt={manual.title}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
			></div>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center bg-muted/30 dark:bg-muted/20"
			>
				<BookOpen class="h-12 w-12 text-muted-foreground/20" />
			</div>
		{/if}

		<!-- Read status -->
		{#if manual.is_read}
			<div class="absolute top-3 right-3">
				<Badge
					class="gap-1 rounded-md border-0 bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md"
				>
					<CheckCircle2 class="h-3 w-3" />
					Αναγνωσμένο
				</Badge>
			</div>
		{/if}

		<!-- Bottom overlay: category + image count -->
		<div class="absolute right-0 bottom-0 left-0 flex items-end justify-between px-4 pb-3">
			<Badge
				class="rounded-md border-0 text-[10px] font-semibold shadow-sm ring-1 backdrop-blur-md {categoryColors[
					manual.category
				] || categoryColors.other}"
			>
				{MANUAL_CATEGORY_LABELS[manual.category]}
			</Badge>
			{#if hasMultipleImages}
				<span
					class="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"
				>
					{manual.media.length} φωτό
				</span>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-3 p-4 sm:p-5">
		<div>
			<h3
				class="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary"
			>
				{manual.title}
			</h3>
			{#if manual.description}
				<p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
					{manual.description}
				</p>
			{:else if manual.content}
				<p
					class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground/60 italic"
				>
					{truncateText(manual.content)}
				</p>
			{/if}
		</div>

		<!-- Meta -->
		<div class="flex items-center gap-3 text-[11px] text-muted-foreground/70">
			{#if manual.profiles}
				<span class="flex items-center gap-1">
					<User class="h-3 w-3" />
					{manual.profiles.username}
				</span>
			{/if}
			<span class="flex items-center gap-1">
				<Calendar class="h-3 w-3" />
				{formatDate(manual.created_at)}
			</span>
		</div>

		<!-- Read more -->
		<div
			class="flex items-center gap-1.5 pt-1 text-xs font-medium text-primary/80 transition-colors group-hover:text-primary"
		>
			<span>Διαβάστε περισσότερα</span>
			<ChevronRight
				class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
			/>
		</div>
	</div>
</div>


{#if expanded}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8 pb-8 backdrop-blur-sm md:items-center md:pt-4"
		onclick={() => (expanded = false)}
		onkeydown={(e) => e.key === 'Escape' && (expanded = false)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-3xl rounded-2xl border border-border/50 bg-card shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<!-- Close button -->
			<button
				class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
				onclick={() => (expanded = false)}
			>
				<X class="h-4 w-4" />
			</button>

			<!-- Header image / Carousel -->
			{#if manual.media && manual.media.length > 0}
				{#if hasMultipleImages}
					<!-- Carousel for multiple images -->
					<div class="relative overflow-hidden rounded-t-2xl">
						<Carousel.Root opts={{ loop: true }} class="w-full">
							<Carousel.Content>
								{#each manual.media as mediaUrl, i (mediaUrl)}
									<Carousel.Item>
										<div class="relative h-64 w-full sm:h-72">
											<img
												src={mediaUrl}
												alt="{manual.title} - {i + 1}"
												class="h-full w-full object-cover"
											/>
										</div>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							<Carousel.Previous
								class="left-3 h-9 w-9 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
							/>
							<Carousel.Next
								class="right-3 h-9 w-9 border-0 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
							/>
						</Carousel.Root>
					</div>
				{:else}
					<!-- Single image -->
					<div class="relative h-64 w-full overflow-hidden rounded-t-2xl sm:h-72">
						<img
							src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
							alt={manual.title}
							class="h-full w-full object-cover"
						/>
					</div>
				{/if}

				<!-- Title below images -->
				<div class="px-6 pt-5 pb-2">
					<Badge
						class="mb-2 rounded-full border-0 text-[11px] font-semibold {categoryColors[
							manual.category
						] || categoryColors.other}"
					>
						{MANUAL_CATEGORY_LABELS[manual.category]}
					</Badge>
					<h2 class="text-2xl leading-tight font-bold text-foreground sm:text-3xl">
						{manual.title}
					</h2>
				</div>
			{:else}
				<!-- No image header -->
				<div class="px-6 pt-8 pb-2">
					<Badge
						class="mb-3 rounded-full border-0 text-[11px] font-semibold {categoryColors[
							manual.category
						] || categoryColors.other}"
					>
						{MANUAL_CATEGORY_LABELS[manual.category]}
					</Badge>
					<h2 class="text-2xl leading-tight font-bold text-foreground sm:text-3xl">
						{manual.title}
					</h2>
				</div>
			{/if}

			<!-- Scrollable body -->
			<div class="max-h-[35vh] space-y-5 overflow-y-auto p-6 sm:p-8">
				{#if manual.description}
					<p class="text-sm leading-relaxed font-medium text-muted-foreground">
						{manual.description}
					</p>
				{/if}

				{#if manual.content}
					<div
						class="preview-content overflow-auto p-4"
						role="document"
						aria-label="Markdown preview"
					>
						{#if manual.content.trim()}
							{@html renderedContent}
						{:else}
							<p class="text-muted-foreground italic">Nothing to preview</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Sticky footer -->
			<div class="flex items-center justify-between border-t border-border/50 px-6 py-4 sm:px-8">
				<div class="flex items-center gap-3 text-xs text-muted-foreground">
					{#if manual.profiles}
						<span class="flex items-center gap-1">
							<User class="h-3.5 w-3.5" />
							{manual.profiles.username}
						</span>
					{/if}
					<span class="flex items-center gap-1">
						<Calendar class="h-3.5 w-3.5" />
						{formatDate(manual.created_at)}
					</span>
				</div>

				<div class="flex items-center gap-2">
					{#if manual.is_read}
						<span
							class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
						>
							<CheckCircle2 class="h-4 w-4" />
							Αναγνωσμένο
						</span>
					{:else}
						<Button
							variant="default"
							size="sm"
							class="cursor-pointer gap-2"
							onclick={() => handleMarkAsRead()}
							disabled={markingAsRead}
						>
							<CheckCircle2 class="h-4 w-4" />
							{markingAsRead ? 'Αποθήκευση...' : 'Σημείωσε ως αναγνωσμένο'}
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

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
