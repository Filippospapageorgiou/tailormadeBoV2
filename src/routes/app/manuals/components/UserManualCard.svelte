<script lang="ts">
	import type { ManualWithDetails } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { Badge } from '$lib/components/ui/badge';
	import { BookOpen, CheckCircle2, User, Calendar, ChevronRight } from 'lucide-svelte';

	let {
		manual,
		index = 0,
		onSelect
	}: {
		manual: ManualWithDetails;
		index?: number;
		onSelect?: (manual: ManualWithDetails) => void;
	} = $props();

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
	class="group animate-fade-in-down cursor-pointer overflow-hidden rounded-xl
		border border-border/60 bg-background/70 shadow-sm backdrop-blur-sm
		transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md
		dark:bg-background/50 {manual.is_read ? 'opacity-65' : ''}"
	role="button"
	tabindex="0"
	onclick={() => onSelect?.(manual)}
	onkeydown={(e) => e.key === 'Enter' && onSelect?.(manual)}
>
	<!-- Hero Image -->
	<div class="relative h-48 w-full overflow-hidden sm:h-44">
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
	<div class="space-y-2.5 p-4">
		<div>
			<h3
				class="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary"
			>
				{manual.title}
			</h3>
			{#if manual.description}
				<p class="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
					{manual.description}
				</p>
			{/if}
		</div>

		<!-- Meta -->
		<div class="flex items-center justify-between">
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
			<ChevronRight
				class="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
			/>
		</div>
	</div>
</div>
