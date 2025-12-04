<script lang="ts">
	import { getCurrentSchedule, getShfitInfo } from './data.remote';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import ShiftGrid from './ShiftGrid.svelte';
	import ShiftChnageRrquestmodal from './shiftChnageRrquestmodal.svelte';
	import ShiftDetailsModal from './ShiftDetailsModal.svelte';
	import { formatWeekRange } from '$lib/utils';

	let weekStartDate: string | undefined = $state(undefined);
	let next: boolean | undefined = $state(undefined);
	let prev: boolean | undefined = $state(undefined);

	let query = $derived(getCurrentSchedule({ weekStartDate, next, prev }));
	let { data } = $props();
	let { user } = data;

	let isDetailsModalOpen = $state(false);
	let isRequestModalOpen = $state(false);
	let selectedShiftData = $state<any>(null);
	let loadingShiftDetails = $state(false);
	let isSameUser = $state(false);

	let schedule = $derived(query.current?.schedule ?? null);
	let employees = $derived(query.current?.employees ?? []);
	let shifts = $derived(query.current?.shifts ?? []);
	let hasNextSchedule = $derived(query.current?.hasNextSchedule ?? false);
	let hasPrevSchedule = $derived(query.current?.hasPrevSchedule ?? false);
	let selectedEmployeeId = $state<string | null>(null);

	// Generate week days from schedule
	let weekDays = $derived.by(() => {
		if (!schedule) return [];

		const startDate = new Date(schedule.week_start_date);
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

		const days = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const dateStr = date.toISOString().split('T')[0];
			const dayOfWeek = (date.getDay() + 6) % 7;
			const dayName = greekDayNames[dayOfWeek];
			const fullDayName = fullGreekDayNames[dayOfWeek];
			const dayNum = date.getDate();

			days.push({
				date: dateStr,
				dayName,
				fullDayName,
				dayNum,
				shifts: shifts.filter((s) => s.shift_date === dateStr)
			});
		}

		return days;
	});

	async function handleShiftClick(shiftId: number) {
		loadingShiftDetails = true;
		isDetailsModalOpen = true;

		const shiftInfo = await getShfitInfo({ id: shiftId });

		if (shiftInfo.success && shiftInfo.shift) {
			selectedShiftData = shiftInfo.shift;
			isSameUser = selectedShiftData.user_id === user?.id;
		}

		loadingShiftDetails = false;
	}

	function handleCloseDetailsModal() {
		isDetailsModalOpen = false;
		selectedShiftData = null;
		isSameUser = false;
	}

	function handleOpenRequestModal() {
		if (selectedShiftData) {
			isDetailsModalOpen = false;
			isRequestModalOpen = true;
		}
	}

	function handleRequestSuccess() {
		isRequestModalOpen = false;
		selectedShiftData = null;
	}

	function handleSelectEmployee(employee: Profile) {
		if (selectedEmployeeId === employee.id) {
			selectedEmployeeId = null;
		} else {
			selectedEmployeeId = employee.id;
		}
	}

	function handleNextWeek() {
		if (schedule) {
			weekStartDate = schedule.week_start_date;
			next = true;
			prev = false;
		}
	}

	function handlePrevWeek() {
		if (schedule) {
			weekStartDate = schedule.week_start_date;
			next = false;
			prev = true;
		}
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto space-y-6 px-4 pt-6 pb-10 md:px-6">
		{#await query}
			<!-- Loading State -->
			<div class="space-y-6">
				<Skeleton class="h-20 w-full" />
				<Skeleton class="h-96 w-full" />
			</div>
		{:then result}
			{#if result.success && schedule}
				<div class="mb-12">
					<h1 class="font-mono text-4xl tracking-wider text-neutral-800">Weekly schedule</h1>
					<p class="py-1 text-lg text-[#8B6B4A]">
						{formatWeekRange(schedule.week_start_date, schedule.week_end_date)}
					</p>
				</div>
				<!-- Navigation -->
				<div class="flex items-center gap-2 md:justify-end">
					<Button
						variant="outline"
						size="icon"
						onclick={handlePrevWeek}
						disabled={!hasPrevSchedule}
					>
						<ChevronLeft class="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm" disabled>Προηγ.</Button>
					<Button variant="outline" size="sm" disabled>Επόμ.</Button>
					<Button
						variant="outline"
						size="icon"
						onclick={handleNextWeek}
						disabled={!hasNextSchedule}
					>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>

				<!-- Schedule Grid -->
				<div class="space-y-4">
					<ShiftGrid
						{weekDays}
						{employees}
						{shifts}
						{selectedEmployeeId}
						onEmployeeSelect={handleSelectEmployee}
						onShiftClick={handleShiftClick}
					/>
				</div>
			{:else}
				<!-- No Schedule Found -->
				<div class="flex min-h-[400px] items-center justify-center rounded-xl p-12">
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
			<div class="flex min-h-[400px] items-center justify-center rounded-xl p-12">
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

<!-- Modals -->
<ShiftDetailsModal
	open={isDetailsModalOpen}
	{selectedShiftData}
	{loadingShiftDetails}
	{isSameUser}
	onClose={handleCloseDetailsModal}
	onOpenRequest={handleOpenRequestModal}
/>

<ShiftChnageRrquestmodal
	bind:open={isRequestModalOpen}
	shiftData={selectedShiftData}
	onSuccess={handleRequestSuccess}
/>
