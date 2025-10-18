<script lang="ts">
	import { getCurrentSchedule, getShfitInfo } from './data.remote';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import { Calendar, ChevronLeft, ChevronRight, Users, Clock, Check } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let query = getCurrentSchedule();

	let schedule = $derived(query.current?.schedule ?? null);
	let employees = $derived(query.current?.employees ?? []);
	let shifts = $derived(query.current?.shifts ?? []);
	let employeeHours = $derived(query.current?.employeeHours ?? {});
	let totalHours = $derived(query.current?.totalHours ?? 0);
	let averageHours = $derived(query.current?.averageHours ?? 0);

	// Selected employee state
	let selectedEmployeeId = $state<string | null>(null);

	// Greek day names (starting from Monday)
	const greekDayNames = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
	const fullGreekDayNames = [
		'Δευτέρα',
		'Τρίτη',
		'Τετάρτη',
		'Πέμπτη',
		'Παρασκευή',
		'Σάββατο',
		'Κυριακή'
	];

	// Format date range for header
	function formatWeekRange(start: string, end: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);

		const startDay = startDate.getDate();
		const endDay = endDate.getDate();

		const monthNames = [
			'Ιαν',
			'Φεβ',
			'Μαρ',
			'Απρ',
			'Μαι',
			'Ιουν',
			'Ιουλ',
			'Αυγ',
			'Σεπ',
			'Οκτ',
			'Νοε',
			'Δεκ'
		];
		const month = monthNames[startDate.getMonth()];
		const year = startDate.getFullYear();

		return `Εβδομάδα ${startDay}-${endDay} ${month} ${year}`;
	}

	async function getShiftInformation(id: number) {
		const shiftInfo = await getShfitInfo({ id });
		console.log('Shift info:', shiftInfo);
	}

	// Generate week days from schedule
	let weekDays = $derived.by(() => {
		if (!schedule) return [];

		const startDate = new Date(schedule.week_start_date);
		const days = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const dateStr = date.toISOString().split('T')[0];
			const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday=0
			const dayName = greekDayNames[dayOfWeek];
			const fullDayName = fullGreekDayNames[dayOfWeek];
			const dayNum = date.getDate();

			// Get all shifts for this day
			const dayShifts = shifts.filter((s) => s.shift_date === dateStr);

			days.push({
				date: dateStr,
				dayName,
				fullDayName,
				dayNum,
				shifts: dayShifts
			});
		}

		return days;
	});

	// Get employee by ID
	function getEmployee(userId: string): Profile | undefined {
		return employees.find((e) => e.id === userId);
	}

	// Get initials from username
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	// Format time (HH:MM:SS -> HH:MM)
	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	// Get hours for employee
	function getEmployeeHours(userId: string): number {
		return employeeHours[userId] ?? 0;
	}

	// Handle employee selection
	function handleSelectEmployee(employee: Profile) {
		if (selectedEmployeeId === employee.id) {
			selectedEmployeeId = null;
		} else {
			selectedEmployeeId = employee.id;
		}
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto space-y-6 px-4 pt-6 pb-10 md:px-6">
		{#await query}
			<!-- Loading State -->
			<div class="space-y-6">
				<Skeleton class="h-20 w-full" />
				<Skeleton class="h-48 w-full" />
				<Skeleton class="h-96 w-full" />
			</div>
		{:then result}
			{#if result.success && schedule}
				<!-- Header -->
				<div
					class="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6"
				>
					<div class="flex items-center gap-4">
						<div
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10"
						>
							<Calendar class="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight md:text-2xl">ΠΡΟΓΡΑΜΜΑ</h1>
							<p class="text-xs text-muted-foreground md:text-sm">
								{formatWeekRange(schedule.week_start_date, schedule.week_end_date)}
							</p>
						</div>
					</div>
					<div class="hidden items-center gap-2 md:flex">
						<Button variant="outline" size="icon" disabled>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm" disabled>Προηγ.</Button>
						<Button variant="outline" size="sm" disabled>Επόμ.</Button>
						<Button variant="outline" size="icon" disabled>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>

				<!-- Team Members Section -->
				<div class="space-y-4 rounded-xl bg-card p-4 shadow-sm md:p-6">
					<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10"
							>
								<Users class="h-5 w-5 text-primary" />
							</div>
							<div>
								<h2 class="text-base font-semibold md:text-lg">ΜΕΛΗ ΟΜΑΔΑΣ</h2>
								<p class="text-xs text-muted-foreground md:text-sm">
									({employees.length} υπαλλήλων)
								</p>
							</div>
						</div>
						<div class="flex flex-wrap items-center gap-4 text-xs md:gap-6 md:text-sm">
							<div>
								<span class="text-muted-foreground">Σύνολο ωρών:</span>
								<span class="ml-2 font-semibold">{totalHours}ω</span>
							</div>
							<div>
								<span class="text-muted-foreground">Μέσος όρος:</span>
								<span class="ml-2 font-semibold">{averageHours}ω</span>
							</div>
						</div>
					</div>

					<!-- Employee Cards Carousel -->
					<div class="-mx-4 md:mx-0">
						<ScrollArea class="h-[300px]">
							<div class="grid grid-cols-2 gap-4 pr-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
								{#each employees as employee (employee.id)}
									{@const isSelected = employee.id === selectedEmployeeId}
									{@const hours = getEmployeeHours(employee.id)}
									{@const initials = getInitials(employee.username)}
									{@const badgeColor = employee.badge_color || '#3b82f6'}

									<button
										type="button"
										onclick={() => handleSelectEmployee(employee)}
										class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-card p-6 transition-all hover:shadow-lg {isSelected
											? 'border-2 shadow-lg'
											: 'border-border hover:border-primary/30'}"
										style={isSelected ? `border-color: ${badgeColor};` : ''}
									>
										<!-- Online Indicator -->
										<div class="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-green-500"></div>

										<!-- Avatar with Image or Initials -->
										<div class="relative transition-transform group-hover:scale-105">
											<Avatar.Root class="h-24 w-24 shadow-md" style="border: 3px solid {badgeColor};">
												<Avatar.Image src={employee.image_url} alt={employee.username} />
												<Avatar.Fallback 
													class="text-2xl font-bold text-white"
													style="background-color: {badgeColor};"
												>
													{initials}
												</Avatar.Fallback>
											</Avatar.Root>

											<!-- Selected Checkmark -->
											{#if isSelected}
												<div
													class="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm"
													style="background-color: {badgeColor};"
												>
													<Check class="h-3.5 w-3.5 text-white" />
												</div>
											{/if}
										</div>

										<!-- Employee Info -->
										<div class="flex flex-col items-center gap-1 text-center">
											<!-- Name -->
											<p class="text-base leading-tight font-semibold">
												{employee.username}
											</p>

											<!-- Email/Full Name - could be full name if you have it -->
											<p class="line-clamp-1 text-xs text-muted-foreground">
												{employee.email.split('@')[0]}
											</p>

											<!-- Role Badge (using badge_color) -->
											<Badge
												class="mt-1 text-xs font-medium"
												style="background-color: {badgeColor}; color: white; border: none;"
											>
												{employee.role_name || 'Employee'}
											</Badge>

											<!-- Hours Display -->
											<div class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
												<Clock class="h-3.5 w-3.5" />
												<span class="font-medium">{hours}h / 40h</span>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</ScrollArea>
					</div>
				</div>

				<!-- Weekly Schedule Grid -->
				<div class="space-y-4 rounded-xl bg-card p-4 shadow-sm md:p-6">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10"
						>
							<Calendar class="h-5 w-5 text-primary" />
						</div>
						<h2 class="text-base font-semibold md:text-lg">ΕΒΔΟΜΑΔΙΑΙΟ ΠΡΟΓΡΑΜΜΑ</h2>
					</div>

					<!-- Grid - Mobile: Vertical layout, Desktop: 7 columns -->
					<div class="space-y-4 md:space-y-0">
						<!-- Mobile Layout -->
						<div class="flex flex-col gap-4 md:hidden">
							{#each weekDays as day (day.date)}
								<div class="rounded-lg bg-muted/30 p-3">
									<!-- Day Header -->
									<div class="mb-3 flex items-center justify-between">
										<div>
											<p class="text-xs font-medium text-muted-foreground">{day.fullDayName}</p>
											<p class="text-lg font-bold">{day.dayNum}</p>
										</div>
									</div>

									<!-- Shifts -->
									<div class="space-y-2">
										{#if day.shifts.length === 0}
											<p class="py-4 text-center text-xs text-muted-foreground">Καμία βάρδια</p>
										{:else}
											{#each day.shifts as shift (shift.id)}
												{@const employee = getEmployee(shift.user_id)}
												{@const badgeColor = employee?.badge_color || '#3b82f6'}

												{#if shift.shift_type === SHIFT_TYPE.DAY_OFF}
													<button
														onclick={() => getShiftInformation(shift.id)}
														class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-red-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-red-500/90 hover:shadow-lg"
													>
														ΡΕΠΟ
													</button>
												{:else if shift.shift_type === SHIFT_TYPE.WORK}
													<button
														onclick={() => getShiftInformation(shift.id)}
														class="w-full cursor-pointer rounded-lg p-3 text-center text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
														style="background-color: {badgeColor}dd;"
													>
														{formatTime(shift.start_time)}-{formatTime(shift.end_time)}
													</button>
												{:else if shift.shift_type === SHIFT_TYPE.SICK_LEAVE}
													<button
														onclick={() => getShiftInformation(shift.id)}
														class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-orange-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-orange-500/90 hover:shadow-lg"
													>
														Άδεια
													</button>
												{:else if shift.shift_type === SHIFT_TYPE.VACATION}
													<button
														onclick={() => getShiftInformation(shift.id)}
														class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-cyan-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-cyan-500/90 hover:shadow-lg"
													>
														Διακοπές
													</button>
												{/if}
											{/each}
										{/if}
									</div>
								</div>
							{/each}
						</div>

						<!-- Desktop Layout -->
						<div class="hidden md:block">
							<div class="overflow-x-auto">
								<div class="grid grid-cols-7">
									<!-- Day Headers -->
									{#each weekDays as day (day.date)}
										<div class="border-r border-border p-4 text-center last:border-r-0">
											<p class="text-sm font-medium text-muted-foreground">{day.dayName}</p>
											<p class="text-2xl font-bold">{day.dayNum}</p>
										</div>
									{/each}

									<!-- Shift Cells -->
									{#each weekDays as day (day.date)}
										<div class="min-h-[400px] border-r border-border p-2">
											<div class="flex h-full flex-col gap-2">
												{#each day.shifts as shift (shift.id)}
													{@const employee = getEmployee(shift.user_id)}
													{@const badgeColor = employee?.badge_color || '#3b82f6'}

													{#if shift.shift_type === SHIFT_TYPE.DAY_OFF}
														<button
															type="button"
															onclick={() => getShiftInformation(shift.id)}
															class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-red-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-red-500/90 hover:shadow-lg"
														>
															ΡΕΠΟ
														</button>
													{:else if shift.shift_type === SHIFT_TYPE.WORK}
														<button
															type="button"
															onclick={() => getShiftInformation(shift.id)}
															class="w-full cursor-pointer rounded-lg p-3 text-center text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
															style="background-color: {badgeColor}dd;"
														>
															{formatTime(shift.start_time)}-{formatTime(shift.end_time)}
														</button>
													{:else if shift.shift_type === SHIFT_TYPE.SICK_LEAVE}
														<button
															type="button"
															onclick={() => getShiftInformation(shift.id)}
															class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-orange-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-orange-500/90 hover:shadow-lg"
														>
															Άδεια
														</button>
													{:else if shift.shift_type === SHIFT_TYPE.VACATION}
														<button
															type="button"
															onclick={() => getShiftInformation(shift.id)}
															class="w-full flex cursor-pointer items-center justify-center rounded-lg bg-cyan-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-cyan-500/90 hover:shadow-lg"
														>
															Διακοπές
														</button>
													{/if}
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- No Schedule Found -->
				<div
					class="flex min-h-[400px] items-center justify-center rounded-xl bg-card p-12 shadow-sm"
				>
					<div class="text-center">
						<Calendar class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">Δεν υπάρχει διαθέσιμο πρόγραμμα</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							Δεν έχει δημοσιευτεί πρόγραμμα για αυτή την εβδομάδα
						</p>
					</div>
				</div>
			{/if}
		{:catch error}
			<!-- Error State -->
			<div class="flex min-h-[400px] items-center justify-center rounded-xl bg-card p-12 shadow-sm">
				<div class="text-center">
					<Calendar class="mx-auto h-12 w-12 text-destructive" />
					<h3 class="mt-4 text-lg font-semibold">Σφάλμα φόρτωσης προγράμματος</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Παρουσιάστηκε σφάλμα κατά τη φόρτωση του προγράμματος
					</p>
				</div>
			</div>
		{/await}
	</main>
</div>