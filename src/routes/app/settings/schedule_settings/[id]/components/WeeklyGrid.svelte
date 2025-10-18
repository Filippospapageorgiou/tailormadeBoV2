<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import type { Profile } from '$lib/models/database.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Check } from 'lucide-svelte';
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

	// Greek day names
	const greekDayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

	// Generate 7 days starting from weekStartDate
	let weekDays = $derived.by(() => {
		const startDate = new SvelteDate(weekStartDate);
		const days = [];

		for (let i = 0; i < 7; i++) {
			const date = new SvelteDate(startDate);
			date.setDate(startDate.getDate() + i);

			const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
			const dayName = greekDayNames[date.getDay()];
			const dayNum = date.getDate();

			// Find shift for this day
			const shift = shifts.find((s) => s.shift_date === dateStr);

			days.push({
				date: dateStr,
				dayName,
				dayNum,
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

		return Math.round(totalMinutes / 60);
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

		return Math.round(netMinutes / 60);
	}

	let badgeColor = $derived(employee?.badge_color || '#8b5cf6');
</script>

{#if !employee}
	<!-- No Employee Selected State -->
	<Card.Card class="border-2 border-dashed">
		<Card.CardContent class="flex flex-col items-center justify-center py-20">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<CalendarIcon class="h-8 w-8 text-muted-foreground" />
			</div>
			<p class="mt-4 text-lg font-medium text-muted-foreground">No employee selected</p>
			<p class="mt-1 text-sm text-muted-foreground">Select an employee above to view their schedule</p>
		</Card.CardContent>
	</Card.Card>
{:else}
	<!-- Weekly Schedule -->
	<div class="space-y-6">
		<!-- Header with Employee Name and Total Hours -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
					style="background-color: {badgeColor};"
				>
					<CalendarIcon class="h-5 w-5" />
				</div>
				<div>
					<h2 class="text-xl font-bold tracking-tight">
						{employee.username} - WEEKLY SCHEDULE
					</h2>
					<p class="text-sm text-muted-foreground">
						Manage shifts for the week
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
				<CalendarIcon class="h-4 w-4 text-muted-foreground" />
				<span class="text-2xl font-bold">{totalHours}h</span>
			</div>
		</div>

		<!-- Weekly Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
			{#each weekDays as day (day.date)}
				<div class="flex flex-col">
					<!-- Day Header -->
					<div class="mb-3 text-center">
						<p class="text-sm font-medium text-muted-foreground">{day.dayName}</p>
						<p class="text-2xl font-bold">{day.dayNum}</p>
					</div>

					<!-- Shift Content -->
					<div class="flex-1">
						{#if day.shift}
							{@const hours = calculateShiftHours(day.shift)}

							{#if day.shift.shift_type === SHIFT_TYPE.DAY_OFF}
								<!-- Day Off Card -->
								<div
									class="group relative flex h-[240px] flex-col items-center justify-center gap-4 rounded-2xl p-6 text-white shadow-lg  hover:-translate-y-1 transition-all duration-200"
									style="background-color: #ef4444;"
								>
									<div class="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onEditShift?.(day.shift!)}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onDeleteShift?.(day.shift!.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>

									<CalendarIcon class="h-10 w-10" />
									<div class="text-center">
										<p class="text-2xl font-bold">ΡΕΠΟ</p>
										<p class="text-sm opacity-90">Day Off</p>
									</div>
								</div>
							{:else if day.shift.shift_type === SHIFT_TYPE.WORK}
								<!-- Work Shift Card -->
								<div
									class="group relative flex h-[240px] flex-col justify-between rounded-2xl p-6 text-white shadow-lg  hover:-translate-y-1 transition-all duration-200"
									style="background-color: {badgeColor};"
								>
									<!-- Top Icons -->
									<div class="flex items-start justify-between">
										<div class="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
											<Check class="h-4 w-4" />
										</div>
										<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<Button
												variant="secondary"
												size="icon"
												class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
												onclick={() => onEditShift?.(day.shift!)}
											>
												<Pencil class="h-4 w-4" />
											</Button>
											<Button
												variant="secondary"
												size="icon"
												class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
												onclick={() => onDeleteShift?.(day.shift!.id)}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									</div>

									<!-- Time Display -->
									<div class="flex flex-col items-center gap-3">
										<p class="text-3xl font-bold">
											{formatTime(day.shift.start_time)}
										</p>
										<div class="h-px w-16 bg-white/40"></div>
										<p class="text-3xl font-bold">
											{formatTime(day.shift.end_time)}
										</p>
									</div>

									<!-- Hours -->
									<div class="text-center">
										<p class="text-lg font-semibold">{hours}h</p>
										{#if day.shift.break_duration_minutes}
											<p class="text-xs opacity-75">Break: {day.shift.break_duration_minutes}m</p>
										{/if}
									</div>
								</div>
							{:else if day.shift.shift_type === SHIFT_TYPE.SICK_LEAVE}
								<!-- Sick Leave Card -->
								<div
									class="group relative flex h-[240px] flex-col items-center justify-center gap-4 rounded-2xl p-6 text-white shadow-lg  hover:-translate-y-1 transition-all duration-200"
									style="background-color: #f97316;"
								>
									<div class="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onEditShift?.(day.shift!)}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onDeleteShift?.(day.shift!.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>

									<div class="text-center">
										<p class="text-xl font-bold">Sick Leave</p>
										<p class="text-sm opacity-90">Άδεια Ασθενείας</p>
									</div>
								</div>
							{:else if day.shift.shift_type === SHIFT_TYPE.VACATION}
								<!-- Vacation Card -->
								<div
									class="group relative flex h-[240px] flex-col items-center justify-center gap-4 rounded-2xl p-6 text-white shadow-lg  hover:-translate-y-1 transition-all duration-200"
									style="background-color: #06b6d4;"
								>
									<div class="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onEditShift?.(day.shift!)}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="secondary"
											size="icon"
											class="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30"
											onclick={() => onDeleteShift?.(day.shift!.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>

									<div class="text-center">
										<p class="text-xl font-bold">Vacation</p>
										<p class="text-sm opacity-90">Διακοπές</p>
									</div>
								</div>
							{/if}
						{:else}
							<!-- No Shift - Add Button -->
							<button
								type="button"
								onclick={() => onAddShift?.(day.date)}
								class="flex h-[240px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 transition-all hover:border-primary hover:bg-muted/40"
							>
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
									<Plus class="h-6 w-6 text-muted-foreground" />
								</div>
								<span class="text-sm font-medium text-muted-foreground">Add Shift</span>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}