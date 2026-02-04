<script lang="ts">
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { publishManual, unpublishManual } from '../../../../lib/api/manual/data.remote';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Pencil, Trash2, Eye, EyeOff, Calendar, User, ImageOff, BookOpen } from 'lucide-svelte';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import EditManualDialog from './EditManualDialog.svelte';
	import DeleteManualDialog from './DeleteManualDialog.svelte';
	import { toast } from 'svelte-sonner';

	let {
		manual,
		index = 0,
		onUpdate
	}: {
		manual: ManualWithDetails;
		index?: number;
		onUpdate: () => Promise<void>;
	} = $props();

	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);

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

	function truncateText(text: string, maxLength: number = 120): string {
		if (!text) return '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	async function handleTogglePublish() {
		const isPublished = manual.published;
		showProgress(isPublished ? 'Απόσυρση...' : 'Δημοσίευση...');

		try {
			const result = isPublished
				? await unpublishManual({ id: manual.id })
				: await publishManual({ id: manual.id });

			if (result.success) {
				await onUpdate();
				toast.success(result.message);
			} else {
				toast.error('Αποτυχία ενημέρωσης');
			}
		} catch (error: any) {
			toast.error('Αποτυχία ενημέρωσης');
		} finally {
			hideProgress();
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

	function formatDateShort(date: string) {
		return new Date(date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
	}
</script>

<div
	style="animation-delay: {index * 80}ms; animation-fill-mode: backwards;"
	class="card-glass group animate-fade-in-down !cursor-default !rounded-xl"
>
	<!-- Mobile: Stack layout / Desktop: Horizontal layout -->
	<div class="flex flex-col sm:flex-row sm:items-stretch">
		<!-- Thumbnail -->
		<div class="relative h-48 w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-40 md:w-48">
			{#if manual.media && manual.media.length > 0}
				<img
					src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
					alt={manual.title}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 sm:bg-gradient-to-r sm:from-transparent sm:to-black/10"
				></div>
			{:else}
				<div class="flex h-full w-full items-center justify-center bg-muted/50">
					<div class="flex flex-col items-center gap-1.5 text-muted-foreground/40">
						<ImageOff class="h-8 w-8" />
						<span class="text-[10px] font-medium tracking-wider uppercase">No media</span>
					</div>
				</div>
			{/if}

			<!-- Media count badge -->
			{#if manual.media && manual.media.length > 1}
				<div class="absolute bottom-2 left-2">
					<span
						class="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
					>
						+{manual.media.length - 1}
					</span>
				</div>
			{/if}

			<!-- Category badge on mobile (over image) -->
			<div class="absolute top-2 left-2 sm:hidden">
				<Badge
					class="rounded-full border-0 text-[10px] font-semibold shadow-sm {categoryColors[
						manual.category
					] || categoryColors.other}"
				>
					{MANUAL_CATEGORY_LABELS[manual.category]}
				</Badge>
			</div>
		</div>

		<!-- Content Column -->
		<div class="flex flex-1 flex-col justify-between p-4 sm:p-5">
			<div class="space-y-2.5">
				<!-- Top row: Title + Actions -->
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1">
						<!-- Title row -->
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<h3
								class="line-clamp-2 text-base leading-snug font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-lg"
							>
								{manual.title}
							</h3>
							<span class="flex-shrink-0 font-mono text-[10px] text-muted-foreground"
								>#{manual.id}</span
							>
						</div>

						<!-- Description -->
						{#if manual.description}
							<p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
								{manual.description}
							</p>
						{:else if manual.content}
							<p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground/70">
								{truncateText(manual.content)}
							</p>
						{/if}
					</div>

					<!-- Action buttons - always visible -->
					<div class="flex flex-shrink-0 items-center gap-0.5">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<div class="pr-1">
										<Switch
											id="toggle-{manual.id}"
											class="scale-90 cursor-pointer sm:scale-100"
											checked={manual.published}
											onCheckedChange={handleTogglePublish}
										/>
									</div>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>{manual.published ? 'Απόσυρση' : 'Δημοσίευση'}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>

						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 cursor-pointer text-muted-foreground hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
										onclick={() => (editDialogOpen = true)}
									>
										<Pencil class="h-3.5 w-3.5" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content><p>Επεξεργασία</p></Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>

						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
										onclick={() => (deleteDialogOpen = true)}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content><p>Διαγραφή</p></Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</div>

				<!-- Meta row - wraps nicely on mobile -->
				<div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
					<!-- Status -->
					{#if manual.published}
						<Badge
							class="gap-1 rounded-full border-0 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 sm:text-[11px] dark:text-emerald-400"
						>
							<Eye class="h-3 w-3" />
							<span class="xs:inline hidden">Δημοσιευμένο</span>
							<span class="xs:hidden">Live</span>
						</Badge>
					{:else}
						<Badge
							class="gap-1 rounded-full border-0 bg-muted text-[10px] font-semibold text-muted-foreground sm:text-[11px]"
						>
							<EyeOff class="h-3 w-3" />
							<span class="xs:inline hidden">Πρόχειρο</span>
							<span class="xs:hidden">Draft</span>
						</Badge>
					{/if}

					<!-- Category (hidden on mobile, shown in image) -->
					<Badge
						class="hidden rounded-full border-0 text-[11px] font-semibold sm:inline-flex {categoryColors[
							manual.category
						] || categoryColors.other}"
					>
						{MANUAL_CATEGORY_LABELS[manual.category]}
					</Badge>

					<!-- Separator dot -->
					<span class="hidden text-muted-foreground/30 sm:inline">•</span>

					<!-- Read Count -->
					{#if manual.read_count !== undefined}
						<span class="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
							<BookOpen class="h-3 w-3" />
							{manual.read_count}
						</span>
					{/if}

					<!-- Author - hide on very small screens -->
					{#if manual.profiles}
						<span class="xs:flex hidden items-center gap-1 text-[11px] text-muted-foreground">
							<User class="h-3 w-3" />
							{manual.profiles.username}
						</span>
					{/if}

					<!-- Date -->
					<span class="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
						<Calendar class="h-3 w-3" />
						<span class="hidden sm:inline">{formatDate(manual.created_at)}</span>
						<span class="sm:hidden">{formatDateShort(manual.created_at)}</span>
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Dialogs -->
<EditManualDialog bind:open={editDialogOpen} {manual} onSuccess={onUpdate} />
<DeleteManualDialog bind:open={deleteDialogOpen} {manual} onSuccess={onUpdate} />
