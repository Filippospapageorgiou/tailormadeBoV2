<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE, SHIFT_CATEGORY } from '$lib/models/schedule.types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	interface Props {
		isLoading:boolean;
		open: boolean;
		mode: 'add' | 'edit';
		shift?: Shift | null;
		defaultDate?: string; // For add mode - YYYY-MM-DD
		employeeName?: string;
		onClose: () => void;
		onSave: (shiftData: ShiftFormData) => void;
	}

	export interface ShiftFormData {
		id?: number;
		shift_date: string;
		start_time: string | null;
		end_time: string | null;
		shift_type: string;
		shift_category: string | null;
		break_duration_minutes: number;
		notes: string | null;
	}

	let {isLoading ,open, mode, shift, defaultDate, employeeName, onClose, onSave }: Props = $props();

	// Form state
	let formData = $state<ShiftFormData>({
		id: undefined,
		shift_date: '',
		start_time: null,
		end_time: null,
		shift_type: SHIFT_TYPE.WORK,
		shift_category: SHIFT_CATEGORY.MORNING,
		break_duration_minutes: 0,
		notes: null
	});

	// Watch for changes to shift or defaultDate and reset form
	$effect(() => {
		if (open) {
			if (mode === 'edit' && shift) {
				// Edit mode - populate with existing shift data
				formData = {
					id: shift.id,
					shift_date: shift.shift_date,
					start_time: shift.start_time ? formatTimeForInput(shift.start_time) : null,
					end_time: shift.end_time ? formatTimeForInput(shift.end_time) : null,
					shift_type: shift.shift_type,
					shift_category: shift.shift_category,
					break_duration_minutes: shift.break_duration_minutes || 0,
					notes: shift.notes || null
				};
			} else if (mode === 'add') {
				// Add mode - use defaults
				formData = {
					id: undefined,
					shift_date: defaultDate || '',
					start_time: '08:00',
					end_time: '16:00',
					shift_type: SHIFT_TYPE.WORK,
					shift_category: SHIFT_CATEGORY.MORNING,
					break_duration_minutes: 30,
					notes: null
				};
			}
		}
	});

	// Format time from HH:MM:SS to HH:MM for input
	function formatTimeForInput(time: string): string {
		return time.substring(0, 5); // Take HH:MM from HH:MM:SS
	}

	function handleSave() {
		// Convert times to HH:MM:SS format for database
		const saveData: ShiftFormData = {
			...formData,
			start_time: formData.start_time ? `${formData.start_time}:00` : null,
			end_time: formData.end_time ? `${formData.end_time}:00` : null
		};

		onSave(saveData);
	}

	let isWorkShift = $derived(formData.shift_type === SHIFT_TYPE.WORK);

	// Watch for shift type changes to clear/set defaults
	$effect(() => {
		// If changing to non-work type, clear times and category
		if (formData.shift_type !== SHIFT_TYPE.WORK) {
			formData.start_time = null;
			formData.end_time = null;
			formData.shift_category = null;
			formData.break_duration_minutes = 0;
		}
	});

	// Derived trigger content for selects
	const shiftTypeLabel = $derived(
		formData.shift_type === SHIFT_TYPE.WORK ? 'Work' :
		formData.shift_type === SHIFT_TYPE.DAY_OFF ? 'Day Off' :
		formData.shift_type === SHIFT_TYPE.SICK_LEAVE ? 'Sick Leave' :
		formData.shift_type === SHIFT_TYPE.VACATION ? 'Vacation' : 'Select shift type'
	);

	const shiftCategoryLabel = $derived(
		formData.shift_category === SHIFT_CATEGORY.MORNING ? 'Morning' :
		formData.shift_category === SHIFT_CATEGORY.AFTERNOON ? 'Afternoon' :
		formData.shift_category === SHIFT_CATEGORY.EVENING ? 'Evening' :
		formData.shift_category === SHIFT_CATEGORY.NIGHT ? 'Night' : 'Select category'
	);
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				{mode === 'add' ? 'Add Shift' : 'Edit Shift'}
				{#if employeeName}
					- {employeeName}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{mode === 'add'
					? 'Add a new shift to the schedule'
					: 'Update the shift details'}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Date -->
			<div class="space-y-2">
				<Label for="shift_date">Date</Label>
				<Input
					id="shift_date"
					type="date"
					bind:value={formData.shift_date}
					required
					disabled
				/>
			</div>

			<!-- Shift Type -->
			<div class="space-y-2">
				<Label for="shift_type">Shift Type</Label>
				<Select.Root type="single" name="shift_type" bind:value={formData.shift_type}>
					<Select.Trigger class="w-full">
						{shiftTypeLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value={SHIFT_TYPE.WORK} label="Work">Work</Select.Item>
						<Select.Item value={SHIFT_TYPE.DAY_OFF} label="Day Off">Day Off</Select.Item>
						<Select.Item value={SHIFT_TYPE.SICK_LEAVE} label="Sick Leave">Sick Leave</Select.Item>
						<Select.Item value={SHIFT_TYPE.VACATION} label="Vacation">Vacation</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			{#if isWorkShift}
				<!-- Start Time -->
				<div class="space-y-2">
					<Label for="start_time">Start Time</Label>
					<Input
						id="start_time"
						type="time"
						bind:value={formData.start_time}
						required
					/>
				</div>

				<!-- End Time -->
				<div class="space-y-2">
					<Label for="end_time">End Time</Label>
					<Input
						id="end_time"
						type="time"
						bind:value={formData.end_time}
						required
					/>
				</div>

				<!-- Shift Category -->
				<div class="space-y-2">
					<Label for="shift_category">Shift Category</Label>
					<Select.Root type="single" name="shift_category" bind:value={formData.shift_category!}>
						<Select.Trigger class="w-full">
							{shiftCategoryLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value={SHIFT_CATEGORY.MORNING} label="Morning">Morning</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.AFTERNOON} label="Afternoon">Afternoon</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.EVENING} label="Evening">Evening</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.NIGHT} label="Night">Night</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Break Duration -->
				<div class="space-y-2">
					<Label for="break_duration">Break Duration (minutes)</Label>
					<Input
						id="break_duration"
						type="number"
						min="0"
						bind:value={formData.break_duration_minutes}
					/>
				</div>
			{/if}

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="notes">Notes (optional)</Label>
				<Textarea
					id="notes"
					bind:value={formData.notes}
					placeholder="Add any additional notes..."
					rows={3}
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose}>Cancel</Button>
			<Button onclick={handleSave}>
				{#if mode === 'add'}
					{#if isLoading}
						<Spinner />
						Adding shift....
					{:else}
						Add shift
					{/if}
				{:else}
					{#if isLoading}
						<Spinner />
						Saving changes....
					{:else}
						Save changes
					{/if}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
