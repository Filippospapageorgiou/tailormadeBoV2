<script lang="ts">
	import { getCurrentSchedule, getShfitInfo } from './data.remote';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import {
		Calendar,
		ChevronLeft,
		ChevronRight,
		Users,
		Clock,
		Check,
		X,
		MapPin,
		Coffee,
		StickyNote,
		Briefcase,
		Flag
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import ShiftChnageRrquestmodal from './shiftChnageRrquestmodal.svelte';

	let query = getCurrentSchedule();
	let { data } = $props();
	let { user } = data;

	let isRequestModalOpen = $state(false);
	let requestShiftData = $state<any>(null);
	let schedule = $derived(query.current?.schedule ?? null);
	let employees = $derived(query.current?.employees ?? []);
	let shifts = $derived(query.current?.shifts ?? []);
	let employeeHours = $derived(query.current?.employeeHours ?? {});
	let totalHours = $derived(query.current?.totalHours ?? 0);
	let averageHours = $derived(query.current?.averageHours ?? 0);

	// Selected employee state
	let selectedEmployeeId = $state<string | null>(null);

	// Modal state
	let isModalOpen = $state(false);
	let selectedShiftData = $state<any>(null);
	let loadingShiftDetails = $state(false);

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
	let isSameUser: boolean = $state(false);
	async function getShiftInformation(id: number) {
		loadingShiftDetails = true;
		isModalOpen = true;

		const shiftInfo = await getShfitInfo({ id });

		if (shiftInfo.success && shiftInfo.shift) {
			selectedShiftData = shiftInfo.shift;
			if (selectedShiftData.user_id === user?.id) isSameUser = true;
		}

		loadingShiftDetails = false;
	}

	function closeModal() {
		isModalOpen = false;
		selectedShiftData = null;
		isSameUser = false;
	}

	function openRequestModal() {
		if (selectedShiftData) {
			requestShiftData = selectedShiftData;
			isModalOpen = false; // Close the shift details modal
			isRequestModalOpen = true; // Open the request modal
		}
	}

	function handleRequestSuccess() {
		isRequestModalOpen = false;
		requestShiftData = null;
	}

	// Format date to Greek
	function formatGreekDate(dateString: string): string {
		const date = new Date(dateString);
		const dayOfWeek = (date.getDay() + 6) % 7;
		const dayName = fullGreekDayNames[dayOfWeek];
		const day = date.getDate();
		const monthNames = [
			'Ιανουαρίου',
			'Φεβρουαρίου',
			'Μαρτίου',
			'Απριλίου',
			'Μαΐου',
			'Ιουνίου',
			'Ιουλίου',
			'Αυγούστου',
			'Σεπτεμβρίου',
			'Οκτωβρίου',
			'Νοεμβρίου',
			'Δεκεμβρίου'
		];
		const month = monthNames[date.getMonth()];

		return `${dayName}, ${day} ${month}`;
	}

	// Get shift type label
	function getShiftTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			work: 'Εργασία',
			day_off: 'Ρεπό',
			sick_leave: 'Άδεια Ασθενείας',
			vacation: 'Διακοπές'
		};
		return labels[type] || type;
	}

	// Get shift category label
	function getShiftCategoryLabel(category: string | null): string {
		if (!category) return '';
		const labels: Record<string, string> = {
			morning: 'Πρωινή',
			afternoon: 'Απογευματινή',
			night: 'Νυχτερινή',
			full_day: 'Ολοήμερη'
		};
		return labels[category] || category;
	}

	// Calculate shift duration
	function calculateShiftDuration(
		startTime: string | null,
		endTime: string | null,
		breakMinutes: number | null
	): string {
		if (!startTime || !endTime) return 'N/A';

		const [startHour, startMin] = startTime.split(':').map(Number);
		const [endHour, endMin] = endTime.split(':').map(Number);

		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;

		const totalMinutes = endMinutes - startMinutes;

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		return `${hours}ω ${minutes > 0 ? `${minutes}λ` : ''}`;
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
			const dayShifts = shifts.filter((s) => {
				// First filter by date
				const matchesDate = s.shift_date === dateStr;

				// Then filter by selected employee (if any)
				const matchesEmployee = selectedEmployeeId ? s.user_id === selectedEmployeeId : true;

				return matchesDate && matchesEmployee;
			});

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
											<Avatar.Root
												class="h-24 w-24 shadow-md"
												style="border: 3px solid {badgeColor};"
											>
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
														class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-red-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-red-500/90 hover:shadow-lg"
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
														class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-orange-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-orange-500/90 hover:shadow-lg"
													>
														Άδεια
													</button>
												{:else if shift.shift_type === SHIFT_TYPE.VACATION}
													<button
														onclick={() => getShiftInformation(shift.id)}
														class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-cyan-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-cyan-500/90 hover:shadow-lg"
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
															class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-red-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-red-500/90 hover:shadow-lg"
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
															class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-orange-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-orange-500/90 hover:shadow-lg"
														>
															Άδεια
														</button>
													{:else if shift.shift_type === SHIFT_TYPE.VACATION}
														<button
															type="button"
															onclick={() => getShiftInformation(shift.id)}
															class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-cyan-500/80 p-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-cyan-500/90 hover:shadow-lg"
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

<!-- Shift Details Modal -->
<Dialog.Root bind:open={isModalOpen}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		{#if loadingShiftDetails}
			<div class="flex flex-col items-center justify-center py-12">
				<div
					class="h-12 w-12 animate-spin-clockwise rounded-full border-4 border-primary border-t-transparent"
				></div>
				<p class="mt-4 text-sm text-muted-foreground">Φόρτωση στοιχείων βάρδιας...</p>
			</div>
		{:else if selectedShiftData}
			{@const employee = selectedShiftData.profiles}
			{@const badgeColor = employee?.badge_color || '#3b82f6'}
			{@const initials = getInitials(employee?.username || '')}

			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-3 text-2xl">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg"
						style="background-color: {badgeColor}22;"
					>
						<Briefcase class="h-5 w-5" style="color: {badgeColor};" />
					</div>
					Λεπτομέρειες Βάρδιας
				</Dialog.Title>
				<Dialog.Description class="text-muted-foreground">
					{formatGreekDate(selectedShiftData.shift_date)}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6 py-6">
				<!-- Employee Info Card -->
				<div class="rounded-xl border bg-card p-6">
					<div class="flex items-center gap-4">
						<Avatar.Root class="h-16 w-16 shadow-md" style="border: 3px solid {badgeColor};">
							<Avatar.Image src={employee?.image_url} alt={employee?.username} />
							<Avatar.Fallback
								class="text-xl font-bold text-white"
								style="background-color: {badgeColor};"
							>
								{initials}
							</Avatar.Fallback>
						</Avatar.Root>

						<div class="flex-1">
							<h3 class="text-lg font-semibold">{employee?.username}</h3>
							<p class="text-sm text-muted-foreground">{employee?.email}</p>
							<Badge
								class="mt-2 text-xs"
								style="background-color: {badgeColor}; color: white; border: none;"
							>
								{employee?.role_name || 'Employee'}
							</Badge>
						</div>
					</div>
				</div>

				<!-- Shift Details Grid -->
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Shift Type -->
					<div class="rounded-xl border bg-card p-4">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
								style="background-color: {badgeColor}22;"
							>
								<Briefcase class="h-5 w-5" style="color: {badgeColor};" />
							</div>
							<div class="flex-1">
								<p class="text-sm text-muted-foreground">Τύπος Βάρδιας</p>
								<p class="mt-1 font-semibold">{getShiftTypeLabel(selectedShiftData.shift_type)}</p>
								{#if selectedShiftData.shift_category}
									<Badge variant="outline" class="mt-2 text-xs">
										{getShiftCategoryLabel(selectedShiftData.shift_category)}
									</Badge>
								{/if}
							</div>
						</div>
					</div>

					<!-- Time Range -->
					{#if selectedShiftData.shift_type === 'work' && selectedShiftData.start_time && selectedShiftData.end_time}
						<div class="rounded-xl border bg-card p-4">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10"
								>
									<Clock class="h-5 w-5 text-blue-600" />
								</div>
								<div class="flex-1">
									<p class="text-sm text-muted-foreground">Ώρες Εργασίας</p>
									<p class="mt-1 text-lg font-semibold">
										{formatTime(selectedShiftData.start_time)} - {formatTime(
											selectedShiftData.end_time
										)}
									</p>
								</div>
							</div>
						</div>

						<!-- Break Duration -->
						{#if selectedShiftData.break_duration_minutes}
							<div class="rounded-xl border bg-card p-4">
								<div class="flex items-start gap-3">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10"
									>
										<Coffee class="h-5 w-5 text-amber-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm text-muted-foreground">Διάλειμμα</p>
										<p class="mt-1 font-semibold">
											{selectedShiftData.break_duration_minutes} λεπτά
										</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- Total Duration -->
						<div class="rounded-xl border bg-card p-4">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10"
								>
									<Clock class="h-5 w-5 text-green-600" />
								</div>
								<div class="flex-1">
									<p class="text-sm text-muted-foreground">Καθαρές Ώρες</p>
									<p class="mt-1 text-lg font-semibold">
										{calculateShiftDuration(
											selectedShiftData.start_time,
											selectedShiftData.end_time,
											selectedShiftData.break_duration_minutes
										)}
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Notes Section -->
				{#if selectedShiftData.notes}
					<div class="rounded-xl border bg-card p-4">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10"
							>
								<StickyNote class="h-5 w-5 text-purple-600" />
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-muted-foreground">Σημειώσεις</p>
								<p class="mt-2 text-sm leading-relaxed">{selectedShiftData.notes}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Metadata -->
				<div class="rounded-xl border bg-muted/30 p-4">
					<div class="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
						<div>
							<span class="font-medium">Δημιουργήθηκε:</span>
							<span class="ml-2">
								{new Date(selectedShiftData.created_at).toLocaleDateString('el-GR', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
						<div>
							<span class="font-medium">Τελευταία ενημέρωση:</span>
							<span class="ml-2">
								{new Date(selectedShiftData.updated_at).toLocaleDateString('el-GR', {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
					</div>
				</div>
			</div>

			<Dialog.Footer>
				{#if isSameUser}
					<Button
						variant="default"
						onclick={openRequestModal}
						class="w-full gap-2 bg-amber-600 hover:bg-amber-700 md:w-auto"
					>
						<Flag class="h-4 w-4" />
						Αίτημα Αλλαγής
					</Button>
				{/if}
				<Button variant="outline" onclick={closeModal} class="w-full md:w-auto">Κλείσιμο</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<ShiftChnageRrquestmodal
	bind:open={isRequestModalOpen}
	shiftData={requestShiftData}
	onSuccess={handleRequestSuccess}
/>
