<script lang="ts">
	import {
		authenticatedAccess,
		getEmployees,
		getScheduleWithAllShifts,
		addShift,
		updateShift,
		deleteShift,
		getShiftChanges
	} from './data.remote';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import ScheduleHeader from './components/ScheduleHeader.svelte';
	import ScheduleGrid from './components/ScheduleGrid.svelte';
	import ShiftModal, { type ShiftFormData } from './components/ShiftModal.svelte';
	import ShiftRequests from './components/ShiftRequests.svelte';
	import type { Profile } from '$lib/models/database.types';
	import type {
		Shift,
		ShiftCategory,
		ShiftType,
		ShiftChangeRequestPorfile
	} from '$lib/models/schedule.types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { Download } from 'lucide-svelte';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let auth = authenticatedAccess();
	let allEmployeesQuery = getEmployees(); // All org employees for dropdown

	// Get schedule ID from route parameter
	let scheduleId = $derived(parseInt(page.params.id!));

	// Fetch schedule with all shifts and assigned employees
	let scheduleQuery = $derived.by(() => {
		if (!scheduleId || isNaN(scheduleId)) return null;
		return getScheduleWithAllShifts({ scheduleId });
	});

	// Fetch shift change requests
	let shiftChanges = $derived(getShiftChanges({ scheduleId }));
	let shiftRequests: ShiftChangeRequestPorfile[] = $derived(
		shiftChanges.current?.shiftRequests || []
	);

	// Data from queries
	let schedule = $derived(scheduleQuery?.current?.schedule ?? null);
	let employees = $derived(scheduleQuery?.current?.employees ?? []); // Employees with shifts
	let shifts = $derived(scheduleQuery?.current?.shifts ?? []);
	let allEmployees = $derived(allEmployeesQuery.current?.employees ?? []); // All org employees

	// Modal state
	let shiftModalOpen = $state(false);
	let shiftModalMode = $state<'add' | 'edit'>('add');
	let selectedShift = $state<Shift | null>(null);
	let selectedEmployeeId = $state<string>('');
	let selectedDate = $state<string>('');
	let isLoading = $state(false);

	// Navigation handler
	function handleBack() {
		goto('/app/settings/schedule_settings');
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
			showSuccessToast('Success', result.message);
		} else {
			showFailToast('Error', result.message);
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
			showSuccessToast('Success', result.message);
		} else {
			isLoading = false;
			showFailToast('Error', result.message || 'Failed to save shift');
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

	let isExporting = $state(false);

	async function handleExportSchedule() {
		isExporting = true;
		showProgress('Generating Excel file...');

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

			showSuccessToast('Success', 'Schedule exported successfully');
		} catch (error) {
			console.error('Error exporting schedule:', error);
			showFailToast('Export Error', 'Could not generate Excel file');
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
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<ScheduleHeader
					weekStartDate={schedule?.week_start_date ?? ''}
					weekEndDate={schedule?.week_end_date ?? ''}
					onBack={handleBack}
				/>

				<Button
					onclick={handleExportSchedule}
					disabled={isExporting || !schedule}
					class="w-full gap-2 sm:w-auto"
					variant="default"
				>
					<Download class="h-4 w-4" />
					{#if isExporting}
						Exporting...
					{:else}
						Export Schedule
					{/if}
				</Button>
			</div>

			<!-- Schedule Grid -->
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
		</main>
	</div>
{/if}
