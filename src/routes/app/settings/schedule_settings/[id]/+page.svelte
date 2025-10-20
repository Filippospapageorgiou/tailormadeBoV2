<script lang="ts">
	import {
		authenticatedAccess,
		getEmployees,
		getEmployeeShifts,
		addShift,
		updateShift,
		deleteShift,
		calculateUserHours,
		getScheduleById,

		getShiftChanges

	} from './data.remote';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import ScheduleHeader from './components/ScheduleHeader.svelte';
	import EmployeeSelector from './components/EmployeeSelector.svelte';
	import WeeklyGrid from './components/WeeklyGrid.svelte';
	import ShiftModal, { type ShiftFormData } from './components/ShiftModal.svelte';
	import type { Profile } from '$lib/models/database.types';
	import type { Shift, ShiftCategory, ShiftType, ShiftChangeRequestPorfile } from '$lib/models/schedule.types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import ShiftRequests from './components/ShiftRequests.svelte';

	let auth = authenticatedAccess();
	let employeesQuery = getEmployees();

	// Get schedule ID from route parameter
	let scheduleId = $derived(parseInt(page.params.id!));

	// svelte-ignore state_referenced_locally
	let shiftChanges = getShiftChanges({scheduleId});
	let shiftRequests:ShiftChangeRequestPorfile[] = $derived(shiftChanges.current?.shiftRequests || []);

	// Fetch schedule data
	let scheduleQuery = $derived.by(() => {
		if (!scheduleId || isNaN(scheduleId)) return null;
		return getScheduleById({ scheduleId });
	});

	let schedule = $derived(scheduleQuery?.current?.schedule ?? null);

	// State
	let selectedEmployee = $state<Profile | null>(null);
	let shiftModalOpen = $state(false);
	let shiftModalMode = $state<'add' | 'edit'>('add');
	let selectedShift = $state<Shift | null>(null);
	let selectedDate = $state<string>('');
	let employeeHoursMap = $state<Map<string, number>>(new Map());

	// Derived values
	let employees = $derived(employeesQuery.current?.employees ?? []);
	let weekStartDate = $derived(schedule?.week_start_date ?? '');
	let weekEndDate = $derived(schedule?.week_end_date ?? '');

	// Query for selected employee's shifts
	let shiftsQuery = $derived.by(() => {
		if (!selectedEmployee || !scheduleId || isNaN(scheduleId)) return null;
		return getEmployeeShifts({ scheduleId, userId: selectedEmployee.id });
	});

	let shifts = $derived(shiftsQuery?.current?.shifts ?? []);

	// Navigation handler - go back to schedule list
	function handleBack() {
		goto('/app/settings/schedule_settings');
	}

	// Employee selection
	function handleSelectEmployee(employee: Profile) {
		selectedEmployee = employee;
	}

	// Shift modal handlers
	function handleAddShift(date: string) {
		if (!selectedEmployee) return;
		selectedDate = date;
		shiftModalMode = 'add';
		selectedShift = null;
		shiftModalOpen = true;
	}

	function handleEditShift(shift: Shift) {
		selectedShift = shift;
		shiftModalMode = 'edit';
		shiftModalOpen = true;
	}

	async function handleDeleteShift(shiftId: number) {
		const result = await deleteShift({ shiftId });

		if (result.success) {
			shiftsQuery?.refresh();
			showSuccessToast('Success',result.message);
		} else {
			showFailToast('Fail',result.message);
		}
	}

	function handleCloseModal() {
		shiftModalOpen = false;
		selectedShift = null;
		selectedDate = '';
	}

	let isLoading = $state(false);
	async function handleSaveShift(formData: ShiftFormData) {
		if (!selectedEmployee) return;

		let result;

		if (shiftModalMode === 'add') {
			isLoading = true;
			// Add new shift
			if (!scheduleId || isNaN(scheduleId)) return;
			result = await addShift({
				schedule_id: scheduleId,
				user_id: selectedEmployee.id,
				org_id:selectedEmployee.org_id,
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
			// Update existing shift
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
			// Refresh shifts
			isLoading = false;
			shiftsQuery?.refresh();
			handleCloseModal();
		} else {
			alert(result.message || 'Failed to save shift');
		}
	}

	// Load employee hours when employees or selected employee changes
	$effect(() => {
		if (employees.length > 0) {
			loadEmployeeHours();
		}
	});

	async function loadEmployeeHours() {
		if (!scheduleId || isNaN(scheduleId)) return;

		const hoursMap = new Map<string, number>();

		for (const emp of employees) {
			const result = await calculateUserHours({
				scheduleId,
				userId: emp.id
			});

			if (result.success && result.totalHours) {
				hoursMap.set(emp.id, result.totalHours);
			}
		}

		employeeHoursMap = hoursMap;
	}
	

	async function refresh() {
		await shiftChanges.refresh();
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto space-y-4 px-4 pb-10 pt-4 md:px-6">
			<!-- Header -->
			<ScheduleHeader
				{weekStartDate}
				{weekEndDate}
				onBack={handleBack}
			/>

			<!-- Employee Selector -->
			<EmployeeSelector
				{employees}
				selectedEmployeeId={selectedEmployee?.id}
				employeeHours={employeeHoursMap}
				onSelectEmployee={handleSelectEmployee}
			/>

			<!-- Weekly Grid -->
			<WeeklyGrid
				employee={selectedEmployee}
				{weekStartDate}
				{shifts}
				onAddShift={handleAddShift}
				onEditShift={handleEditShift}
				onDeleteShift={handleDeleteShift}
			/>

			<!-- Shift Modal -->
			<ShiftModal
				{isLoading}
				open={shiftModalOpen}
				mode={shiftModalMode}
				shift={selectedShift}
				defaultDate={selectedDate}
				employeeName={selectedEmployee?.username}
				onClose={handleCloseModal}
				onSave={handleSaveShift}
			/>

			<ShiftRequests
				{shiftRequests} 
				onSuccess={refresh}
			/>
		</main>
	</div>
{/if}
