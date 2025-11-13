<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import type { Profile } from '$lib/models/database.types';
	import ShiftCell from './ShiftCell.svelte';
	import ScheduleEmployee from './ScheduleEmployee.svelte';

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

	function getEmployee(userId: string): Profile | undefined {
		return employees.find((e) => e.id === userId);
	}

	function getEmployeeShiftsForDay(employeeId: string, date: string): Shift[] {
		return shifts.filter((s) => s.user_id === employeeId && s.shift_date === date);
	}
</script>

<div class="overflow-x-auto">
	<div class="inline-block min-w-full">
		<!-- Header Row -->
		<div class="flex">
			<!-- Employee Column Header -->
			<div class="w-48 flex-shrink-0 border-r border-border/50 px-4 py-4">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</p>
			</div>

			<!-- Day Column Headers -->
			<div class="flex flex-1">
				{#each weekDays as day (day.date)}
					<div class="flex-1 border-r border-border/50 px-4 py-4 text-center last:border-r-0">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{day.dayName}
						</p>
						<p class="text-lg font-bold">{day.dayNum}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Employee Rows -->
		{#each employees as employee (employee.id)}
			{@const isSelected = employee.id === selectedEmployeeId}
			{@const badgeColor = employee.badge_color || '#3b82f6'}

			<div class="flex border-t border-border/30">
				<!-- Employee Cell -->
				<div class="w-48 flex-shrink-0">
					<ScheduleEmployee
						{employee}
						isSelected={isSelected}
						onClick={() => onEmployeeSelect(employee)}
					/>
				</div>

				<!-- Day Cells with Shifts -->
				<div class="flex flex-1">
					{#each weekDays as day (day.date)}
						{@const dayShifts = getEmployeeShiftsForDay(employee.id, day.date)}

						<div class="flex-1 border-r border-border/30 p-3 last:border-r-0">
							<div class="flex flex-col gap-2">
								{#if dayShifts.length === 0}
									<div
										class="h-12 rounded-lg border border-dashed border-border/30"
										aria-label="No shift"
									></div>
								{:else}
									{#each dayShifts as shift (shift.id)}
										<ShiftCell {shift} {badgeColor} onClick={() => onShiftClick(shift.id)} />
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>