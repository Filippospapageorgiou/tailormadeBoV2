<script lang="ts">
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { markManualAsRead } from '../../../../lib/api/manual/data.remote';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Carousel from '$lib/components/ui/carousel';
	import { BookOpen, CheckCircle2, User, Calendar, ChevronRight, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

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

	const categoryColors: Record<string, string> = {
		equipment: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
		cleaning: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
		sales: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
		customer_service: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
		safety: 'bg-red-500/10 text-red-700 dark:text-red-400',
		inventory: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
		opening_closing: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
		other: 'bg-muted text-muted-foreground'
	};

	let hasMultipleImages = $derived(manual.media && manual.media.length > 1);
</script>

<!-- Card -->
<div
	style="animation-delay: {index * 100}ms; animation-fill-mode: backwards;"
	class="card-glass group animate-fade-in-down {manual.is_read ? 'opacity-75' : ''}"
	role="button"
	tabindex="0"
	onclick={() => (expanded = !expanded)}
	onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
>
	<!-- Hero Image -->
	<div class="card-glass-image relative h-52 sm:h-56">
		{#if manual.media && manual.media.length > 0}
			<img
				src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
				alt={manual.title}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
			/>
			<div class="card-glass-image-overlay"></div>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40"
			>
				<BookOpen class="h-14 w-14 text-muted-foreground/20" />
			</div>
		{/if}

		<!-- Read status indicator -->
		{#if manual.is_read}
			<div class="absolute top-3 right-3">
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm backdrop-blur-sm"
				>
					<CheckCircle2 class="h-3 w-3" />
					Αναγνωσμένο
				</span>
			</div>
		{/if}

		<!-- Bottom overlay with category + image count -->
		<div class="absolute right-0 bottom-0 left-0 flex items-end justify-between px-4 pb-3">
			<Badge
				class="rounded-full border-0 text-[11px] font-semibold shadow-sm backdrop-blur-sm {categoryColors[
					manual.category
				] || categoryColors.other}"
			>
				{MANUAL_CATEGORY_LABELS[manual.category]}
			</Badge>
			{#if hasMultipleImages}
				<span
					class="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
				>
					{manual.media.length} φωτογραφίες
				</span>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="card-glass-content space-y-3 p-5">
		<!-- Title -->
		<div>
			<h3 class="card-glass-title !mb-1.5 text-xl leading-tight font-bold tracking-tight">
				{manual.title}
			</h3>
			{#if manual.description}
				<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
					{manual.description}
				</p>
			{:else}
				<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground/70">
					{truncateText(manual.content)}
				</p>
			{/if}
		</div>

		<!-- Meta -->
		<div class="flex items-center gap-3 text-[11px] text-muted-foreground">
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

		<!-- Read more indicator -->
		<div class="card-glass-readmore mt-auto pt-1">
			<span>Διαβάστε περισσότερα</span>
			<ChevronRight />
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
			<div class="max-h-[40vh] space-y-5 overflow-y-auto p-6 sm:p-8">
				{#if manual.description}
					<p class="text-sm leading-relaxed font-medium text-muted-foreground">
						{manual.description}
					</p>
				{/if}

				<!-- Full content (Markdown + HTML) -->
				{#if manual.content}
					<div>
						{@html manual.content}
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
