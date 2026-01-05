<script lang="ts">
	import TaskCard from './TaskCard.svelte';
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import Droppable from '$lib/droppable.svelte';
	import { CollisionPriority } from '@dnd-kit/abstract';
	import { sensors } from '$lib';
	import { updateDayliTaskForUser } from '../data.remote';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { toast } from 'svelte-sonner';

	let { tasks, onUpdate } = $props();

	// Organize tasks into the format move() expects [cite: 1, 4]
	let groupedTasks = $derived({
		'in-progress': tasks.filter((t: any) => !t.completed),
		done: tasks.filter((t: any) => t.completed)
	});

	async function handleDragEnd(event: any) {
        const { source, target } = event.operation; 
        if (!target) return;
        const targetGroup = target.data.group || target.id;    
        const isCompleted = targetGroup === 'done';
        await handleUpdateDayliTask(source.id,isCompleted);
        
    }

	async function handleUpdateDayliTask(id: string, completed: boolean) {
		if (!id) return;
		const nowInGreece =  new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Athens' }).replace(' ', 'T');
		const result = await updateDayliTaskForUser({
			id: id,
			completed: completed,
			completed_at: nowInGreece
		});
		if (result.success) {
			await onUpdate();
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
	}
</script>

<DragDropProvider
	{sensors}
	onDragOver={(event) => {
		// move() updates the keyed object structure [cite: 1, 4]
		groupedTasks = move(groupedTasks, event);
	}}
	onDragEnd={handleDragEnd}
>
	<div class="grid gap-4 font-game md:grid-cols-2">
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

{#snippet taskList(id: string, title: string, columnTasks: any[])}
	<Droppable
		class="bg-#F9F9F9 rd-3xl p-3 pt-6"
		{id}
		type="column"
		accept="item"
		collisionPriority={CollisionPriority.Low}
	>
		<p class="fw-bold pb-3 text-lg">{title}</p>

		<div class="grid gap-2">
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
