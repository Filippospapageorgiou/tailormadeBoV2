<script lang="ts">
	import {
		authenticatedAccess,
		getEmployees,
		getScheduleWithAllShifts,
		addShift,
		updateShift,
		deleteShift,
		getShiftChanges,
		getAdjacentSchedules,
		bulkAddEmployees,
		getShiftTemplates,
		applyShiftTemplate,
		deleteShiftTemplate,
		createTemplateFromSchedule,
		type ShiftTemplate
	} from './data.remote';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import ScheduleHeader from './components/ScheduleHeader.svelte';
	import ScheduleGrid from './components/ScheduleGrid.svelte';
	import ShiftModal, { type ShiftFormData } from './components/ShiftModal.svelte';
	import ShiftRequests from './components/ShiftRequests.svelte';
	import BulkAddEmployeesModal from './components/BulkAddEmployeesModal.svelte';
	import type {
		Shift,
		ShiftCategory,
		ShiftType,
		ShiftChangeRequestPorfile
	} from '$lib/models/schedule.types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { Download, Users } from 'lucide-svelte';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let auth = authenticatedAccess();
	let allEmployeesQuery = getEmployees();

	// Get schedule ID from route parameter
	let scheduleId = $derived(parseInt(page.params.id!));

	// Fetch schedule with all shifts and assigned employees
	let scheduleQuery = $derived.by(() => {
		if (!scheduleId || isNaN(scheduleId)) return null;
		return getScheduleWithAllShifts({ scheduleId });
	});

	// Fetch adjacent schedules for navigation
	let adjacentQuery = $derived.by(() => {
		if (!scheduleId || isNaN(scheduleId)) return null;
		return getAdjacentSchedules({ scheduleId });
	});

	// Fetch shift change requests
	let shiftChanges = $derived(getShiftChanges({ scheduleId }));
	let shiftRequests: ShiftChangeRequestPorfile[] = $derived(
		shiftChanges.current?.shiftRequests || []
	);


	// Data from queries
	let schedule = $derived(scheduleQuery?.current?.schedule ?? null);
	let employees = $derived(scheduleQuery?.current?.employees ?? []);
	let shifts = $derived(scheduleQuery?.current?.shifts ?? []);
	let allEmployees = $derived(allEmployeesQuery.current?.employees ?? []);

	// Adjacent schedules for navigation
	let previousSchedule = $derived(adjacentQuery?.current?.previous ?? null);
	let nextSchedule = $derived(adjacentQuery?.current?.next ?? null);
	let currentWeekScheduleId = $derived(adjacentQuery?.current?.currentWeekScheduleId ?? null);

	// Modal state
	let shiftModalOpen = $state(false);
	let shiftModalMode = $state<'add' | 'edit'>('add');
	let selectedShift = $state<Shift | null>(null);
	let selectedEmployeeId = $state<string>('');
	let selectedDate = $state<string>('');
	let isLoading = $state(false);

	// Bulk add modal state
	let bulkAddModalOpen = $state(false);
	let isBulkAdding = $state(false);

	// Navigation handler
	function handleBack() {
		goto('/app/settings/schedule_settings');
	}

	// Week navigation handlers
	function handleNavigate(targetScheduleId: number) {
		goto(`/app/settings/schedule_settings/${targetScheduleId}`);
	}

	function handleJumpToCurrentWeek() {
		if (currentWeekScheduleId) {
			goto(`/app/settings/schedule_settings/${currentWeekScheduleId}`);
		} else {
			showFailToast('Δεν βρέθηκε', 'Δεν υπάρχει πρόγραμμα για την τρέχουσα εβδομάδα');
		}
	}

	// Add shift handler - called from day cell dropdown
	function handleAddShiftFromGrid(employeeId: string, date: string) {
		const employee = allEmployees.find((e) => e.id === employeeId);
		if (!employee) return;

		selectedEmployeeId = employeeId;
		selectedDate = date;
		shiftModalMode = 'add';
		selectedShift = null;
		shiftModalOpen = true;
	}

	// Edit shift handler
	function handleEditShift(shift: Shift) {
		selectedShift = shift;
		selectedEmployeeId = shift.user_id;
		shiftModalMode = 'edit';
		shiftModalOpen = true;
	}

	// Delete shift handler
	async function handleDeleteShift(shiftId: number) {
		const result = await deleteShift({ shiftId });

		if (result.success) {
			scheduleQuery?.refresh();
			showSuccessToast('Επιτυχία', result.message);
		} else {
			showFailToast('Σφάλμα', result.message);
		}
	}

	// Close modal handler
	function handleCloseModal() {
		shiftModalOpen = false;
		selectedShift = null;
		selectedEmployeeId = '';
		selectedDate = '';
	}

	// Save shift handler
	async function handleSaveShift(formData: ShiftFormData) {
		const employee = allEmployees.find((e) => e.id === selectedEmployeeId);
		if (!employee) return;

		let result;

		if (shiftModalMode === 'add') {
			isLoading = true;
			if (!scheduleId || isNaN(scheduleId)) return;

			result = await addShift({
				schedule_id: scheduleId,
				user_id: selectedEmployeeId,
				org_id: employee.org_id,
				shift_date: formData.shift_date,
				start_time: formData.start_time,
				end_time: formData.end_time,
				shift_type: formData.shift_type as ShiftType,
				shift_category: formData.shift_category as ShiftCategory,
				break_duration_minutes: formData.break_duration_minutes,
				notes: formData.notes
			});
		} else {
			isLoading = true;
			if (!formData.id) return;

			result = await updateShift({
				id: formData.id,
				shift_date: formData.shift_date,
				start_time: formData.start_time,
				end_time: formData.end_time,
				shift_type: formData.shift_type as ShiftType,
				shift_category: formData.shift_category as ShiftCategory,
				break_duration_minutes: formData.break_duration_minutes,
				notes: formData.notes
			});
		}

		if (result.success) {
			isLoading = false;
			scheduleQuery?.refresh();
			handleCloseModal();
			showSuccessToast('Επιτυχία', result.message);
		} else {
			isLoading = false;
			showFailToast('Σφάλμα', result.message || 'Αποτυχία αποθήκευσης βάρδιας');
		}
	}

	// Bulk add employees handler
	async function handleBulkAddEmployees(employeeIds: string[]) {
		if (!scheduleId || employeeIds.length === 0) return;

		isBulkAdding = true;
		try {
			const result = await bulkAddEmployees({ scheduleId, employeeIds });

			if (result.success) {
				bulkAddModalOpen = false;
				showSuccessToast('Επιτυχία', result.message);
				scheduleQuery?.refresh();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία προσθήκης εργαζομένων');
			}
		} catch (error) {
			console.error('Error bulk adding employees:', error);
			showFailToast('Σφάλμα', 'Παρουσιάστηκε απρόσμενο σφάλμα');
		} finally {
			isBulkAdding = false;
		}
	}


	// Refresh shift requests
	async function refreshRequests() {
		await shiftChanges.refresh();
	}

	// Get employee name for modal title
	let employeeName = $derived(() => {
		if (shiftModalMode === 'edit' && selectedShift) {
			const emp = employees.find((e) => e.id === selectedShift?.user_id);
			return emp?.username;
		}
		const emp = allEmployees.find((e) => e.id === selectedEmployeeId);
		return emp?.username;
	});

	// Available employees for bulk add (not already in schedule)
	let availableEmployeesForBulkAdd = $derived(
		allEmployees.filter((emp) => !employees.find((e) => e.id === emp.id))
	);

	let isExporting = $state(false);

	async function handleExportSchedule() {
		isExporting = true;
		showProgress('Δημιουργία αρχείου Excel...');

		try {
			const response = await fetch('/app/settings/schedule_settings/api/export', {
				method: 'POST',
				body: JSON.stringify({ scheduleId }),
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error('Export failed');
			}

			// Handle file download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const startDate = schedule?.week_start_date
				? new Date(schedule.week_start_date).toISOString().split('T')[0]
				: 'schedule';
			const endDate = schedule?.week_end_date
				? new Date(schedule.week_end_date).toISOString().split('T')[0]
				: 'export';

			a.download = `schedule_${startDate}_${endDate}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			showSuccessToast('Επιτυχία', 'Το πρόγραμμα εξήχθη επιτυχώς');
		} catch (error) {
			console.error('Error exporting schedule:', error);
			showFailToast('Σφάλμα Εξαγωγής', 'Δεν ήταν δυνατή η δημιουργία του αρχείου Excel');
		} finally {
			hideProgress();
			isExporting = false;
		}
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto space-y-6 px-4 pt-4 pb-10 md:px-6">
			<!-- Header with navigation -->
			<ScheduleHeader
				weekStartDate={schedule?.week_start_date ?? ''}
				weekEndDate={schedule?.week_end_date ?? ''}
				onBack={handleBack}
				{previousSchedule}
				{nextSchedule}
				onNavigate={handleNavigate}
				onJumpToCurrentWeek={currentWeekScheduleId ? handleJumpToCurrentWeek : undefined}
			/>

			<!-- Action bar -->
			<div
				class="animate-fade-in slide-in-from-top-4 flex flex-wrap items-center justify-between gap-3
				 rounded-xl border border-border/50 black:border-white/5 black:bg-gradient-to-br black:from-white/[0.02] black:to-transparent p-4 black:backdrop-blur-sm duration-500"
				style="animation-delay: 100ms;"
			>
				<div class="flex items-center gap-2">
					{#if availableEmployeesForBulkAdd.length > 0}
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										onclick={() => (bulkAddModalOpen = true)}
										variant="outline"
									>
										<Users class="h-4 w-4" />
										<span class="hidden sm:inline">Μαζική Προσθήκη</span>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p class="text-xs">
										Προσθήκη {availableEmployeesForBulkAdd.length} διαθέσιμων εργαζομένων
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
				</div>

				<Button
					onclick={handleExportSchedule}
					disabled={isExporting || !schedule}
					class="gap-2 transition-all duration-300 hover:scale-105"
					variant="default"
				>
					<Download class="h-4 w-4" />
					{#if isExporting}
						Εξαγωγή...
					{:else}
						Εξαγωγή Excel
					{/if}
				</Button>
			</div>

			<!-- Main content area with grid and templates panel -->
			<div class="grid gap-6 lg:grid-cols-[1fr,320px]">
				<!-- Schedule Grid -->
				<div class="min-w-0">
					{#if schedule}
						<ScheduleGrid
							{schedule}
							{employees}
							{shifts}
							{allEmployees}
							onAddShift={handleAddShiftFromGrid}
							onEditShift={handleEditShift}
							onDeleteShift={handleDeleteShift}
						/>
					{/if}
				</div>

			</div>

			<!-- Shift Requests -->
			<ShiftRequests {shiftRequests} onSuccess={refreshRequests} />

			<!-- Shift Modal -->
			<ShiftModal
				{isLoading}
				open={shiftModalOpen}
				mode={shiftModalMode}
				shift={selectedShift}
				defaultDate={selectedDate}
				employeeName={employeeName()}
				onClose={handleCloseModal}
				onSave={handleSaveShift}
			/>

			<!-- Bulk Add Employees Modal -->
			<BulkAddEmployeesModal
				open={bulkAddModalOpen}
				availableEmployees={availableEmployeesForBulkAdd}
				isLoading={isBulkAdding}
				onClose={() => (bulkAddModalOpen = false)}
				onAdd={handleBulkAddEmployees}
			/>
		</main>
	</div>
{/if}
