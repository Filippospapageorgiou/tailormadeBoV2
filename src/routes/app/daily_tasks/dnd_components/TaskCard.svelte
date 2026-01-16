<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';

	// Props we receive - following YOUR example structure
	let { task, isOverlay = false, id, index, ...rest } = $props();

	// The magic hook that makes this draggable
	// svelte-ignore state_referenced_locally
	const { ref, isDragging } = useSortable({ id, index, ...rest });
</script>

<div
	class="relative select-none"
	{@attach ref}
>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class:invisible={isDragging.current && !isOverlay}>
		<div class="glass-task-card cursor-grab rounded-2xl p-5 active:cursor-grabbing">
			<!-- Drag handle -->
			<div class="flex items-start gap-3">
				<div class="mt-1 text-muted-foreground">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 8h16M4 16h16"
						/>
					</svg>
				</div>

				<div class="flex-1">
					<!-- Task Title -->
					<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
						{#if task.completed}
							<span class="text-green-500">✓</span>
						{:else}
							<span class="text-muted-foreground">○</span>
						{/if}
						{task.task_items.title}
					</h3>

					<!-- Task Description -->
					<p class="mb-3 text-sm text-muted-foreground">
						{task.task_items.description}
					</p>

					<!-- Badges -->
					<div class="flex flex-wrap items-center gap-2">
						{#if task.task_items.scheduled_time}
							<span class="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
								⏰ {task.task_items.scheduled_time.slice(0, 5)}
							</span>
						{/if}

						{#if task.task_items.estimated_minutes > 0}
							<span class="rounded-full bg-chart-2/20 px-3 py-1 text-xs font-medium text-chart-2">
								⏱️ {task.task_items.estimated_minutes} min
							</span>
						{/if}

						{#if task.task_items.requires_photo}
							<span class="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-600">
								📷 Photo
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Drag placeholder - shows in original position while dragging -->
	{#if !isOverlay && isDragging.current}
		<div class="absolute inset-0 flex items-center justify-center">
			<div
				class="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/10"
			>
				<span class="font-semibold text-primary">Moving: {task.task_items.title}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.glass-task-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.glass-task-card:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(212, 165, 116, 0.3);
	}
</style>
