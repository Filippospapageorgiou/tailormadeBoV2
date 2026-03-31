<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { Clock, Timer, Camera, GripVertical, ChevronRight, CheckCircle2 } from 'lucide-svelte';
	import TaskDetailDrawer from './TaskDetailDrawer.svelte';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		task,
		frequency = 'daily',
		isOverlay = false,
		id,
		index,
		...rest
	}: {
		task: any;
		frequency?: Frequency;
		isOverlay?: boolean;
		id: string;
		index: any;
		[key: string]: any;
	} = $props();

	// svelte-ignore state_referenced_locally
	const { ref, isDragging } = useSortable({ id, index, ...rest });

	let drawerOpen = $state(false);

	function handleCardTap(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('[data-drag-handle]')) return;
		drawerOpen = true;
	}

	const accentBorder: Record<Frequency, string> = {
		daily: 'border-l-emerald-400 dark:border-l-emerald-600',
		weekly: 'border-l-blue-400 dark:border-l-blue-600',
		monthly: 'border-l-amber-400 dark:border-l-amber-600'
	};
</script>

<div class="task-card-wrapper relative w-full min-w-0 select-none" {@attach ref}>
	<div class="w-full min-w-0" class:invisible={isDragging.current && !isOverlay}>
		<!-- ═══ Desktop Card ═══ -->
		<div
			class="task-card group hidden cursor-grab rounded-xl border border-l-[3px] transition-all duration-200 active:cursor-grabbing sm:block
				{task.completed
				? 'border-emerald-200/40 bg-emerald-50/30 dark:border-emerald-500/10 dark:bg-emerald-500/[0.04] ' +
					accentBorder[frequency]
				: 'border-border/50 bg-card hover:border-border/80 hover:shadow-sm ' +
					accentBorder[frequency]}"
		>
			<div class="flex items-start gap-2.5 p-3">
				<!-- Drag handle: subtle, appears on hover -->
				<div
					class="mt-1 shrink-0 cursor-grab opacity-0 transition-opacity duration-200 group-hover:opacity-100 active:cursor-grabbing"
					data-drag-handle
				>
					<GripVertical class="h-3.5 w-3.5 text-muted-foreground/30" />
				</div>

				<!-- Content -->
				<div class="min-w-0 flex-1">
					<!-- Title row -->
					<div class="flex items-start gap-2">
						{#if task.completed}
							<CheckCircle2 class="task-check-icon mt-px h-4 w-4 shrink-0 text-emerald-500" />
						{/if}
						<h3
							class="text-[13px] leading-snug font-semibold transition-all duration-300
								{task.completed
								? 'text-muted-foreground/50 line-through decoration-muted-foreground/20'
								: 'text-foreground'}"
						>
							{task.task_items.title}
						</h3>
					</div>

					<!-- Description (only when not completed) -->
					{#if task.task_items.description && !task.completed}
						<p class="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/60">
							{task.task_items.description}
						</p>
					{/if}

					<!-- Metadata chips -->
					<div class="mt-2 flex flex-wrap items-center gap-1.5">
						{#if task.task_items.scheduled_time}
							<span
								class="inline-flex items-center gap-1 rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary/12"
							>
								<Clock class="h-2.5 w-2.5" />
								{task.task_items.scheduled_time.slice(0, 5)}
							</span>
						{/if}

						{#if task.task_items.estimated_minutes > 0}
							<span
								class="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
							>
								<Timer class="h-2.5 w-2.5" />
								{task.task_items.estimated_minutes}′
							</span>
						{/if}

						{#if task.task_items.requires_photo}
							<span
								class="inline-flex items-center gap-1 rounded-md bg-sky-500/8 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:bg-sky-500/12 dark:text-sky-400"
							>
								<Camera class="h-2.5 w-2.5" />
								Φωτο
							</span>
						{/if}

						{#if task.photo_url}
							<img
								src={task.photo_url}
								alt="Evidence"
								class="h-5 w-5 rounded border border-border/40 object-cover shadow-sm"
							/>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- ═══ Mobile Card ═══ -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="task-card-mobile block w-full cursor-grab overflow-hidden rounded-xl border border-l-[3px] transition-all duration-200 active:scale-[0.98] active:cursor-grabbing sm:hidden
				{task.completed
				? 'border-emerald-200/30 bg-emerald-50/20 dark:border-emerald-500/10 dark:bg-emerald-500/[0.03] ' +
					accentBorder[frequency]
				: 'border-border/40 bg-card ' + accentBorder[frequency]}"
			onclick={handleCardTap}
		>
			<div class="flex min-w-0 items-center gap-2 p-2.5">
				<!-- Drag handle (always visible on mobile for touch) -->
				<div class="shrink-0 touch-none" data-drag-handle>
					<GripVertical class="h-3.5 w-3.5 text-muted-foreground/25" />
				</div>

				<!-- Status indicator -->
				{#if task.completed}
					<CheckCircle2 class="h-3.5 w-3.5 shrink-0 text-emerald-500" />
				{/if}

				<!-- Title -->
				<div class="flex flex-col gap-2 p-2.5">
					<h3
						class="min-w-0 flex-1 text-xs font-medium transition-all duration-300
						{task.completed
							? 'text-muted-foreground/40 line-through decoration-muted-foreground/15'
							: 'text-foreground'}"
					>
						{task.task_items.title}
					</h3>

					<!-- Right side info -->
					<div class="flex shrink-0 items-center gap-1.5">
						{#if task.task_items.scheduled_time}
							<span
								class="rounded-md bg-primary/6 px-1.5 py-0.5 text-[9px] font-semibold text-primary tabular-nums dark:bg-primary/10"
							>
								{task.task_items.scheduled_time.slice(0, 5)}
							</span>
						{/if}

						{#if task.task_items.estimated_minutes > 0 && !task.task_items.scheduled_time}
							<span
								class="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground tabular-nums"
							>
								{task.task_items.estimated_minutes}′
							</span>
						{/if}

						{#if task.task_items.requires_photo}
							<Camera class="h-3 w-3 text-sky-500/50" />
						{/if}

						{#if task.photo_url}
							<img
								src={task.photo_url}
								alt=""
								class="h-5 w-5 rounded border border-border/30 object-cover"
							/>
						{/if}

						<ChevronRight class="h-3 w-3 text-muted-foreground/20" />
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Drag placeholder -->
	{#if !isOverlay && isDragging.current}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.03]"
			>
				<span class="text-[10px] font-medium text-primary/40">Μετακίνηση...</span>
			</div>
		</div>
	{/if}
</div>

<!-- Mobile detail drawer -->
<TaskDetailDrawer bind:open={drawerOpen} {task} {frequency} />

<style>
	/* Check icon entrance */
	:global(.task-check-icon) {
		animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes check-pop {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Mobile touch targets */
	.task-card-mobile {
		-webkit-tap-highlight-color: transparent;
		min-height: 44px;
	}
</style>
