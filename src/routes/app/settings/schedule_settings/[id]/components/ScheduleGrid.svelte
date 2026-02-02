<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import type { Shift, WeeklySchedule } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { UserPlus, X } from 'lucide-svelte';
	import ScheduleDayCell from './ScheduleDayCell.svelte';
	import SortableEmployeeRow from './SortableEmployeeRow.svelte';
	import DraggableShift from './DraggableShift.svelte';
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { sensors } from '$lib';

	interface Props {
		schedule: WeeklySchedule;
		employees: Profile[];
		shifts: Shift[];
		allEmployees: Profile[];
		onAddShift: (employeeId: string, date: string) => void;
		onEditShift: (shift: Shift) => void;
		onDeleteShift: (shiftId: number) => void;
		onCopyShift?: (sourceShift: Shift, targetEmployeeId: string, targetDate: string) => void;
		onReorderEmployees?: (employees: Profile[]) => void;
	}

	let {
		schedule,
		employees,
		shifts,
		allEmployees,
		onAddShift,
		onEditShift,
		onDeleteShift,
		onCopyShift,
		onReorderEmployees
	}: Props = $props();

	const EMPLOYEE_COL_WIDTH = 'w-44';
	const DAY_COL_WIDTH = 'w-46';

	let localEmployees = $derived(employees);
	$effect(() => {
		localEmployees = employees;
	});

	let orderEmployees = $derived.by(() => {
		return localEmployees.map((employee, index) => ({
			id: employee.id,
			orderDisplay: employee.display_order
		}));
	});

	let weekDays = $derived.by(() => {
		if (!schedule) return [];
		const startDate = new Date(schedule.week_start_date);
		const greekDayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
		const days = [];
		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			days.push({
				date: date.toISOString().split('T')[0],
				dayName: greekDayNames[(date.getDay() + 6) % 7],
				dayNum: date.getDate()
			});
		}
		return days;
	});

	let availableEmployees = $derived(
		allEmployees.filter((emp) => !employees.find((e) => e.id === emp.id))
	);

	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.substring(0, 2).toUpperCase();
	}

	let selectedEmployeeToAdd = $state<string | null>(null);
	function handleSelectEmployee(employeeId: string) {
		selectedEmployeeToAdd = employeeId;
	}
	function handleRemoveSelectedEmployee() {
		selectedEmployeeToAdd = null;
	}
	let selectedEmployee = $derived(
		selectedEmployeeToAdd ? allEmployees.find((e) => e.id === selectedEmployeeToAdd) : null
	);

	function handleDragOver(event: any) {
		return;
	}

	async function handleDragEnd(event: any) {
		const { source, target } = event.operation;
		if (!source || !target) return;

		// Check if this is a shift drag (id starts with "shift-")
		const sourceId = String(source.id);
		if (sourceId.startsWith('shift-')) {
			const targetId = String(target.id);

			// Target should be a cell (id starts with "cell-")
			if (targetId.startsWith('cell-')) {
				const shiftData = source.data?.shift as Shift | undefined;
				const targetEmployeeId = target.data?.employeeId as string | undefined;
				const targetDate = target.data?.date as string | undefined;

				if (shiftData && targetEmployeeId && targetDate && onCopyShift) {
					// Don't copy to the same cell
					if (shiftData.user_id === targetEmployeeId && shiftData.shift_date === targetDate) {
						return;
					}
					onCopyShift(shiftData, targetEmployeeId, targetDate);
				}
			}
		}
	}

	// Get dragged shift data for overlay
	function getDraggedShift(sourceId: string): { shift: Shift; badgeColor: string } | null {
		if (!sourceId.startsWith('shift-')) return null;
		const shiftId = parseInt(sourceId.replace('shift-', ''));
		const shift = shifts.find(s => s.id === shiftId);
		if (!shift) return null;
		const employee = employees.find(e => e.id === shift.user_id);
		const badgeColor = employee?.badge_color || '#3b82f6';
		return { shift, badgeColor };
	}
</script>

