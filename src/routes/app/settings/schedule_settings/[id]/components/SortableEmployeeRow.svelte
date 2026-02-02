<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import * as Avatar from '$lib/components/ui/avatar';
	import DroppableShiftCell from './DroppableShiftCell.svelte';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';

	interface Props {
		employee: Profile;
		shifts: Shift[];
		weekDays: { date: string; dayName: string; dayNum: number }[];
		index: number;
		onAddShift: (employeeId: string, date: string) => void;
		onEditShift: (shift: Shift) => void;
		onDeleteShift: (shiftId: number) => void;
	}

	let { employee, shifts, weekDays, index, onAddShift, onEditShift, onDeleteShift }: Props =
		$props();

	// 1. Pass 'index' to useSortable
	// We use 'handleRef' for the drag handle and 'ref' for the row
	const { ref, handleRef, isDragging } = useSortable({
		// svelte-ignore state_referenced_locally
		id: employee.id,
		// svelte-ignore state_referenced_locally
		index: index
	});

	// Helpers
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	function getShiftForEmployeeAndDate(employeeId: string, date: string): Shift | null {
		return shifts.find((s) => s.user_id === employeeId && s.shift_date === date) || null;
	}

	const badgeColor = $derived(employee.badge_color || '#3b82f6');
	const initials = $derived(getInitials(employee.username));
</script>

<div
	class="flex bg-white transition-colors duration-150 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
	{@attach ref}
	class:opacity-50={isDragging.current}
	class:z-50={isDragging.current}
	class:relative={isDragging.current}
>
	<div
		class="w-44 flex-shrink-0 cursor-grab touch-none border-r border-zinc-200 px-4 py-3 active:cursor-grabbing dark:border-zinc-800"
		style="border-left: 3px solid {badgeColor};"
		{@attach handleRef}
	>
		<div class="flex items-center gap-3">
			<Avatar.Root class="h-9 w-9 flex-shrink-0">
				<Avatar.Image class="dark:bg-white" src={employee.image_url} alt={employee.username} />
				<Avatar.Fallback
					class="text-xs font-semibold text-white"
					style="background-color: {badgeColor};"
				>
					{initials}
				</Avatar.Fallback>
			</Avatar.Root>

			<div class="min-w-0 flex-1 select-none">
				<p class="truncate text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">
					{employee.username}
				</p>
				<p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
					{employee.email.split('@')[0]}
				</p>
			</div>
		</div>
	</div>

	{#each weekDays as day (day.date)}
		{@const shift = getShiftForEmployeeAndDate(employee.id, day.date)}

		<div class="w-46 flex-shrink-0 border-r border-zinc-200 p-2.5 last:border-r-0 dark:border-zinc-800">
			<DroppableShiftCell
				{shift}
				{badgeColor}
				employeeId={employee.id}
				date={day.date}
				onAdd={() => onAddShift(employee.id, day.date)}
				onEdit={() => shift && onEditShift(shift)}
				onDelete={() => shift && onDeleteShift(shift.id)}
			/>
		</div>
	{/each}
</div>
