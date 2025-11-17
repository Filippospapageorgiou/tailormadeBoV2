<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
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
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Pagination from '$lib/components/ui/pagination';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import {
		authenticatedAccess,
		getSchedulesWithMetricsPaginated,
		createSchedule,
		deleteSchedule,
		updateScheduleStatus
	} from './data.remote';
	import { goto } from '$app/navigation';
	import type { WeeklySchedule, ScheduleStatus } from '$lib/models/schedule.types';
	import { SvelteDate } from 'svelte/reactivity';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';

	import ScheduleCard from './components/ScheduleCard.svelte';
	import FilterBar from './components/FilterBar.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';

	// Pagination state
	let currentPage = $state(1);
	let perPage = $state(9);
	let auth = authenticatedAccess();

	// Fetch schedules with pagination
	let schedulesQuery = $derived.by(() =>
		getSchedulesWithMetricsPaginated({ page: currentPage, perPage })
	);

	// Modal state
	let isCreateModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let scheduleToDelete = $state<WeeklySchedule | null>(null);

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
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Handle status change with proper typing
	async function handleStatusChange(scheduleId: number, newStatus: string) {
		const result = await updateScheduleStatus({
			scheduleId,
			status: newStatus as ScheduleStatus
		});

		if (result.success) {
			showSuccessToast('Success', result.message);
			await schedulesQuery.refresh();
		} else {
			showFailToast('Error', result.message || 'Failed to update status');
		}
	}

	// Handle preview (placeholder for now)
	function handlePreview(scheduleId: number) {
		// TODO: Implement preview functionality
		console.log('Preview schedule:', scheduleId);
		showSuccessToast('Coming Soon', 'Preview functionality will be implemented soon');
	}

	// Reset form helper
	function resetForm() {
		weekStartDate = '';
	}

	// Handle create schedule
	async function handleCreateSchedule() {
		if (!formData.week_start_date || !formData.week_end_date) {
			showFailToast('Validation Error', 'Please select a week start date');
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
				showSuccessToast('Success', 'Schedule created successfully');
				goto(`/app/settings/schedule_settings/${result.schedule.id}`);
			} else {
				showFailToast('Error', result.message || 'Failed to create schedule');
			}
		} catch (error) {
			console.error('Error creating schedule:', error);
			showFailToast('Error', 'An unexpected error occurred');
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
				showSuccessToast('Success', result.message);
				schedulesQuery.refresh();
			} else {
				showFailToast('Error', result.message || 'Failed to delete schedule');
			}
		} catch (error) {
			console.error('Error deleting schedule:', error);
			showFailToast('Error', 'An unexpected error occurred');
		} finally {
			isDeleting = false;
		}
	}

	// Handle edit schedule
	function handleEditSchedule(scheduleId: number) {
		goto(`/app/settings/schedule_settings/${scheduleId}`);
	}

	// Handle delete click with proper typing
	function handleDeleteClick(schedule: WeeklySchedule) {
		scheduleToDelete = schedule;
		isDeleteModalOpen = true;
	}

	// Handle refresh
	async function handleRefresh() {
		isRefreshing = true;
		try {
			await schedulesQuery.refresh();
		} catch (error) {
			console.error('Error refreshing schedules:', error);
			showFailToast('Error', 'Failed to refresh schedules');
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
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="container mx-auto space-y-6 px-6 py-6">
		<!-- Header -->
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Schedule Management</h1>
			<p class="text-muted-foreground">Create and manage weekly schedules for your team</p>
		</div>

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
					<Skeleton class="h-64" />
				{/each}
			</div>
		{:then result}
			<!-- Schedules Grid -->
			{#if result.success}
				{#if filteredSchedules.length > 0}
					<!-- Results Count -->
					<div class="flex items-center justify-between">
						<p class="text-sm text-muted-foreground">
							Showing {filteredSchedules.length} of {totalCount} schedule{totalCount !== 1
								? 's'
								: ''}
						</p>
					</div>

					<!-- Schedule Cards Grid -->
					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each filteredSchedules as schedule (schedule.id)}
							<ScheduleCard
								{schedule}
								onEdit={handleEditSchedule}
								onDelete={handleDeleteClick}
								onPreview={handlePreview}
								onStatusChange={handleStatusChange}
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
											<span class="hidden sm:block">Previous</span>
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
											<span class="hidden sm:block">Next</span>
											<ChevronRightIcon class="size-4" />
										</Pagination.NextButton>
									</Pagination.Item>
								</Pagination.Content>
							{/snippet}
						</Pagination.Root>
					</div>
				{:else if totalCount > 0}
					<!-- No Results from Filters -->
					<Card>
						<CardContent class="flex flex-col items-center justify-center py-12">
							<Empty.Root>
								<Empty.Header>
									<Empty.Media variant="icon">
										<Calendar class="h-12 w-12" />
									</Empty.Media>
									<Empty.Title>No schedules found</Empty.Title>
									<Empty.Description>
										No schedules match your current filters. Try adjusting your search criteria.
									</Empty.Description>
								</Empty.Header>
								<Empty.Content>
									<Button variant="outline" onclick={handleClearFilters}>Clear Filters</Button>
								</Empty.Content>
							</Empty.Root>
						</CardContent>
					</Card>
				{:else}
					<!-- No Schedules at All -->
					<Card>
						<CardContent class="flex flex-col items-center justify-center py-12">
							<Empty.Root>
								<Empty.Header>
									<Empty.Media variant="icon">
										<Calendar class="h-12 w-12" />
									</Empty.Media>
									<Empty.Title>No schedules yet</Empty.Title>
									<Empty.Description>
										Create your first weekly schedule to get started
									</Empty.Description>
								</Empty.Header>
								<Empty.Content>
									<Button onclick={() => (isCreateModalOpen = true)}>
										<Calendar class="mr-2 h-4 w-4" />
										Create Schedule
									</Button>
								</Empty.Content>
							</Empty.Root>
						</CardContent>
					</Card>
				{/if}
			{:else}
				<!-- Error state for unsuccessful result -->
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-12">
						<Empty.Root>
							<Empty.Header>
								<Empty.Media variant="icon">
									<Calendar class="h-12 w-12 text-destructive" />
								</Empty.Media>
								<Empty.Title>Error Loading Schedules</Empty.Title>
								<Empty.Description>
									{result.message || 'Failed to load schedules. Please try again.'}
								</Empty.Description>
							</Empty.Header>
							<Empty.Content>
								<Button onclick={handleRefresh} variant="outline">Try Again</Button>
							</Empty.Content>
						</Empty.Root>
					</CardContent>
				</Card>
			{/if}
		{:catch error}
			<!-- Error State -->
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Calendar class="h-12 w-12 text-destructive" />
							</Empty.Media>
							<Empty.Title>Error Loading Schedules</Empty.Title>
							<Empty.Description>
								An unexpected error occurred while loading schedules.
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button onclick={handleRefresh} variant="outline">Try Again</Button>
						</Empty.Content>
					</Empty.Root>
				</CardContent>
			</Card>
		{/await}
	</div>
{/if}

<!-- Create Schedule Modal -->
<Dialog bind:open={isCreateModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Create New Schedule</DialogTitle>
			<DialogDescription>
				Select the week start date. The week will automatically span 7 days.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="week_start_date">Week Start Date</Label>
				<InputCalendar id="week_start_date" bind:value={weekStartDate} required />
			</div>

			<div class="space-y-2">
				<Label for="week_end_date">Week End Date</Label>
				<Input id="week_end_date" type="date" value={formData.week_end_date} disabled />
				<p class="text-sm text-muted-foreground">
					Automatically calculated as 6 days after start date
				</p>
			</div>

			<div class="space-y-2">
				<Label for="year">Year</Label>
				<Input id="year" type="number" value={formData.year} disabled />
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleModalClose} disabled={isCreating}>Cancel</Button>
			<Button onclick={handleCreateSchedule} disabled={isCreating || !weekStartDate}>
				{#if isCreating}
					<Spinner />
					Creating...
				{:else}
					Create Schedule
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Modal -->
<Dialog bind:open={isDeleteModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Schedule</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete this schedule? This will also delete all shifts associated
				with it. This action cannot be undone.
			</DialogDescription>
		</DialogHeader>

		{#if scheduleToDelete}
			<div class="py-4">
				<p class="font-medium">
					Week of {formatDate(scheduleToDelete.week_start_date)}
				</p>
				<p class="text-sm text-muted-foreground">
					{formatDate(scheduleToDelete.week_start_date)} - {formatDate(
						scheduleToDelete.week_end_date
					)}
				</p>
			</div>
		{/if}

		<DialogFooter>
			<Button variant="outline" onclick={handleDeleteModalClose} disabled={isDeleting}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleDeleteSchedule} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner />
					Deleting...
				{:else}
					Delete Schedule
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
