<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { Clock, Timer, Camera, GripVertical, ChevronRight } from 'lucide-svelte';
	import TaskDetailDrawer from './TaskDetailDrawer.svelte';

	// Props we receive - following YOUR example structure
	let { task, isOverlay = false, id, index, ...rest } = $props();

	// The magic hook that makes this draggable
	// svelte-ignore state_referenced_locally
	const { ref, isDragging } = useSortable({ id, index, ...rest });

	// Drawer state for mobile detail view
	let drawerOpen = $state(false);

	function handleCardTap(e: MouseEvent) {
		// Only open drawer if not clicking on drag handle
		const target = e.target as HTMLElement;
		if (target.closest('[data-drag-handle]')) return;

		// Open drawer on mobile only (we check via media query in CSS, but this works for tap)
		drawerOpen = true;
	}
</script>

<div class="relative w-full min-w-0 select-none" {@attach ref}>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class="w-full min-w-0" class:invisible={isDragging.current && !isOverlay}>
		<!-- Desktop: Full card -->
		<div class="glass-task-card hidden cursor-grab rounded-2xl p-4 active:cursor-grabbing sm:block">
			<div class="flex items-start gap-3">
				<!-- Drag handle -->
				<div class="mt-1 text-muted-foreground/60" data-drag-handle>
					<GripVertical class="h-5 w-5" />
				</div>

				<div class="flex-1 min-w-0">
					<!-- Task Title -->
					<h3 class="mb-1.5 flex items-center gap-2 font-semibold text-foreground/90">
						{#if task.completed}
							<span class="text-emerald-500">✓</span>
						{:else}
							<span class="text-muted-foreground/50">○</span>
						{/if}
						<span class="truncate">{task.task_items.title}</span>
					</h3>

					<!-- Task Description -->
					<p class="mb-3 text-sm leading-relaxed text-muted-foreground/70">
						{task.task_items.description}
					</p>

					<!-- Badges -->
					<div class="flex flex-wrap items-center gap-2">
						{#if task.task_items.scheduled_time}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/15"
							>
								<Clock class="h-3 w-3" />
								{task.task_items.scheduled_time.slice(0, 5)}
							</span>
						{/if}

						{#if task.task_items.estimated_minutes > 0}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2 dark:bg-chart-2/15"
							>
								<Timer class="h-3 w-3" />
								{task.task_items.estimated_minutes} min
							</span>
						{/if}

						{#if task.task_items.requires_photo}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
							>
								<Camera class="h-3 w-3" />
								Photo
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile: Compact card -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="glass-task-card block w-full cursor-grab overflow-hidden rounded-xl p-2 active:cursor-grabbing sm:hidden"
			onclick={handleCardTap}
		>
			<div class="flex min-w-0 items-center gap-1.5">
				<!-- Drag handle - smaller on mobile -->
				<div class="shrink-0 text-muted-foreground/50" data-drag-handle>
					<GripVertical class="h-3.5 w-3.5" />
				</div>

				<!-- Status indicator -->
				<div class="shrink-0">
					{#if task.completed}
						<span class="text-xs text-emerald-500">✓</span>
					{:else}
						<span class="text-xs text-muted-foreground/40">○</span>
					{/if}
				</div>

				<!-- Title - truncated -->
				<h3 class="min-w-0 flex-1 truncate text-xs font-medium text-foreground/90">
					{task.task_items.title}
				</h3>

				<!-- Quick badge - show time if available, otherwise duration -->
				{#if task.task_items.scheduled_time}
					<span
						class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary dark:bg-primary/15"
					>
						{task.task_items.scheduled_time.slice(0, 5)}
					</span>
				{:else if task.task_items.estimated_minutes > 0}
					<span
						class="shrink-0 rounded-full bg-chart-2/10 px-1.5 py-0.5 text-[9px] font-medium text-chart-2 dark:bg-chart-2/15"
					>
						{task.task_items.estimated_minutes}m
					</span>
				{/if}

				<!-- Photo indicator if required -->
				{#if task.task_items.requires_photo}
					<Camera class="h-3 w-3 shrink-0 text-sky-500/70" />
				{/if}

				<!-- Chevron to indicate tappable -->
				<ChevronRight class="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
			</div>
		</div>
	</div>

	<!-- Drag placeholder - shows in original position while dragging -->
	{#if !isOverlay && isDragging.current}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 sm:rounded-2xl"
			>
				<span class="text-xs font-medium text-primary/70 sm:text-sm">Moving...</span>
			</div>
		</div>
	{/if}
</div>

<!-- Mobile detail drawer -->
<TaskDetailDrawer bind:open={drawerOpen} {task} />

<style>
	.glass-task-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		transition: all 0.2s ease;
	}

	.glass-task-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(212, 165, 116, 0.2);
	}

	/* Light mode adjustments */
	:global(.light) .glass-task-card,
	:global(:root:not(.dark)) .glass-task-card {
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.light) .glass-task-card:hover,
	:global(:root:not(.dark)) .glass-task-card:hover {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(212, 165, 116, 0.25);
	}
</style>
