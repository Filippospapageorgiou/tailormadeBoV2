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
		isLoading: boolean;
		open: boolean;
		mode: 'add' | 'edit';
		shift?: Shift | null;
		defaultDate?: string;
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

	let { isLoading, open, mode, shift, defaultDate, employeeName, onClose, onSave }: Props =
		$props();

	// Constant category time presets
	const CATEGORY_TIMES: Record<string, { start: string; end: string }> = {
		[SHIFT_CATEGORY.MORNING]: { start: '07:00', end: '15:00' },
		[SHIFT_CATEGORY.AFTERNOON]: { start: '09:00', end: '17:00' },
		[SHIFT_CATEGORY.EVENING]: { start: '12:00', end: '20:00' },
		[SHIFT_CATEGORY.PART_TIME]: { start: '16:00', end: '20:00' }
	};

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
				formData = {
					id: undefined,
					shift_date: defaultDate || '',
					start_time: '07:00',
					end_time: '15:00',
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
		return time.substring(0, 5);
	}

	function handleSave() {
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
		if (formData.shift_type !== SHIFT_TYPE.WORK) {
			formData.start_time = null;
			formData.end_time = null;
			formData.shift_category = null;
			formData.break_duration_minutes = 0;
		}
	});

	// Handle category change - auto-fill times
	function handleCategoryChange(category: string) {
		formData.shift_category = category;
		const times = CATEGORY_TIMES[category];
		if (times) {
			formData.start_time = times.start;
			formData.end_time = times.end;
		}
	}

	// Derived trigger content for selects
	const shiftTypeLabel = $derived(
		formData.shift_type === SHIFT_TYPE.WORK
			? 'Εργασία'
			: formData.shift_type === SHIFT_TYPE.DAY_OFF
				? 'Ρεπό'
				: formData.shift_type === SHIFT_TYPE.SICK_LEAVE
					? 'Αναρρωτική'
					: formData.shift_type === SHIFT_TYPE.VACATION
						? 'Άδεια'
						: 'Επιλέξτε τύπο'
	);

	const shiftCategoryLabel = $derived(
		formData.shift_category === SHIFT_CATEGORY.MORNING
			? 'Πρωί (07:00 - 15:00)'
			: formData.shift_category === SHIFT_CATEGORY.AFTERNOON
				? 'Απόγευμα (09:00 - 17:00)'
				: formData.shift_category === SHIFT_CATEGORY.EVENING
					? 'Βράδυ (12:00 - 20:00)'
					: formData.shift_category === SHIFT_CATEGORY.PART_TIME
						? 'Μερικής (04:00 - 08:00)'
						: 'Επιλέξτε κατηγορία'
	);
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				{mode === 'add' ? 'Προσθήκη Βάρδιας' : 'Επεξεργασία Βάρδιας'}
				{#if employeeName}
					- {employeeName}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{mode === 'add'
					? 'Προσθέστε μια νέα βάρδια στο πρόγραμμα'
					: 'Ενημερώστε τις λεπτομέρειες της βάρδιας'}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Date -->
			<div class="space-y-2">
				<Label for="shift_date">Ημερομηνία</Label>
				<Input id="shift_date" type="date" bind:value={formData.shift_date} required disabled />
			</div>

			<!-- Shift Type -->
			<div class="space-y-2">
				<Label for="shift_type">Τύπος Βάρδιας</Label>
				<Select.Root type="single" name="shift_type" bind:value={formData.shift_type}>
					<Select.Trigger class="w-full">
						{shiftTypeLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value={SHIFT_TYPE.WORK} label="Εργασία">Εργασία</Select.Item>
						<Select.Item value={SHIFT_TYPE.DAY_OFF} label="Ρεπό">Ρεπό</Select.Item>
						<Select.Item value={SHIFT_TYPE.SICK_LEAVE} label="Αναρρωτική">Αναρρωτική</Select.Item>
						<Select.Item value={SHIFT_TYPE.VACATION} label="Άδεια">Άδεια</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			{#if isWorkShift}
				<!-- Shift Category - Now first and auto-fills times -->
				<div class="space-y-2">
					<Label for="shift_category">Κατηγορία Βάρδιας</Label>
					<Select.Root
						type="single"
						name="shift_category"
						value={formData.shift_category!}
						onValueChange={(val) => val && handleCategoryChange(val)}
					>
						<Select.Trigger class="w-full">
							{shiftCategoryLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value={SHIFT_CATEGORY.MORNING} label="Πρωί">
								Πρωί (07:00 - 15:00)
							</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.AFTERNOON} label="Απόγευμα">
								Απόγευμα (09:00 - 17:00)
							</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.EVENING} label="Βράδυ">
								Βράδυ (12:00 - 20:00)
							</Select.Item>
							<Select.Item value={SHIFT_CATEGORY.PART_TIME} label="Μερικής">
								Μερικής (04:00 - 08:00)
							</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Start Time -->
				<div class="space-y-2">
					<Label for="start_time">Ώρα Έναρξης</Label>
					<Input id="start_time" type="time" bind:value={formData.start_time} required />
				</div>

				<!-- End Time -->
				<div class="space-y-2">
					<Label for="end_time">Ώρα Λήξης</Label>
					<Input id="end_time" type="time" bind:value={formData.end_time} required />
				</div>

				<!-- Break Duration -->
				<div class="space-y-2">
					<Label for="break_duration">Διάλειμμα (λεπτά)</Label>
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
				<Label for="notes">Σημειώσεις (προαιρετικά)</Label>
				<Textarea
					id="notes"
					bind:value={formData.notes}
					placeholder="Προσθέστε σημειώσεις..."
					rows={3}
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose}>Ακύρωση</Button>
			<Button onclick={handleSave}>
				{#if mode === 'add'}
					{#if isLoading}
						<Spinner />
						Προσθήκη...
					{:else}
						Προσθήκη
					{/if}
				{:else if isLoading}
					<Spinner />
					Αποθήκευση...
				{:else}
					Αποθήκευση
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