<div class="space-y-4">
	<div
		class="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
	>
		<div class="overflow-x-auto">
			<div class="inline-block min-w-full">
				<!-- Header Row -->
				<div
					class="sticky top-0 z-20 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
				>
					<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r border-zinc-200 px-4 py-3 dark:border-zinc-800">
						<p class="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
							Employee
						</p>
					</div>
					{#each weekDays as day (day.date)}
						<div
							class="{DAY_COL_WIDTH} flex-shrink-0 border-r border-zinc-200 px-3 py-3 text-center last:border-r-0 dark:border-zinc-800"
						>
							<p class="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
								{day.dayName}
							</p>
							<p class="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{day.dayNum}</p>
						</div>
					{/each}
				</div>

				<DragDropProvider {sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
					<div class="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
						{#each localEmployees as employee, index (employee.id)}
							<SortableEmployeeRow
								{employee}
								{index}
								{shifts}
								{weekDays}
								{onAddShift}
								{onEditShift}
								{onDeleteShift}
							/>
						{/each}
					</div>

					<DragOverlay>
						{#snippet children(source)}
							{#if source}
								{@const sourceId = String(source.id)}
								{#if sourceId.startsWith('shift-')}
									<!-- Shift drag overlay -->
									{@const dragData = getDraggedShift(sourceId)}
									{#if dragData}
										<div class="w-32">
											<DraggableShift
												shift={dragData.shift}
												badgeColor={dragData.badgeColor}
												onEdit={() => {}}
												onDelete={() => {}}
												isOverlay={true}
											/>
										</div>
									{/if}
								{:else}
									<!-- Employee row drag overlay -->
									{@const emp = localEmployees.find((e) => e.id === source.id)}
									{#if emp}
										<div class="rounded-lg bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
											<SortableEmployeeRow
												employee={emp}
												index={0}
												{shifts}
												{weekDays}
												{onAddShift}
												{onEditShift}
												{onDeleteShift}
											/>
										</div>
									{/if}
								{/if}
							{/if}
						{/snippet}
					</DragOverlay>
				</DragDropProvider>

				<!-- Add Employee Row -->
				<div
					class="flex border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50"
				>
					<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r border-zinc-200 px-4 py-3 dark:border-zinc-800">
						{#if selectedEmployee}
							{@const badgeColor = selectedEmployee.badge_color || '#3b82f6'}
							{@const initials = getInitials(selectedEmployee.username)}

							<div
								class="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
								style="border-left: 3px solid {badgeColor};"
							>
								<Avatar.Root class="h-8 w-8 flex-shrink-0">
									<Avatar.Image src={selectedEmployee.image_url} alt={selectedEmployee.username} />
									<Avatar.Fallback
										class="text-xs font-semibold text-white"
										style="background-color: {badgeColor};"
									>
										{initials}
									</Avatar.Fallback>
								</Avatar.Root>

								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">
										{selectedEmployee.username}
									</p>
									<p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
										{selectedEmployee.email.split('@')[0]}
									</p>
								</div>

								<Button
									variant="ghost"
									size="icon"
									onclick={handleRemoveSelectedEmployee}
									class="h-6 w-6 flex-shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{:else if availableEmployees.length > 0}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger class="w-full">
									<button
										type="button"
										class="group flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
									>
										<UserPlus
											class="h-4 w-4 text-zinc-400 transition-colors duration-150 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
										/>
										<span class="text-sm text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300">Add employee</span>
									</button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="start" class="w-64">
									<DropdownMenu.Label class="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
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
														class="text-xs font-semibold text-white"
														style="background-color: {empBadgeColor};"
													>
														{empInitials}
													</Avatar.Fallback>
												</Avatar.Root>
												<div class="flex-1 truncate">
													<p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp.username}</p>
													<p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
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
								class="flex h-11 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
							>
								<p class="text-xs text-zinc-400 dark:text-zinc-500">All employees assigned</p>
							</div>
						{/if}
					</div>

					{#each weekDays as day (day.date)}
						<div class="{DAY_COL_WIDTH} flex-shrink-0 border-r border-zinc-200 p-2.5 last:border-r-0 dark:border-zinc-800">
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
								<div
									class="flex h-[48px] items-center justify-center rounded-lg"
								>
									<span class="text-xs text-zinc-300 dark:text-zinc-600">-</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
