<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import type { Shift, WeeklySchedule } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Plus, UserPlus, X } from 'lucide-svelte';
	import ScheduleDayCell from './ScheduleDayCell.svelte';

	interface Props {
		schedule: WeeklySchedule;
		employees: Profile[];
		shifts: Shift[];
		allEmployees: Profile[];
		onAddShift: (employeeId: string, date: string) => void;
		onEditShift: (shift: Shift) => void;
		onDeleteShift: (shiftId: number) => void;
	}

	let { schedule, employees, shifts, allEmployees, onAddShift, onEditShift, onDeleteShift }: Props =
		$props();

	// Fixed widths
	const EMPLOYEE_COL_WIDTH = 'w-56'; // Fixed width for employee column
	const DAY_COL_WIDTH = 'w-40'; // Fixed width for each day column

	// Generate week days from schedule
	let weekDays = $derived.by(() => {
		if (!schedule) return [];

		const startDate = new Date(schedule.week_start_date);
		const greekDayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

		const days = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const dateStr = date.toISOString().split('T')[0];
			const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday = 0
			const dayName = greekDayNames[dayOfWeek];
			const dayNum = date.getDate();

			days.push({
				date: dateStr,
				dayName,
				dayNum
			});
		}

		return days;
	});

	// Get shifts for specific employee and date
	function getShiftForEmployeeAndDate(employeeId: string, date: string): Shift | null {
		return shifts.find((s) => s.user_id === employeeId && s.shift_date === date) || null;
	}

	// Get employees not yet in the grid
	let availableEmployees = $derived(
		allEmployees.filter((emp) => !employees.find((e) => e.id === emp.id))
	);

	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	// Track which employee to add (for showing in the add row)
	let selectedEmployeeToAdd = $state<string | null>(null);

	function handleSelectEmployee(employeeId: string) {
		selectedEmployeeToAdd = employeeId;
	}

	function handleRemoveSelectedEmployee() {
		selectedEmployeeToAdd = null;
	}

	// Get selected employee details
	let selectedEmployee = $derived(
		selectedEmployeeToAdd ? allEmployees.find((e) => e.id === selectedEmployeeToAdd) : null
	);
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-xl font-semibold">Weekly Schedule Grid</h2>
			<p class="text-sm text-muted-foreground">
				{employees.length} employee{employees.length !== 1 ? 's' : ''} assigned
			</p>
		</div>
	</div>

	<!-- Schedule Grid -->
	<div class="overflow-x-auto rounded-lg border">
		<div class="inline-block min-w-full">
			<!-- Header Row - Days -->
			<div class="flex border-b bg-muted/30">
				<!-- Employee Column Header -->
				<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r px-4 py-3">
					<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
						Employee
					</p>
				</div>

				<!-- Day Headers -->
				{#each weekDays as day (day.date)}
					<div class="{DAY_COL_WIDTH} flex-shrink-0 border-r px-4 py-3 text-center last:border-r-0">
						<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							{day.dayName}
						</p>
						<p class="text-lg font-bold">{day.dayNum}</p>
					</div>
				{/each}
			</div>

			<!-- Employee Rows -->
			{#each employees as employee (employee.id)}
				{@const badgeColor = employee.badge_color || '#3b82f6'}
				{@const initials = getInitials(employee.username)}

				<div class="flex border-b hover:bg-muted/20">
					<!-- Employee Cell -->
					<div
						class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r px-4 py-3"
						style="border-left: 4px solid {badgeColor};"
					>
						<div class="flex items-center gap-3">
							<Avatar.Root class="h-10 w-10 flex-shrink-0" style="border: 2px solid {badgeColor};">
								<Avatar.Image src={employee.image_url} alt={employee.username} />
								<Avatar.Fallback
									class="text-xs font-bold text-white"
									style="background-color: {badgeColor};"
								>
									{initials}
								</Avatar.Fallback>
							</Avatar.Root>

							<div class="min-w-0 flex-1">
								<p class="truncate text-sm leading-tight font-semibold">
									{employee.username}
								</p>
								<p class="truncate text-xs text-muted-foreground">
									{employee.email.split('@')[0]}
								</p>
							</div>
						</div>
					</div>

					<!-- Day Cells -->
					{#each weekDays as day (day.date)}
						{@const shift = getShiftForEmployeeAndDate(employee.id, day.date)}

						<div class="{DAY_COL_WIDTH} flex-shrink-0 border-r p-3 last:border-r-0">
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
			{/each}

			<!-- Add Employee Row - Always visible -->
			<div class="flex border-b bg-muted/10 last:border-b-0">
				<!-- Add Employee Cell with Dropdown OR Selected Employee -->
				<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r px-4 py-3">
					{#if selectedEmployee}
						<!-- Show selected employee with remove button -->
						{@const badgeColor = selectedEmployee.badge_color || '#3b82f6'}
						{@const initials = getInitials(selectedEmployee.username)}

						<div
							class="flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 p-2"
							style="border-left: 4px solid {badgeColor};"
						>
							<Avatar.Root class="h-8 w-8 flex-shrink-0" style="border: 2px solid {badgeColor};">
								<Avatar.Image src={selectedEmployee.image_url} alt={selectedEmployee.username} />
								<Avatar.Fallback
									class="text-xs font-bold text-white"
									style="background-color: {badgeColor};"
								>
									{initials}
								</Avatar.Fallback>
							</Avatar.Root>

							<div class="min-w-0 flex-1">
								<p class="truncate text-xs leading-tight font-semibold">
									{selectedEmployee.username}
								</p>
								<p class="truncate text-xs text-muted-foreground">
									{selectedEmployee.email.split('@')[0]}
								</p>
							</div>

							<Button
								variant="ghost"
								size="icon"
								onclick={handleRemoveSelectedEmployee}
								class="h-6 w-6 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					{:else if availableEmployees.length > 0}
						<!-- Show dropdown to select employee -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="w-full">
								<button
									type="button"
									class="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 transition-all hover:border-primary/50 hover:bg-primary/5"
								>
									<UserPlus class="h-5 w-5 text-muted-foreground" />
								</button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start" class="w-64">
								<DropdownMenu.Label class="flex items-center gap-2">
									<UserPlus class="h-4 w-4" />
									Select Employee
								</DropdownMenu.Label>
								<DropdownMenu.Separator />

								<div class="max-h-[300px] overflow-y-auto">
									{#each availableEmployees as emp (emp.id)}
										{@const empBadgeColor = emp.badge_color || '#3b82f6'}
										{@const empInitials = getInitials(emp.username)}

										<DropdownMenu.Item
											onclick={() => handleSelectEmployee(emp.id)}
											class="cursor-pointer gap-3 py-2"
										>
											<Avatar.Root
												class="h-8 w-8 flex-shrink-0"
												style="border: 2px solid {empBadgeColor};"
											>
												<Avatar.Image src={emp.image_url} alt={emp.username} />
												<Avatar.Fallback
													class="text-xs font-bold text-white"
													style="background-color: {empBadgeColor};"
												>
													{empInitials}
												</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex-1 truncate">
												<p class="truncate text-sm font-medium">{emp.username}</p>
												<p class="truncate text-xs text-muted-foreground">
													{emp.email.split('@')[0]}
												</p>
											</div>
										</DropdownMenu.Item>
									{/each}
								</div>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else}
						<div
							class="flex h-12 items-center justify-center rounded-lg border-2 border-dashed border-border/30 bg-muted/20"
						>
							<p class="text-xs text-muted-foreground italic">All employees assigned</p>
						</div>
					{/if}
				</div>

				<!-- Day Cells - Empty or for selected employee -->
				{#each weekDays as day (day.date)}
					<div class="{DAY_COL_WIDTH} flex-shrink-0 border-r p-3 last:border-r-0">
						{#if selectedEmployee}
							{@const empBadgeColor = selectedEmployee.badge_color || '#3b82f6'}

							<ScheduleDayCell
								shift={null}
								badgeColor={empBadgeColor}
								onAdd={() => {
									onAddShift(selectedEmployeeToAdd!, day.date);
									selectedEmployeeToAdd = null;
								}}
								onEdit={() => {}}
								onDelete={() => {}}
							/>
						{:else}
							<!-- Empty placeholder -->
							<div
								class="flex h-12 items-center justify-center rounded-lg border-2 border-dashed border-transparent"
							>
								<span class="text-xs text-muted-foreground/50">Select employee first</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
