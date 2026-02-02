<script lang="ts">
	import TaskCard from './TaskCard.svelte';
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import Droppable from '$lib/droppable.svelte';
	import { CollisionPriority } from '@dnd-kit/abstract';
	import { sensors } from '$lib';
	import { updateDayliTaskForUser } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import PhotoModal from './PhotoModal.svelte';

	let { tasks, onUpdate } = $props();

	// Organize tasks into the format move() expects
	let groupedTasks = $derived({
		'in-progress': tasks.filter((t: any) => !t.completed),
		done: tasks.filter((t: any) => t.completed)
	});

	// Photo modal state
	let photoModalOpen = $state(false);
	let pendingTask = $state<any>(null);

	async function handleDragEnd(event: any) {
		const { source, target } = event.operation;
		if (!target) return;

		const targetGroup = target.data.group || target.id;
		const isCompleted = targetGroup === 'done';

		// Find the task being moved
		const task = tasks.find((t: any) => t.id === source.id);

		// If moving to "done" and task requires photo and doesn't have one yet
		if (isCompleted && task?.task_items?.requires_photo && !task.photo_url) {
			// Store the task for the modal
			pendingTask = task;
			photoModalOpen = true;
			return;
		}

		// Normal flow - no photo required
		await handleUpdateDayliTask(source.id, isCompleted);
	}

	async function handlePhotoSuccess() {
		photoModalOpen = false;
		pendingTask = null;
		await onUpdate();
	}

	function handlePhotoCancel() {
		photoModalOpen = false;
		pendingTask = null;
		// Refresh to reset the visual state
		onUpdate();
	}

	async function handleUpdateDayliTask(id: string, completed: boolean) {
		if (!id) return;
		const nowInGreece = new Date()
			.toLocaleString('sv-SE', { timeZone: 'Europe/Athens' })
			.replace(' ', 'T');
		const result = await updateDayliTaskForUser({
			id: id,
			completed: completed,
			completed_at: nowInGreece
		});
		if (result.success) {
			await onUpdate();
		} else {
			toast.error(result.message);
		}
	}
</script>

<DragDropProvider
	{sensors}
	onDragOver={(event) => {
		groupedTasks = move(groupedTasks, event);
	}}
	onDragEnd={handleDragEnd}
>
	<div
		class="grid animate-fade-in-down grid-cols-2 gap-2 font-game sm:gap-4"
		style="animation-delay: {400}ms;"
	>
		{@render taskList('in-progress', 'In Progress', groupedTasks['in-progress'])}
		{@render taskList('done', 'Done', groupedTasks['done'])}
	</div>

	<DragOverlay>
		{#snippet children(source)}
			{@const group = source.data.group as keyof typeof groupedTasks}
			{@const draggedTask = groupedTasks[group].find((t: any) => t.id === source.id)}

			{#if draggedTask}
				<div class="max-w-2xl">
					<TaskCard task={draggedTask} id={draggedTask.id} index={0} isOverlay />
				</div>
			{/if}
		{/snippet}
	</DragOverlay>
</DragDropProvider>

<!-- Photo Capture Modal -->
<PhotoModal
	bind:open={photoModalOpen}
	taskId={pendingTask?.id ?? ''}
	taskTitle={pendingTask?.task_items?.title ?? ''}
	onSuccess={handlePhotoSuccess}
	onCancel={handlePhotoCancel}
/>

{#snippet taskList(id: string, title: string, columnTasks: any[])}
	<Droppable
		class="task-column min-w-0 overflow-hidden rounded-2xl p-2 pt-4 sm:rounded-3xl sm:p-3 sm:pt-6"
		{id}
		type="column"
		accept="item"
		collisionPriority={CollisionPriority.Low}
	>
		<p class="pb-2 text-xs font-semibold text-foreground/80 sm:pb-3 sm:text-lg">{title}</p>

		<div class="grid min-w-0 gap-1.5 sm:gap-2">
			{#each columnTasks as task, index (task.id)}
				<TaskCard
					{task}
					id={task.id}
					index={() => index}
					group={id}
					data={{ group: id }}
					type="item"
				/>
			{/each}
		</div>
	</Droppable>
{/snippet}

<style>
	.font-game {
		font-family: 'Orbitron', 'Sansation', sans-serif;
	}
</style>