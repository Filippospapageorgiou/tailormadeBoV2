<script lang="ts">
	import TaskCard from './TaskCard.svelte';
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import Droppable from '$lib/droppable.svelte';
	import { CollisionPriority } from '@dnd-kit/abstract';
	import { sensors } from '$lib';
	import { updateTaskForUser } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import PhotoModal from './PhotoModal.svelte';
	import { Circle, CheckCircle2 } from 'lucide-svelte';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		tasks,
		frequency = 'daily' as Frequency,
		onUpdate
	}: {
		tasks: any[];
		frequency?: Frequency;
		onUpdate: () => void;
	} = $props();

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

		const task = tasks.find((t: any) => t.id === source.id);

		if (isCompleted && task?.task_items?.requires_photo && !task.photo_url) {
			pendingTask = task;
			photoModalOpen = true;
			return;
		}

		await handleUpdateTask(source.id, isCompleted);
	}

	async function handlePhotoSuccess() {
		photoModalOpen = false;
		pendingTask = null;
		await onUpdate();
	}

	function handlePhotoCancel() {
		photoModalOpen = false;
		pendingTask = null;
		onUpdate();
	}

	async function handleUpdateTask(id: string, completed: boolean) {
		if (!id) return;
		const nowInGreece = new Date()
			.toLocaleString('sv-SE', { timeZone: 'Europe/Athens' })
			.replace(' ', 'T');
		const result = await updateTaskForUser({
			id,
			completed,
			completed_at: nowInGreece,
			frequency
		});
		if (result.success) {
			await onUpdate();
		} else {
			toast.error(result.message);
		}
	}

	const accentColors: Record<Frequency, { dot: string; border: string }> = {
		daily: { dot: 'bg-emerald-500', border: 'border-emerald-500/15' },
		weekly: { dot: 'bg-blue-500', border: 'border-blue-500/15' },
		monthly: { dot: 'bg-amber-500', border: 'border-amber-500/15' }
	};
</script>

<DragDropProvider
	{sensors}
	onDragOver={(event) => {
		groupedTasks = move(groupedTasks, event);
	}}
	onDragEnd={handleDragEnd}
>
	<div class="grid grid-cols-2 gap-3 sm:gap-4">
		<!-- In Progress Column -->
		<Droppable
			class="task-column group/col min-w-0 rounded-2xl border border-border/40 bg-card/50 p-2.5 pt-0 backdrop-blur-sm sm:rounded-2xl sm:p-3.5 sm:pt-0"
			id="in-progress"
			type="column"
			accept="item"
			collisionPriority={CollisionPriority.Low}
		>
			<div class="sticky top-0 z-10 flex items-center gap-2 bg-card/50 py-3 backdrop-blur-sm">
				<Circle class="h-3.5 w-3.5 text-muted-foreground/50" />
				<span class="text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
					Σε εξέλιξη
				</span>
				{#if groupedTasks['in-progress'].length > 0}
					<span class="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground/40">
						{groupedTasks['in-progress'].length}
					</span>
				{/if}
			</div>

			<div class="grid min-w-0 gap-2">
				{#each groupedTasks['in-progress'] as task, index (task.id)}
					<TaskCard
						{task}
						{frequency}
						id={task.id}
						index={() => index}
						group="in-progress"
						data={{ group: 'in-progress' }}
						type="item"
					/>
				{/each}
			</div>

			<!-- Drop hint when empty -->
			{#if groupedTasks['in-progress'].length === 0}
				<div class="flex items-center justify-center rounded-xl border border-dashed border-border/40 py-8">
					<p class="text-[10px] text-muted-foreground/40">Σύρε εδώ</p>
				</div>
			{/if}
		</Droppable>

		<!-- Done Column -->
		<Droppable
			class="task-column group/col min-w-0 rounded-2xl border border-border/40 bg-emerald-500/[0.02] p-2.5 pt-0 dark:bg-emerald-500/[0.03] sm:rounded-2xl sm:p-3.5 sm:pt-0"
			id="done"
			type="column"
			accept="item"
			collisionPriority={CollisionPriority.Low}
		>
			<div class="sticky top-0 z-10 flex items-center gap-2 py-3 backdrop-blur-sm">
				<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500/60" />
				<span class="text-xs font-semibold tracking-wide text-emerald-600/60 uppercase dark:text-emerald-400/50">
					Ολοκληρωμένα
				</span>
				{#if groupedTasks['done'].length > 0}
					<span class="ml-auto text-[10px] font-bold tabular-nums text-emerald-500/40">
						{groupedTasks['done'].length}
					</span>
				{/if}
			</div>

			<div class="grid min-w-0 gap-2">
				{#each groupedTasks['done'] as task, index (task.id)}
					<TaskCard
						{task}
						{frequency}
						id={task.id}
						index={() => index}
						group="done"
						data={{ group: 'done' }}
						type="item"
					/>
				{/each}
			</div>

			{#if groupedTasks['done'].length === 0}
				<div class="flex items-center justify-center rounded-xl border border-dashed border-emerald-500/15 py-8">
					<p class="text-[10px] text-emerald-500/30">Σύρε εδώ</p>
				</div>
			{/if}
		</Droppable>
	</div>

	<DragOverlay>
		{#snippet children(source)}
			{@const group = source.data.group as keyof typeof groupedTasks}
			{@const draggedTask = groupedTasks[group].find((t: any) => t.id === source.id)}

			{#if draggedTask}
				<div class="max-w-2xl">
					<TaskCard task={draggedTask} {frequency} id={draggedTask.id} index={0} isOverlay />
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
	{frequency}
	onSuccess={handlePhotoSuccess}
	onCancel={handlePhotoCancel}
/>
