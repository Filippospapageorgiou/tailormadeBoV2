<script lang="ts">
	import type { ManualWithDetails, ManualCategory } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { publishManual, unpublishManual } from '$lib/api/manual/data.remote';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Pencil,
		Trash2,
		Eye,
		EyeOff,
		Calendar,
		User,
		ImageOff,
		BookOpen,
		MoreVertical
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
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

	function formatDateShort(date: string) {
		return new Date(date).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
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

<div
	style="animation-delay: {index * 60}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-down overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-md dark:bg-background/50"
>
	<div class="flex flex-col sm:flex-row">
		<!-- Thumbnail -->
		<div class="relative h-44 w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-44 md:w-52">
			{#if manual.media && manual.media.length > 0}
				<img
					src={typeof manual.media[0] === 'string' ? manual.media[0] : ''}
					alt={manual.title}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<!-- Gradient overlay -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-black/10"
				></div>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-muted/30 dark:bg-muted/20"
				>
					<div class="flex flex-col items-center gap-2 text-muted-foreground/30">
						<ImageOff class="h-10 w-10" />
						<span class="text-[10px] font-medium tracking-widest uppercase">No media</span>
					</div>
				</div>
			{/if}

			<!-- Media count -->
			{#if manual.media && manual.media.length > 1}
				<div class="absolute bottom-2.5 left-2.5">
					<span
						class="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"
					>
						+{manual.media.length - 1} φωτό
					</span>
				</div>
			{/if}

			<!-- Category badge on mobile -->
			<div class="absolute top-2.5 left-2.5 sm:hidden">
				<Badge
					class="rounded-md border-0 text-[10px] font-semibold shadow-sm ring-1 {categoryColors[
						manual.category
					] || categoryColors.other}"
				>
					{MANUAL_CATEGORY_LABELS[manual.category]}
				</Badge>
			</div>
		</div>

		<!-- Content -->
		<div class="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
			<!-- Header: Title + Actions -->
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1 space-y-1.5">
					<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
						<h3
							class="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground sm:line-clamp-1 sm:text-lg"
						>
							{manual.title}
						</h3>
						<span
							class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60"
						>
							#{manual.id}
						</span>
					</div>

					{#if manual.description}
						<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{manual.description}
						</p>
					{:else if manual.content}
						<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground/60 italic">
							{truncateText(manual.content)}
						</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex flex-shrink-0 items-center gap-1">
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

					<!-- Desktop: inline buttons -->
					<div class="hidden sm:flex sm:items-center sm:gap-0.5">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 cursor-pointer text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary"
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
										class="h-8 w-8 cursor-pointer text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
										onclick={() => (deleteDialogOpen = true)}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content><p>Διαγραφή</p></Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>

					<!-- Mobile: dropdown menu -->
					<div class="sm:hidden">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7 cursor-pointer text-muted-foreground"
								>
									<MoreVertical class="h-4 w-4" />
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-40">
								<DropdownMenu.Item onclick={() => (editDialogOpen = true)}>
									<Pencil class="mr-2 h-3.5 w-3.5" />
									Επεξεργασία
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									class="text-destructive focus:text-destructive"
									onclick={() => (deleteDialogOpen = true)}
								>
									<Trash2 class="mr-2 h-3.5 w-3.5" />
									Διαγραφή
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>
			</div>

			<!-- Meta footer -->
			<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
				<!-- Status badge -->
				{#if manual.published}
					<Badge
						variant="secondary"
						class="gap-1 rounded-md border-0 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:text-[11px] dark:text-emerald-400"
					>
						<Eye class="h-3 w-3" />
						<span class="hidden xs:inline">Δημοσιευμένο</span>
						<span class="xs:hidden">Live</span>
					</Badge>
				{:else}
					<Badge
						variant="secondary"
						class="gap-1 rounded-md border-0 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:text-[11px]"
					>
						<EyeOff class="h-3 w-3" />
						<span class="hidden xs:inline">Πρόχειρο</span>
						<span class="xs:hidden">Draft</span>
					</Badge>
				{/if}

				<!-- Category (desktop only) -->
				<Badge
					class="hidden rounded-md border-0 px-2 py-0.5 text-[11px] font-semibold ring-1 sm:inline-flex {categoryColors[
						manual.category
					] || categoryColors.other}"
				>
					{MANUAL_CATEGORY_LABELS[manual.category]}
				</Badge>

				<!-- Divider -->
				<div class="hidden h-3 w-px bg-border/60 sm:block"></div>

				<!-- Read count -->
				{#if manual.read_count !== undefined}
					<span
						class="flex items-center gap-1 text-[10px] text-muted-foreground/70 sm:text-[11px]"
					>
						<BookOpen class="h-3 w-3" />
						{manual.read_count} αναγνώσεις
					</span>
				{/if}

				<!-- Author -->
				{#if manual.profiles}
					<span
						class="hidden items-center gap-1 text-[11px] text-muted-foreground/70 xs:flex"
					>
						<User class="h-3 w-3" />
						{manual.profiles.username}
					</span>
				{/if}

				<!-- Date -->
				<span
					class="flex items-center gap-1 text-[10px] text-muted-foreground/70 sm:text-[11px]"
				>
					<Calendar class="h-3 w-3" />
					<span class="hidden sm:inline">{formatDate(manual.created_at)}</span>
					<span class="sm:hidden">{formatDateShort(manual.created_at)}</span>
				</span>
			</div>
		</div>
	</div>
</div>

<!-- Dialogs -->
<EditManualDialog bind:open={editDialogOpen} {manual} onSuccess={onUpdate} />
<DeleteManualDialog bind:open={deleteDialogOpen} {manual} onSuccess={onUpdate} />