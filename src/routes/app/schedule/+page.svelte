<script lang="ts">
	import { getCurrentSchedule, getShfitInfo } from './data.remote';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift } from '$lib/models/schedule.types';
	import { Calendar, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import ShiftGrid from './ShiftGrid.svelte';
	import ShiftChnageRrquestmodal from './shiftChnageRrquestmodal.svelte';
	import ShiftDetailsModal from './ShiftDetailsModal.svelte';
	import { formatWeekRange } from '$lib/utils';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// State management
	let weekStartDate: string | undefined = $state(undefined);
	let next: boolean | undefined = $state(undefined);
	let prev: boolean | undefined = $state(undefined);
	let selectedEmployeeId = $state<string | null>(null);
	let viewMode = $state<'grid' | 'list'>('grid');

	// Query derived state
	let query = $derived(getCurrentSchedule({ weekStartDate, next, prev }));
	let { data } = $props();
	let user = $derived(data.profile);

	// Modal states
	let isDetailsModalOpen = $state(false);
	let isRequestModalOpen = $state(false);
	let selectedShiftData = $state<Shift | null>(null);
	let loadingShiftDetails = $state(false);
	let isSameUser = $state(false);

	// Derived data with safety checks
	let schedule = $derived(query.current?.schedule ?? null);
	let employees = $derived(query.current?.employees ?? []);
	let shifts = $derived(query.current?.shifts ?? []);
	let hasNextSchedule = $derived(query.current?.hasNextSchedule ?? false);
	let hasPrevSchedule = $derived(query.current?.hasPrevSchedule ?? false);

	// Check if currently viewing "this week" for UI indicators
	let isCurrentWeek = $derived.by(() => {
		if (!schedule) return false;
		const today = new Date();
		const start = new Date(schedule.week_start_date);
		const end = new Date(schedule.week_end_date);
		return today >= start && today <= end;
	});

	// Generate week days with enhanced metadata
	let weekDays = $derived.by(() => {
		if (!schedule) return [];

		const startDate = new Date(schedule.week_start_date);
		const today = new Date().toISOString().split('T')[0];

		const greekDays = {
			short: ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'],
			full: ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή']
		};

		return Array.from({ length: 7 }, (_, i) => {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const dateStr = date.toISOString().split('T')[0];
			const dayOfWeek = (date.getDay() + 6) % 7; // Monday start

			return {
				date: dateStr,
				dayName: greekDays.short[dayOfWeek],
				fullDayName: greekDays.full[dayOfWeek],
				dayNum: date.getDate(),
				month: date.toLocaleString('el-GR', { month: 'short' }),
				isToday: dateStr === today,
				isWeekend: dayOfWeek >= 5,
				shifts: shifts.filter((s) => s.shift_date === dateStr)
			};
		});
	});

	// Stats for the header
	let stats = $derived.by(() => {
		const totalShifts = shifts.length;
		const totalEmployees = employees.length;
		const coverage =
			totalEmployees > 0 ? Math.round((totalShifts / (totalEmployees * 7)) * 100) : 0;
		return { totalShifts, totalEmployees, coverage };
	});

	async function handleShiftClick(shiftId: number) {
		loadingShiftDetails = true;
		isDetailsModalOpen = true;

		try {
			const shiftInfo = await getShfitInfo({ id: shiftId });
			if (shiftInfo.success && shiftInfo.shift) {
				selectedShiftData = shiftInfo.shift;
				if (selectedShiftData?.user_id) {
					isSameUser = selectedShiftData.user_id === user?.id;
				}
			}
		} catch (error) {
			console.error('Failed to load shift:', error);
		} finally {
			loadingShiftDetails = false;
		}
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
		// Optional: Refresh query here
	}

	function handleSelectEmployee(employee: Profile) {
		selectedEmployeeId = selectedEmployeeId === employee.id ? null : employee.id;
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

	function resetFilters() {
		selectedEmployeeId = null;
		viewMode = 'grid';
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<main class="container mx-auto space-y-6 px-4 pt-6 pb-10 md:px-6 lg:px-8">
		{#await query}
			<!-- Enhanced Loading State -->
			<div class="space-y-6" in:fade>
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div class="space-y-2">
						<Skeleton class="h-10 w-64" />
						<Skeleton class="h-5 w-48" />
					</div>
					<div class="flex gap-2">
						<Skeleton class="h-10 w-10" />
						<Skeleton class="h-10 w-10" />
					</div>
				</div>
				<div class="rounded-xl border border-border/50 bg-card shadow-sm">
					<Skeleton class="h-96 w-full" />
				</div>
			</div>
		{:then result}
			{#if result.success && schedule}
				<div class="space-y-6" in:fly={{ y: 20, duration: 400, easing: quintOut }}>
					<!-- Enhanced Header -->
					<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div class="space-y-2">
							<div class="flex items-center gap-3">
								<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
									Εβδομαδιαίο πρόγραμμα
								</h1>
								{#if isCurrentWeek}
									<Badge variant="secondary" class="bg-primary/10 text-primary hover:bg-primary/20">
										Τρέχουσα εβδομάδα
									</Badge>
								{/if}
							</div>
							<p class="flex items-center gap-2 text-lg text-muted-foreground">
								<Calendar class="h-4 w-4" />
								{formatWeekRange(schedule.week_start_date, schedule.week_end_date)}
							</p>
						</div>

						<!-- Stats Cards (Desktop) -->
						<div class="hidden gap-4 text-sm md:flex">
							<div class="rounded-lg bg-muted px-4 py-2 text-center">
								<div class="font-semibold text-foreground">{stats.totalEmployees}</div>
								<div class="text-xs text-muted-foreground">Εργαζόμενοι</div>
							</div>
							<div class="rounded-lg bg-muted px-4 py-2 text-center">
								<div class="font-semibold text-foreground">{stats.totalShifts}</div>
								<div class="text-xs text-muted-foreground">Βάρδιες</div>
							</div>
							<div class="rounded-lg bg-muted px-4 py-2 text-center">
								<div class="font-semibold text-foreground">{stats.coverage}%</div>
								<div class="text-xs text-muted-foreground">Κάλυψη</div>
							</div>
						</div>
					</div>

					<!-- Controls Bar -->
					<div
						class="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
					>
						<!-- Filter Status -->
						<div class="flex items-center gap-2">
							{#if selectedEmployeeId}
								<div class="flex items-center gap-2" in:fly={{ x: -10 }}>
									<Filter class="h-4 w-4 text-primary" />
									<span class="text-sm font-medium">
										Φίλτρο: {employees.find((e) => e.id === selectedEmployeeId)?.username}
									</span>
									<Button variant="ghost" size="sm" class="h-6 px-2" onclick={resetFilters}>
										<RotateCcw class="h-3 w-3" />
									</Button>
								</div>
							{:else}
								<span class="text-sm text-muted-foreground">Εμφάνιση όλων των εργαζομένων</span>
							{/if}
						</div>

						<!-- Navigation -->
						<div class="flex items-center justify-between gap-2 sm:justify-end">
							<Button
								variant="outline"
								size="sm"
								onclick={handlePrevWeek}
								disabled={!hasPrevSchedule}
								class="gap-1"
							>
								<ChevronLeft class="h-4 w-4" />
								<span class="hidden sm:inline">Προηγούμενη</span>
							</Button>

							<Button
								variant="outline"
								size="sm"
								onclick={handleNextWeek}
								disabled={!hasNextSchedule}
								class="gap-1"
							>
								<span class="hidden sm:inline">Επόμενη</span>
								<ChevronRight class="h-4 w-4" />
							</Button>
						</div>
					</div>

					<!-- Schedule Grid -->
					<div class="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
						<ShiftGrid
							{weekDays}
							{employees}
							{shifts}
							{selectedEmployeeId}
							{isCurrentWeek}
							onEmployeeSelect={handleSelectEmployee}
							onShiftClick={handleShiftClick}
						/>
					</div>
				</div>
			{:else}
				<!-- Empty State -->
				<div
					class="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-12"
					in:fade
				>
					<div class="max-w-md text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
						>
							<Calendar class="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 class="text-xl font-semibold text-foreground">Δεν υπάρχει διαθέσιμο πρόγραμμα</h3>
						<p class="mt-2 text-muted-foreground">
							Δεν έχει δημοσιευτεί πρόγραμμα για αυτή την εβδομάδα. Επικοινωνήστε με τον
							διαχειριστή.
						</p>
						<Button variant="outline" class="mt-6" onclick={handlePrevWeek}>
							Προηγούμενη εβδομάδα
						</Button>
					</div>
				</div>
			{/if}
		{:catch error}
			<!-- Error State -->
			<div
				class="flex min-h-[500px] items-center justify-center rounded-2xl border border-destructive/50 bg-destructive/5 p-12"
				in:fade
			>
				<div class="max-w-md text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
					>
						<Calendar class="h-8 w-8 text-destructive" />
					</div>
					<h3 class="text-xl font-semibold text-foreground">Σφάλμα φόρτωσης</h3>
					<p class="mt-2 text-muted-foreground">
						Παρουσιάστηκε σφάλμα κατά τη φόρτωση του προγράμματος. Παρακαλώ δοκιμάστε ξανά.
					</p>
					<Button variant="outline" class="mt-6" onclick={() => window.location.reload()}>
						Ανανέωση σελίδας
					</Button>
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
