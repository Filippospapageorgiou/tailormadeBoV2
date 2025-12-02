<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import type { Shift, WeeklySchedule } from '$lib/models/schedule.types';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Plus, UserPlus, X } from 'lucide-svelte';
	import ScheduleDayCell from './ScheduleDayCell.svelte';
	import SortableEmployeeRow from './SortableEmployeeRow.svelte';
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { sensors } from '$lib';
	import { updateDisplayOrder } from '../data.remote';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		schedule: WeeklySchedule;
		employees: Profile[];
		shifts: Shift[];
		allEmployees: Profile[];
		onAddShift: (employeeId: string, date: string) => void;
		onEditShift: (shift: Shift) => void;
		onDeleteShift: (shiftId: number) => void;
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
		onReorderEmployees
	}: Props = $props();

	const EMPLOYEE_COL_WIDTH = 'w-56';
	const DAY_COL_WIDTH = 'w-40';

	let localEmployees = $state(employees);
	$effect(() => {
		localEmployees = employees;
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

	// 1. DISABLE REAL-TIME SORTING (Prevents the ripple effect)
	function handleDragOver(event: any) {
		return;
	}

	// 2. HANDLE SINGLE SWAP ON DROP
	async function handleDragEnd(event: any) {}
</script>

<div class="space-y-6">
	<div
		class="animate-in overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.2] shadow-xl backdrop-blur-sm duration-700 fade-in slide-in-from-bottom-4"
	>
		<div class="overflow-x-auto">
			<div class="inline-block min-w-full">
				<div
					class="sticky top-0 z-20 flex border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent backdrop-blur-lg"
				>
					<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r border-white/10 px-6 py-4">
						<p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
							Employee
						</p>
					</div>
					{#each weekDays as day (day.date)}
						<div
							class="{DAY_COL_WIDTH} flex-shrink-0 border-r border-white/10 px-4 py-4 text-center transition-all duration-300 last:border-r-0 hover:bg-white/5"
						>
							<p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
								{day.dayName}
							</p>
							<p class="mt-1 text-lg font-bold text-black">{day.dayNum}</p>
						</div>
					{/each}
				</div>

				<DragDropProvider {sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
					<div class="flex flex-col">
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
								{@const emp = localEmployees.find((e) => e.id === source.id)}
								{#if emp}
									<div class="rotate-2 opacity-80 shadow-2xl">
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
						{/snippet}
					</DragOverlay>
				</DragDropProvider>

				<div
					class="flex animate-in border-t border-white/10 bg-gradient-to-r from-blue-500/5 to-transparent duration-700 fade-in slide-in-from-bottom-4"
					style="animation-delay: 300ms;"
				>
					<div class="{EMPLOYEE_COL_WIDTH} flex-shrink-0 border-r border-white/10 px-6 py-4">
						{#if selectedEmployee}
							{@const badgeColor = selectedEmployee.badge_color || '#3b82f6'}
							{@const initials = getInitials(selectedEmployee.username)}

							<div
								class="scale-in-95 flex animate-in items-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-3 transition-all duration-300 fade-in hover:border-blue-500/50 hover:bg-blue-500/15"
								style="border-left: 3px solid {badgeColor}; border-left-color: {badgeColor};"
							>
								<Avatar.Root class="h-8 w-8 flex-shrink-0" style="border: 3px solid ">
									<Avatar.Image src={selectedEmployee.image_url} alt={selectedEmployee.username} />
									<Avatar.Fallback
										class="text-xs font-bold text-white"
										style="background-color: {badgeColor};"
									>
										{initials}
									</Avatar.Fallback>
								</Avatar.Root>

								<div class="min-w-0 flex-1">
									<p class="truncate text-xs leading-tight font-semibold text-white">
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
									class="h-6 w-6 flex-shrink-0 transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{:else if availableEmployees.length > 0}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger class="w-full">
									<button
										type="button"
										class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10"
									>
										<UserPlus
											class="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-blue-400"
										/>
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
												class="cursor-pointer gap-3 py-2 transition-all duration-200 hover:bg-white/10"
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
													<p class="truncate text-sm font-medium text-white">{emp.username}</p>
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
								class="flex h-12 items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02]"
							>
								<p class="text-xs text-muted-foreground italic">All employees assigned</p>
							</div>
						{/if}
					</div>

					{#each weekDays as day (day.date)}
						<div class="{DAY_COL_WIDTH} flex-shrink-0 border-r border-white/10 p-3 last:border-r-0">
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
									class="flex h-12 items-center justify-center rounded-xl border-2 border-dashed border-transparent"
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
</div>
