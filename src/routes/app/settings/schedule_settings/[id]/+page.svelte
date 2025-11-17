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
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto space-y-6 px-4 pt-4 pb-10 md:px-6">
			<!-- Header -->
			<ScheduleHeader
				weekStartDate={schedule?.week_start_date ?? ''}
				weekEndDate={schedule?.week_end_date ?? ''}
				onBack={handleBack}
			/>

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
