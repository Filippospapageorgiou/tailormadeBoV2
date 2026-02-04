<script lang="ts">
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { markManualAsRead } from '../../../../lib/api/manual/data.remote';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		BookOpen,
		CheckCircle2,
		User,
		Calendar,
		ChevronRight,
		ImageOff
	} from 'lucide-svelte';
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

	function truncateText(text: string, maxLength: number = 180): string {
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
</script>

<div
	style="animation-delay: {index * 100}ms; animation-fill-mode: backwards;"
	class="card-glass group animate-fade-in-down {manual.is_read ? 'opacity-80' : ''}"
	role="button"
	tabindex="0"
	onclick={() => (expanded = !expanded)}
	onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
>
	<!-- Hero Image -->
	<div class="card-glass-image relative h-48">
		{#if manual.media && manual.media.length > 0}
			<img
				src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
				alt={manual.title}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
			/>
			<div class="card-glass-image-overlay"></div>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
				<BookOpen class="h-12 w-12 text-muted-foreground/30" />
			</div>
		{/if}

		<!-- Read status indicator -->
		{#if manual.is_read}
			<div class="absolute top-3 right-3">
				<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
					<CheckCircle2 class="h-3 w-3" />
					Αναγνωσμένο
				</span>
			</div>
		{/if}

		<!-- Category badge overlay -->
		<div class="absolute bottom-3 left-3">
			<Badge class="rounded-full border-0 text-[11px] font-semibold shadow-sm backdrop-blur-sm {categoryColors[manual.category] || categoryColors.other}">
				{MANUAL_CATEGORY_LABELS[manual.category]}
			</Badge>
		</div>

		<!-- Image count -->
		{#if manual.media && manual.media.length > 1}
			<div class="absolute bottom-3 right-3">
				<span class="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
					{manual.media.length} φωτογραφίες
				</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="card-glass-content space-y-3">
		<div>
			<h3 class="card-glass-title !mb-1 font-serif text-lg">
				{manual.title}
			</h3>
			{#if manual.description}
				<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
					{manual.description}
				</p>
			{:else}
				<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground/70">
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

<!-- Expanded content overlay -->
{#if expanded}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		onclick={() => (expanded = false)}
		onkeydown={(e) => e.key === 'Escape' && (expanded = false)}
	>
		<div class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl">
			<!-- Header image -->
			{#if manual.media && manual.media.length > 0}
				<div class="relative h-56 w-full overflow-hidden">
					<img
						src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
						alt={manual.title}
						class="h-full w-full object-cover"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>
					<div class="absolute bottom-4 left-6 right-6">
						<Badge class="mb-2 rounded-full border-0 text-[11px] font-semibold {categoryColors[manual.category] || categoryColors.other}">
							{MANUAL_CATEGORY_LABELS[manual.category]}
						</Badge>
						<h2 class="font-serif text-2xl font-semibold text-white drop-shadow-lg">
							{manual.title}
						</h2>
					</div>
				</div>
			{:else}
				<div class="px-6 pt-6">
					<Badge class="mb-2 rounded-full border-0 text-[11px] font-semibold {categoryColors[manual.category] || categoryColors.other}">
						{MANUAL_CATEGORY_LABELS[manual.category]}
					</Badge>
					<h2 class="font-serif text-2xl font-semibold text-foreground">
						{manual.title}
					</h2>
				</div>
			{/if}

			<div class="space-y-5 p-6">
				{#if manual.description}
					<p class="text-sm font-medium leading-relaxed text-muted-foreground">
						{manual.description}
					</p>
				{/if}

				<!-- Full content -->
				<div class="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
					{manual.content}
				</div>

				<!-- All images -->
				{#if manual.media && manual.media.length > 1}
					<div class="grid grid-cols-2 gap-3">
						{#each manual.media.slice(1) as mediaUrl}
							<div class="overflow-hidden rounded-xl border border-border/50">
								<img src={mediaUrl} alt="" class="h-40 w-full object-cover" />
							</div>
						{/each}
					</div>
				{/if}

				<!-- Meta footer -->
				<div class="flex items-center justify-between border-t border-border/50 pt-4">
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
							<span class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
								<CheckCircle2 class="h-4 w-4" />
								Αναγνωσμένο
							</span>
						{:else}
							<Button
								variant="default"
								size="sm"
								class="cursor-pointer gap-2"
								onclick={(e: MouseEvent) => { e.stopPropagation(); handleMarkAsRead(); }}
								disabled={markingAsRead}
							>
								<CheckCircle2 class="h-4 w-4" />
								{markingAsRead ? 'Αποθήκευση...' : 'Σημείωσε ως αναγνωσμένο'}
							</Button>
						{/if}
						<Button
							variant="outline"
							size="sm"
							class="cursor-pointer"
							onclick={(e: MouseEvent) => { e.stopPropagation(); expanded = false; }}
						>
							Κλείσιμο
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
