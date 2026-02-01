<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Calendar } from 'lucide-svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import {
		authenticatedAccess,
		getSchedulesWithMetricsPaginated,
		createSchedule,
		deleteSchedule,
		updateScheduleStatus,
		copySchedule,
		getScheduleCalendarOverview,
		type ScheduleWithMetrics
	} from './data.remote';
	import { goto } from '$app/navigation';
	import type { ScheduleStatus } from '$lib/models/schedule.types';
	import { SvelteDate } from 'svelte/reactivity';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { toast } from 'svelte-sonner';
	import ScheduleCard from './components/ScheduleCard.svelte';
	import FilterBar from './components/FilterBar.svelte';
	import EmptyScheduleState from './components/EmptyScheduleState.svelte';
	import CopyScheduleModal from './components/CopyScheduleModal.svelte';
	import MiniCalendar from './components/MiniCalendar.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';

	// Pagination state
	let currentPage = $state(1);
	let perPage = $state(9);
	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.susscess) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	// Fetch schedules with pagination
	let schedulesQuery = $derived.by(() =>
		getSchedulesWithMetricsPaginated({ page: currentPage, perPage })
	);

	// Calendar year state
	let calendarYear = $state(new Date().getFullYear());
	let calendarOverview = $derived(getScheduleCalendarOverview({ year: calendarYear }));

	// Modal state
	let isCreateModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let isCopyModalOpen = $state(false);
	let scheduleToDelete = $state<ScheduleWithMetrics | null>(null);
	let scheduleToCopy = $state<ScheduleWithMetrics | null>(null);

	// Form state - separate week_start_date for reactivity
	let weekStartDate = $state('');
	let formData = $derived.by(() => {
		if (!weekStartDate) {
			return {
				week_start_date: '',
				week_end_date: '',
				year: new SvelteDate().getFullYear()
			};
		}

		const startDate = new SvelteDate(weekStartDate);
		const endDate = new SvelteDate(startDate);
		endDate.setDate(startDate.getDate() + 6);

		return {
			week_start_date: weekStartDate,
			week_end_date: endDate.toISOString().split('T')[0],
			year: startDate.getFullYear()
		};
	});

	// Loading state
	let isCreating = $state(false);
	let isDeleting = $state(false);
	let isCopying = $state(false);
	let isRefreshing = $state(false);

	// Filter state
	let statusFilter = $state('');
	let yearFilter = $state('');
	let searchQuery = $state('');

	// Get schedules and calculate available years
	let allSchedules = $derived(schedulesQuery.current?.schedules ?? []);
	let totalCount = $derived(schedulesQuery.current?.totalCount ?? 0);
	let totalPages = $derived(schedulesQuery.current?.totalPages ?? 0);

	let availableYears = $derived.by(() => {
		const years = new Set(allSchedules.map((s) => s.year));
		return Array.from(years).sort((a, b) => b - a);
	});

	// Filtered schedules
	let filteredSchedules = $derived.by(() => {
		let schedules = allSchedules;

		// Filter by status
		if (statusFilter) {
			schedules = schedules.filter((s) => s.status === statusFilter);
		}

		// Filter by year
		if (yearFilter) {
			schedules = schedules.filter((s) => s.year === parseInt(yearFilter));
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			schedules = schedules.filter((s) => {
				const startDate = formatDate(s.week_start_date).toLowerCase();
				const endDate = formatDate(s.week_end_date).toLowerCase();
				const year = s.year.toString();
				return startDate.includes(query) || endDate.includes(query) || year.includes(query);
			});
		}

		return schedules;
	});

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('el-GR', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Handle status change with proper typing
	async function handleStatusChange(scheduleId: number, newStatus: string) {
		const result = await updateScheduleStatus({
			scheduleId,
			status: newStatus as ScheduleStatus
		});

		if (result.success) {
			showSuccessToast('Επιτυχία', result.message);
			await schedulesQuery.refresh();
			await calendarOverview.refresh();
		} else {
			showFailToast('Σφάλμα', result.message || 'Αποτυχία ενημέρωσης κατάστασης');
		}
	}

	// Handle preview (placeholder for now)
	function handlePreview(scheduleId: number) {
		console.log('Preview schedule:', scheduleId);
		showSuccessToast('Σύντομα', 'Η προεπισκόπηση θα υλοποιηθεί σύντομα');
	}

	// Reset form helper
	function resetForm() {
		weekStartDate = '';
	}

	// Handle create schedule
	async function handleCreateSchedule() {
		if (!formData.week_start_date || !formData.week_end_date) {
			showFailToast('Σφάλμα Επικύρωσης', 'Επιλέξτε ημερομηνία έναρξης εβδομάδας');
			return;
		}

		isCreating = true;
		try {
			const result = await createSchedule({
				week_start_date: formData.week_start_date,
				week_end_date: formData.week_end_date,
				year: formData.year
			});

			if (result.success && result.schedule) {
				isCreateModalOpen = false;
				resetForm();
				schedulesQuery.refresh();
				calendarOverview.refresh();
				showSuccessToast('Επιτυχία', 'Το πρόγραμμα δημιουργήθηκε');
				goto(`/app/settings/schedule_settings/${result.schedule.id}`);
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία δημιουργίας προγράμματος');
			}
		} catch (error) {
			console.error('Error creating schedule:', error);
			showFailToast('Σφάλμα', 'Παρουσιάστηκε απρόσμενο σφάλμα');
		} finally {
			isCreating = false;
		}
	}

	// Handle delete schedule
	async function handleDeleteSchedule() {
		if (!scheduleToDelete) return;

		isDeleting = true;
		try {
			const result = await deleteSchedule({ scheduleId: scheduleToDelete.id });

			if (result.success) {
				isDeleteModalOpen = false;
				scheduleToDelete = null;
				showSuccessToast('Επιτυχία', result.message);
				schedulesQuery.refresh();
				calendarOverview.refresh();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία διαγραφής προγράμματος');
			}
		} catch (error) {
			console.error('Error deleting schedule:', error);
			showFailToast('Σφάλμα', 'Παρουσιάστηκε απρόσμενο σφάλμα');
		} finally {
			isDeleting = false;
		}
	}

	// Handle copy schedule
	async function handleCopySchedule(targetWeekStart: string) {
		if (!scheduleToCopy) return;

		isCopying = true;
		try {
			const result = await copySchedule({
				sourceScheduleId: scheduleToCopy.id,
				targetWeekStart
			});

			if (result.success && result.schedule) {
				isCopyModalOpen = false;
				scheduleToCopy = null;
				showSuccessToast('Επιτυχία', result.message);
				schedulesQuery.refresh();
				calendarOverview.refresh();
				goto(`/app/settings/schedule_settings/${result.schedule.id}`);
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία αντιγραφής προγράμματος');
			}
		} catch (error) {
			console.error('Error copying schedule:', error);
			showFailToast('Σφάλμα', 'Παρουσιάστηκε απρόσμενο σφάλμα');
		} finally {
			isCopying = false;
		}
	}

	// Handle edit schedule
	function handleEditSchedule(scheduleId: number) {
		goto(`/app/settings/schedule_settings/${scheduleId}`);
	}

	// Handle delete click with proper typing
	function handleDeleteClick(schedule: ScheduleWithMetrics) {
		scheduleToDelete = schedule;
		isDeleteModalOpen = true;
	}

	// Handle copy click
	function handleCopyClick(schedule: ScheduleWithMetrics) {
		scheduleToCopy = schedule;
		isCopyModalOpen = true;
	}

	// Handle refresh
	async function handleRefresh() {
		isRefreshing = true;
		try {
			await schedulesQuery.refresh();
			await calendarOverview.refresh();
		} catch (error) {
			console.error('Error refreshing schedules:', error);
			showFailToast('Σφάλμα', 'Αποτυχία ανανέωσης προγραμμάτων');
		} finally {
			isRefreshing = false;
		}
	}

	// Handle clear filters
	function handleClearFilters() {
		statusFilter = '';
		yearFilter = '';
		searchQuery = '';
	}

	// Handle modal close
	function handleModalClose() {
		isCreateModalOpen = false;
		resetForm();
	}

	// Handle delete modal close
	function handleDeleteModalClose() {
		isDeleteModalOpen = false;
		scheduleToDelete = null;
	}

	// Handle copy modal close
	function handleCopyModalClose() {
		isCopyModalOpen = false;
		scheduleToCopy = null;
	}

	// Handle calendar week click
	function handleCalendarWeekClick(scheduleId: number) {
		goto(`/app/settings/schedule_settings/${scheduleId}`);
	}

	// Handle empty week click from calendar
	function handleEmptyWeekClick(weekStart: string) {
		weekStartDate = weekStart;
		isCreateModalOpen = true;
	}

	// Handle year change in calendar
	function handleYearChange(year: number) {
		calendarYear = year;
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="container mx-auto space-y-6 px-6 py-6">
		<!-- Header -->
		<div class="animate-in fade-in slide-in-from-top-4 duration-500">
			<h1 class="text-3xl font-bold tracking-tight">Διαχείριση Προγραμμάτων</h1>
			<p class="text-muted-foreground">
				Δημιουργήστε και διαχειριστείτε εβδομαδιαία προγράμματα βαρδιών για την ομάδα σας
			</p>
		</div>

		<!-- Mini Calendar -->
		{#await calendarOverview}
			<Skeleton class="h-48 w-full rounded-xl" />
		{:then calendarResult}
			{#if calendarResult.success}
				<MiniCalendar
					schedules={calendarResult.schedules}
					currentYear={calendarYear}
					onYearChange={handleYearChange}
					onWeekClick={handleCalendarWeekClick}
					onEmptyWeekClick={handleEmptyWeekClick}
				/>
			{/if}
		{/await}

		<!-- Filter Bar -->
		<FilterBar
			{statusFilter}
			{yearFilter}
			{searchQuery}
			{isRefreshing}
			{availableYears}
			onStatusChange={(value) => (statusFilter = value)}
			onYearChange={(value) => (yearFilter = value)}
			onSearchChange={(value) => (searchQuery = value)}
			onRefresh={handleRefresh}
			onClearFilters={handleClearFilters}
			onCreate={() => (isCreateModalOpen = true)}
		/>

		{#await schedulesQuery}
			<!-- Initial Loading State - Show Skeletons -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(perPage) as _, index (index)}
					<Skeleton class="h-64 rounded-xl" />
				{/each}
			</div>
		{:then result}
			<!-- Schedules Grid -->
			{#if result.success}
				{#if filteredSchedules.length > 0}
					<!-- Results Count -->
					<div class="flex items-center justify-between">
						<p class="text-sm text-muted-foreground">
							Εμφάνιση {filteredSchedules.length} από {totalCount} πρόγραμμα{totalCount !== 1
								? 'τα'
								: ''}
						</p>
					</div>

					<!-- Schedule Cards Grid -->
					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each filteredSchedules as schedule, index (schedule.id)}
							<ScheduleCard
								{schedule}
								{index}
								onEdit={handleEditSchedule}
								onDelete={handleDeleteClick}
								onPreview={handlePreview}
								onStatusChange={handleStatusChange}
								onCopy={handleCopyClick}
							/>
						{/each}
					</div>

					<!-- Pagination -->
					<div class="mt-8 flex justify-center">
						<Pagination.Root count={totalCount} bind:page={currentPage} {perPage}>
							{#snippet children({ pages })}
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.PrevButton>
											<ChevronLeftIcon class="size-4" />
											<span class="hidden sm:block">Προηγούμενη</span>
										</Pagination.PrevButton>
									</Pagination.Item>

									{#each pages as page (page.key)}
										{#if page.type === 'ellipsis'}
											<Pagination.Item>
												<Pagination.Ellipsis />
											</Pagination.Item>
										{:else}
											<Pagination.Item>
												<Pagination.Link {page} isActive={currentPage === page.value}>
													{page.value}
												</Pagination.Link>
											</Pagination.Item>
										{/if}
									{/each}

									<Pagination.Item>
										<Pagination.NextButton>
											<span class="hidden sm:block">Επόμενη</span>
											<ChevronRightIcon class="size-4" />
										</Pagination.NextButton>
									</Pagination.Item>
								</Pagination.Content>
							{/snippet}
						</Pagination.Root>
					</div>
				{:else if totalCount > 0}
					<!-- No Results from Filters -->
					<EmptyScheduleState
						hasSchedules={true}
						onCreateNew={() => (isCreateModalOpen = true)}
					/>
				{:else}
					<!-- No Schedules at All -->
					<EmptyScheduleState
						hasSchedules={false}
						onCreateNew={() => (isCreateModalOpen = true)}
					/>
				{/if}
			{:else}
				<!-- Error state for unsuccessful result -->
				<EmptyScheduleState
					hasSchedules={false}
					onCreateNew={() => (isCreateModalOpen = true)}
				/>
			{/if}
		{:catch error}
			<!-- Error State -->
			<EmptyScheduleState
				hasSchedules={false}
				onCreateNew={() => (isCreateModalOpen = true)}
			/>
		{/await}
	</div>
{/if}

<!-- Create Schedule Modal -->
<Dialog bind:open={isCreateModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Calendar class="h-5 w-5 text-primary" />
				Νέο Πρόγραμμα
			</DialogTitle>
			<DialogDescription>
				Επιλέξτε την ημερομηνία έναρξης της εβδομάδας. Η εβδομάδα θα διαρκεί αυτόματα 7 ημέρες.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="week_start_date">Ημερομηνία Έναρξης Εβδομάδας</Label>
				<InputCalendar id="week_start_date" bind:value={weekStartDate} required />
			</div>

			<div class="space-y-2">
				<Label for="week_end_date">Ημερομηνία Λήξης Εβδομάδας</Label>
				<Input id="week_end_date" type="date" value={formData.week_end_date} disabled />
				<p class="text-sm text-muted-foreground">
					Υπολογίζεται αυτόματα ως 6 ημέρες μετά την έναρξη
				</p>
			</div>

			<div class="space-y-2">
				<Label for="year">Έτος</Label>
				<Input id="year" type="number" value={formData.year} disabled />
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleModalClose} disabled={isCreating}>Ακύρωση</Button>
			<Button onclick={handleCreateSchedule} disabled={isCreating || !weekStartDate}>
				{#if isCreating}
					<Spinner />
					Δημιουργία...
				{:else}
					Δημιουργία Προγράμματος
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Modal -->
<Dialog bind:open={isDeleteModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle class="text-destructive">Διαγραφή Προγράμματος</DialogTitle>
			<DialogDescription>
				Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα; Θα διαγραφούν επίσης όλες οι
				βάρδιες που σχετίζονται με αυτό. Η ενέργεια αυτή δεν μπορεί να αναιρεθεί.
			</DialogDescription>
		</DialogHeader>

		{#if scheduleToDelete}
			<div class="py-4">
				<div class="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p class="font-medium">
						Εβδομάδα {formatDate(scheduleToDelete.week_start_date)}
					</p>
					<p class="text-sm text-muted-foreground">
						{formatDate(scheduleToDelete.week_start_date)} - {formatDate(
							scheduleToDelete.week_end_date
						)}
					</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{scheduleToDelete.employee_count} εργαζόμενοι · {scheduleToDelete.shift_count} βάρδιες
					</p>
				</div>
			</div>
		{/if}

		<DialogFooter>
			<Button variant="outline" onclick={handleDeleteModalClose} disabled={isDeleting}>
				Ακύρωση
			</Button>
			<Button variant="destructive" onclick={handleDeleteSchedule} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner />
					Διαγραφή...
				{:else}
					Διαγραφή Προγράμματος
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Copy Schedule Modal -->
<CopyScheduleModal
	open={isCopyModalOpen}
	sourceSchedule={scheduleToCopy}
	isLoading={isCopying}
	onClose={handleCopyModalClose}
	onCopy={handleCopySchedule}
/>
