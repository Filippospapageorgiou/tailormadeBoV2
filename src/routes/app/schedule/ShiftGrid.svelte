<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import type { Profile } from '$lib/models/database.types';
	import ShiftCell from './ShiftCell.svelte';
	import { User, ArrowRight } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';

	interface Day {
		date: string;
		dayName: string;
		fullDayName: string;
		dayNum: number;
		month: string;
		isToday: boolean;
		isWeekend: boolean;
		shifts: Shift[];
	}

	interface Props {
		weekDays: Day[];
		employees: Profile[];
		shifts: Shift[];
		selectedEmployeeId: string | null;
		isCurrentWeek: boolean;
		onEmployeeSelect: (employee: Profile) => void;
		onShiftClick: (shiftId: number) => void;
	}

	const { 
		weekDays, 
		employees, 
		shifts, 
		selectedEmployeeId, 
		isCurrentWeek,
		onEmployeeSelect, 
		onShiftClick 
	}: Props = $props();

	function getEmployeeShiftsForDay(employeeId: string, date: string): Shift[] {
		return shifts.filter((s) => s.user_id === employeeId && s.shift_date === date);
	}

	// Get shift type color
	function getShiftTypeColor(type: string): string {
		const colors: Record<string, string> = {
			'morning': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200',
			'evening': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200',
			'night': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200',
			'off': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
		};
		return colors[type?.toLowerCase()] || colors.morning;
	}

	// Filter employees if one is selected, but keep layout stable
	let displayedEmployees = $derived(
		selectedEmployeeId 
			? employees.filter(e => e.id === selectedEmployeeId)
			: employees
	);
</script>

<div class="w-full">
	<div class="overflow-x-auto">
		<div class="min-w-[1000px]">
			<!-- Header Row -->
			<div class="grid grid-cols-8 border-b bg-muted/50 border-border/50">
				<!-- Employee Column Header -->
				<div class="sticky left-0 z-20 bg-muted/50 p-4 backdrop-blur-sm border-r  border-border/50">
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Εργαζόμενος
					</p>
				</div>

				<!-- Day Columns -->
				{#each weekDays as day, index (day.date)}
					<div class={cn(
						"flex-1 p-3 text-center border-r border-border/50 last:border-r-0 transition-colors",
						day.isToday && "bg-primary/5",
						day.isWeekend && "bg-muted/30"
					)}>
						<div class="flex flex-col items-center gap-1">
							<span class={cn(
								"text-xs font-medium uppercase tracking-wider",
								day.isToday ? "text-primary font-bold" : "text-muted-foreground"
							)}>
								{day.dayName}
							</span>
							<div class="flex items-baseline gap-1">
								<span class={cn(
									"text-lg font-bold",
									day.isToday ? "text-primary" : "text-foreground"
								)}>
									{day.dayNum}
								</span>
								<span class="text-xs text-muted-foreground">{day.month}</span>
							</div>
							{#if day.isToday}
								<!-- svelte-ignore element_invalid_self_closing_tag -->
								<div class="mt-1 h-1 w-1 rounded-full bg-primary" />
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Employee Rows -->
			{#if displayedEmployees.length === 0}
				<div class="p-12 text-center text-muted-foreground">
					Δεν βρέθηκαν εργαζόμενοι
				</div>
			{:else}
				{#each displayedEmployees as employee, empIndex (employee.id)}
					{@const isSelected = employee.id === selectedEmployeeId}
					{@const badgeColor = employee.badge_color || '#3b82f6'}
					
					<div 
						style="animation-delay:{empIndex * 150}ms"
						class={cn(
							"grid grid-cols-8 transition-all duration-200 border-b  border-border/50 last:border-b-0 animate-fade-in-down",
							isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30",
							empIndex % 2 === 0 ? "bg-white dark:bg-background" : "bg-muted/20 dark:bg-muted/10"
						)}
					>
						<!-- Employee Cell (Sticky) -->
						<button 
							class={cn(
								"sticky left-0 z-10 flex items-center gap-2 p-1 text-left border-r  border-border/50 transition-all backdrop-blur-sm",
								isSelected ? "bg-primary/10 dark:bg-primary/20" : "bg-inherit",
								"hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20"
							)}
							onclick={() => onEmployeeSelect(employee)}
						>							
							<!-- Avatar -->
							<div class="h-10 w-10 overflow-hidden rounded-full bg-muted ring-2 ring-white dark:ring-background shadow-sm flex-shrink-0">
								{#if employee.image_url}
									<img
										src={employee.image_url}
										alt={employee.username}
										class="h-full w-full object-cover dark:bg-white"
									/>
								{:else}
									<div class="h-full w-full flex items-center justify-center bg-primary/10">
										<User class="h-5 w-5 text-primary/60" />
									</div>
								{/if}
							</div>

							<!-- Info -->
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-foreground">
									{employee.username}
								</p>
								<p class="truncate text-xs text-muted-foreground">
									{employee.email || employee.username}
								</p>
								<span class="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
									{employee.role.slice(0,5)}
								</span>
							</div>

							<!-- Selection Indicator -->
							{#if isSelected}
								<div in:slide={{ axis: 'x' }}>
									<ArrowRight class="h-4 w-4 text-primary" />
								</div>
							{/if}
						</button>

						<!-- Day Cells -->
						{#each weekDays as day (day.date)}
							{@const dayShifts = getEmployeeShiftsForDay(employee.id, day.date)}
							<div class={cn(
								"flex-1 p-2 border-r  border-border/50 last:border-r-0 min-h-[80px] transition-colors",
								day.isToday && "bg-primary/[0.02]",
								day.isWeekend && "bg-muted/20"
							)}>
								<div class="flex flex-col gap-1.5 h-full">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									{#if dayShifts.length === 0}
										<!-- Empty Cell -->
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div class="h-full min-h-[60px] rounded-md border  border-border/50 bg-muted/10 flex items-center justify-center group cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors" onclick={() => {/* Could open "Add Shift" */}}>
											<span class="text-xs text-muted-foreground/50 group-hover:text-primary/50">+</span>
										</div>
									{:else}
										{#each dayShifts as shift (shift.id)}
											<ShiftCell 
												{shift} 
												{badgeColor}
												onClick={() => onShiftClick(shift.id)} 
											/>
										{/each}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	</div>
	
	<!-- Mobile Scroll Hint -->
	<div class="md:hidden flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground bg-muted/30">
		<ArrowRight class="h-3 w-3 animate-pulse" />
		<span>Σύρετε δεξιά για να δείτε όλες τις μέρες</span>
	</div>
</div>