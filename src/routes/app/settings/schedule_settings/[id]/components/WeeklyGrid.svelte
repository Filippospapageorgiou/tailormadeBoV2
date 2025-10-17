<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import type { Profile } from '$lib/models/database.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Pencil, Trash2, CalendarPlusIcon } from 'lucide-svelte';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		employee: Profile | null;
		weekStartDate: string; // YYYY-MM-DD
		shifts: Shift[]; // All shifts for this employee in this week
		onAddShift?: (date: string) => void;
		onEditShift?: (shift: Shift) => void;
		onDeleteShift?: (shiftId: number) => void;
	}

	let { employee, weekStartDate, shifts, onAddShift, onEditShift, onDeleteShift }: Props = $props();

	// Generate 7 days starting from weekStartDate
	let weekDays = $derived.by(() => {
		const startDate = new SvelteDate(weekStartDate);
		const days = [];

		for (let i = 0; i < 7; i++) {
			const date = new SvelteDate(startDate);
			date.setDate(startDate.getDate() + i);

			const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
			const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
			const dayNum = date.getDate();
			const monthName = date.toLocaleDateString('en-US', { month: 'short' });

			// Find shift for this day
			const shift = shifts.find((s) => s.shift_date === dateStr);

			days.push({
				date: dateStr,
				dayName,
				dayNum,
				monthName,
				shift
			});
		}

		return days;
	});

	// Calculate total hours for the week
	let totalHours = $derived.by(() => {
		let totalMinutes = 0;

		shifts.forEach((shift) => {
			if (shift.shift_type === SHIFT_TYPE.WORK && shift.start_time && shift.end_time) {
				const [startHour, startMin] = shift.start_time.split(':').map(Number);
				const [endHour, endMin] = shift.end_time.split(':').map(Number);

				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;

				const shiftMinutes = endMinutes - startMinutes;
				const netMinutes = shiftMinutes - (shift.break_duration_minutes || 0);

				totalMinutes += netMinutes;
			}
		});

		return (totalMinutes / 60).toFixed(1);
	});

	// Format time for display (HH:MM:SS -> HH:MM)
	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	// Calculate shift duration in hours
	function calculateShiftHours(shift: Shift): number {
		if (!shift.start_time || !shift.end_time) return 0;

		const [startHour, startMin] = shift.start_time.split(':').map(Number);
		const [endHour, endMin] = shift.end_time.split(':').map(Number);

		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;

		const shiftMinutes = endMinutes - startMinutes;
		const netMinutes = shiftMinutes - (shift.break_duration_minutes || 0);

		return netMinutes / 60;
	}

	// Get shift type badge styling
	function getShiftTypeBadge(
		shiftType: string
	): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string } {
		switch (shiftType) {
			case SHIFT_TYPE.WORK:
				return { variant: 'default', label: 'Work' };
			case SHIFT_TYPE.DAY_OFF:
				return { variant: 'secondary', label: 'Day Off' };
			case SHIFT_TYPE.SICK_LEAVE:
				return { variant: 'destructive', label: 'Sick' };
			case SHIFT_TYPE.VACATION:
				return { variant: 'outline', label: 'Vacation' };
			default:
				return { variant: 'secondary', label: shiftType };
		}
	}
</script>

{#if !employee}
	<!-- No Employee Selected State -->
	<Card.Card>
		<Card.CardContent class="flex flex-col items-center justify-center py-16">
			<CalendarPlusIcon class="mb-4 h-12 w-12 text-muted-foreground" />
			<p class="text-lg font-medium text-muted-foreground">No employee selected</p>
			<p class="text-sm text-muted-foreground">Select an employee to view their schedule</p>
		</Card.CardContent>
	</Card.Card>
{:else}
	<!-- Employee Schedule Grid -->
	<Card.Card>
		<Card.CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<Card.CardTitle class="text-lg">{employee.username}'s Weekly Schedule</Card.CardTitle>
					<Card.CardDescription>
						Manage shifts for the week • Total: {totalHours}h / 40h
					</Card.CardDescription>
				</div>
				{#if employee.badge_color}
					<Badge style="background-color: {employee.badge_color}; color: white;">
						{employee.role_name || 'Employee'}
					</Badge>
				{/if}
			</div>
		</Card.CardHeader>

		<Card.CardContent>
			<!-- Weekly Grid -->
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
				{#each weekDays as day (day.date)}
					<div class="rounded-lg border bg-card">
						<!-- Day Header -->
						<div class="border-b bg-muted/50 p-2 text-center">
							<p class="text-xs font-medium text-muted-foreground">{day.dayName}</p>
							<p class="text-sm font-semibold">
								{day.monthName} {day.dayNum}
							</p>
						</div>

						<!-- Shift Content -->
						<div class="p-3">
							{#if day.shift}
								{@const shiftBadge = getShiftTypeBadge(day.shift.shift_type)}
								{@const hours = calculateShiftHours(day.shift)}

								<!-- Existing Shift -->
								<div class="space-y-2">
									<Badge variant={shiftBadge.variant} class="w-full justify-center text-xs">
										{shiftBadge.label}
									</Badge>

									{#if day.shift.shift_type === SHIFT_TYPE.WORK}
										<div class="space-y-1 text-center">
											<p class="text-sm font-semibold">
												{formatTime(day.shift.start_time)} - {formatTime(day.shift.end_time)}
											</p>
											<p class="text-xs text-muted-foreground">
												{hours.toFixed(1)}h
												{#if day.shift.break_duration_minutes}
													(Break: {day.shift.break_duration_minutes}m)
												{/if}
											</p>
											{#if day.shift.notes}
												<p class="text-xs italic text-muted-foreground">
													{day.shift.notes}
												</p>
											{/if}
										</div>
									{:else}
										<p class="text-center text-xs text-muted-foreground">0h</p>
									{/if}

									<!-- Action Buttons -->
									<div class="flex gap-1">
										<Button
											variant="outline"
											size="sm"
											class="h-7 flex-1 text-xs"
											onclick={() => onEditShift?.(day.shift!)}
										>
											<Pencil class="mr-1 h-3 w-3" />
											Edit
										</Button>
										<Button
											variant="destructive"
											size="sm"
											class="h-7 flex-1 text-xs"
											onclick={() => onDeleteShift?.(day.shift!.id)}
										>
											<Trash2 class="mr-1 h-3 w-3" />
											Delete
										</Button>
									</div>
								</div>
							{:else}
								<!-- No Shift - Add Button -->
								<Button
									variant="ghost"
									class="h-24 w-full border-2 border-dashed hover:border-primary hover:bg-accent"
									onclick={() => onAddShift?.(day.date)}
								>
									<div class="flex flex-col items-center gap-1">
										<Plus class="h-5 w-5 text-muted-foreground" />
										<span class="text-xs text-muted-foreground">Add Shift</span>
									</div>
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Summary Footer -->
			<div class="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 p-3">
				<div class="flex items-center gap-4">
					<div class="text-sm">
						<span class="text-muted-foreground">Work Shifts:</span>
						<span class="ml-1 font-semibold">
							{shifts.filter((s) => s.shift_type === SHIFT_TYPE.WORK).length}
						</span>
					</div>
					<div class="text-sm">
						<span class="text-muted-foreground">Days Off:</span>
						<span class="ml-1 font-semibold">
							{shifts.filter((s) => s.shift_type === SHIFT_TYPE.DAY_OFF).length}
						</span>
					</div>
				</div>
				<div class="text-sm font-semibold">
					Total: <span class="text-lg">{totalHours}h</span>
				</div>
			</div>
		</Card.CardContent>
	</Card.Card>
{/if}
