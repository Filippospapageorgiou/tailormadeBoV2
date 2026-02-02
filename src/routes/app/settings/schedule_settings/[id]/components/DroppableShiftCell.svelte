<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { useDroppable } from '@dnd-kit-svelte/svelte';
	import { Plus } from 'lucide-svelte';
	import DraggableShift from './DraggableShift.svelte';

	interface Props {
		shift: Shift | null;
		badgeColor: string;
		employeeId: string;
		date: string;
		onAdd: () => void;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { shift, badgeColor, employeeId, date, onAdd, onEdit, onDelete }: Props = $props();

	const { ref, isDropTarget } = useDroppable({
		// svelte-ignore state_referenced_locally
		id: `cell-${employeeId}-${date}`,
		// svelte-ignore state_referenced_locally
		data: { employeeId, date },
		accept: 'shift'
	});
</script>

<div
	class="relative h-full min-h-[48px] transition-all duration-150"
	class:ring-2={isDropTarget.current}
	class:ring-blue-500={isDropTarget.current}
	class:ring-offset-2={isDropTarget.current}
	class:bg-blue-50={isDropTarget.current}
	class:dark:bg-blue-950={isDropTarget.current}
	class:rounded-lg={isDropTarget.current}
	{@attach ref}
>
	{#if shift}
		<DraggableShift
			{shift}
			{badgeColor}
			{onEdit}
			{onDelete}
		/>
	{:else}
		<!-- No shift - Show add button -->
		<button
			type="button"
			onclick={onAdd}
			class="group flex h-full min-h-[48px] w-full items-center justify-center rounded-lg border border-dashed
				border-zinc-200 bg-zinc-50/50
				dark:border-zinc-700 dark:bg-zinc-800/50
				transition-all duration-150
				hover:border-zinc-300 hover:bg-zinc-100
				dark:hover:border-zinc-600 dark:hover:bg-zinc-800
				{isDropTarget.current ? 'border-blue-400 bg-blue-100 dark:border-blue-600 dark:bg-blue-900' : ''}"
			aria-label="Add shift"
		>
			<Plus class="h-4 w-4 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
		</button>
	{/if}
</div>
