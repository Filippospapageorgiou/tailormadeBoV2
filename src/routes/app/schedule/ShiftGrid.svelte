<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import type { Profile } from '$lib/models/database.types';
	import ShiftCell from './ShiftCell.svelte';
	import ScheduleEmployee from './ScheduleEmployee.svelte';
	import { Clock, Search } from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';

	interface Day {
		date: string;
		dayName: string;
		fullDayName: string;
		dayNum: number;
		shifts: Shift[];
	}

	interface Props {
		weekDays: Day[];
		employees: Profile[];
		shifts: Shift[];
		selectedEmployeeId: string | null;
		onEmployeeSelect: (employee: Profile) => void;
		onShiftClick: (shiftId: number) => void;
	}

	const { weekDays, employees, shifts, selectedEmployeeId, onEmployeeSelect, onShiftClick }: Props =
		$props();

	function getEmployeeShiftsForDay(employeeId: string, date: string): Shift[] {
		return shifts.filter((s) => s.user_id === employeeId && s.shift_date === date);
	}

	const months = [
		'Ιαν',
		'Φεβ',
		'Μαρ',
		'Απρ',
		'Μαΐ',
		'Ιουν',
		'Ιουλ',
		'Αυγ',
		'Σεπ',
		'Οκτ',
		'Νοε',
		'Δεκ'
	];
</script>

<div class="w-full px-4">
	<div class="overflow-hidden">
		<div class="overflow-x-auto">
			<div class="min-w-[1200px]">
				<div
					class="grid grid-cols-8 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-lg"
				>
					<div class="sticky left-0 z-10 p-4">
						<p class="text-sm font-semibold text-muted-foreground uppercase">Employee</p>
					</div>

					{#each weekDays as day}
						<div class="flex-1 p-4 py-4 text-center">
							<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
								{day.dayName}
							</p>
							<p class="text-lg font-semibold text-foreground">
								{day.dayNum}
								<span class="text-xs text-muted-foreground">
									{months[parseInt(day.date.split('-')[1], 10) - 1]}
								</span>
							</p>
						</div>
					{/each}
				</div>

				{#each employees as employee (employee.id)}
					{@const isSelected = employee.id === selectedEmployeeId}
					{@const badgeColor = employee.badge_color || '#3b82f6'}
					<div class="grid grid-cols-8 transition-colors hover:bg-accent/50">
						<div class="sticky left-0 z-10 flex items-center gap-3 bg-background p-4">
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<div class="h-2 w-2 rounded-full {badgeColor}" />
							<div class="h-10 w-10 overflow-hidden rounded-full bg-muted">
								<img
									src={employee.image_url}
									alt={employee.username}
									class="h-full w-full bg-white object-cover dark:bg-white"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-foreground">
									{employee.username}
								</p>
								<p class="truncate text-xs text-muted-foreground">
									{employee.username}
								</p>
								<span
									class="mt-1 inline-block rounded-md bg-secondary px-1.5 py-0 text-[10px] text-secondary-foreground"
								>
									{employee.role}
								</span>
							</div>
						</div>

						{#each weekDays as day (day.date)}
							{@const dayShifts = getEmployeeShiftsForDay(employee.id, day.date)}
							<div class="flex-1 p-3">
								<div class="flex flex-col gap-2">
									{#if dayShifts.length === 0}
										<div class="h-12 rounded-lg" aria-label="No shift"></div>
									{:else}
										{#each dayShifts as shift (shift.id)}
											<ShiftCell {shift} {badgeColor} onClick={() => onShiftClick(shift.id)} />
										{/each}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
