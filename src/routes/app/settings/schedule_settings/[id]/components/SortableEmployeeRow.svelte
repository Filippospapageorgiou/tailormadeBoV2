<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import * as Avatar from '$lib/components/ui/avatar';
	import ScheduleDayCell from './ScheduleDayCell.svelte';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';

	interface Props {
		employee: Profile;
		shifts: Shift[];
		weekDays: { date: string; dayName: string; dayNum: number }[];
		// Added index prop (Required by dnd-kit)
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
		id: employee.id,
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
	class="flex border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent transition-colors hover:bg-white/[0.03]"
	{@attach ref}
	class:opacity-50={isDragging.current}
	class:z-50={isDragging.current}
	class:relative={isDragging.current}
>
	<div
		class="w-56 flex-shrink-0 cursor-grab touch-none border-r border-white/10 px-6 py-4 active:cursor-grabbing"
		style="border-left: 3px solid {badgeColor}40; border-left-color: {badgeColor};"
		{@attach handleRef}
	>
		<div class="flex items-center gap-3">
			<div class="relative">
				<Avatar.Root
					class="h-10 w-10 flex-shrink-0 ring-2 ring-offset-2"
					style="--tw-ring-color: {badgeColor}20;"
				>
					<Avatar.Image src={employee.image_url} alt={employee.username} />
					<Avatar.Fallback
						class="text-xs font-bold text-white"
						style="background-color: {badgeColor};"
					>
						{initials}
					</Avatar.Fallback>
				</Avatar.Root>
			</div>

			<div class="min-w-0 flex-1 select-none">
				<p class="truncate text-sm leading-tight font-semibold text-white">
					{employee.username}
				</p>
				<p class="truncate text-xs text-muted-foreground">
					{employee.email.split('@')[0]}
				</p>
			</div>
		</div>
	</div>

	{#each weekDays as day (day.date)}
		{@const shift = getShiftForEmployeeAndDate(employee.id, day.date)}

		<div class="w-40 flex-shrink-0 border-r border-white/10 p-3 last:border-r-0">
			<ScheduleDayCell
				{shift}
				{badgeColor}
				onAdd={() => onAddShift(employee.id, day.date)}
				onEdit={() => shift && onEditShift(shift)}
				onDelete={() => shift && onDeleteShift(shift.id)}
			/>
		</div>
	{/each}
</div>
