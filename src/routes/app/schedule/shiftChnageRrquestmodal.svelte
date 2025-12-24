<script lang="ts">
	import { createShiftChangeRequest } from './data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Alert from '$lib/components/ui/alert';
	import { Loader, BadgeAlertIcon, Calendar, Repeat, X as XIcon } from 'lucide-svelte';
	import { showSuccessToast, toast } from '$lib/stores/toast.svelte';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';

	let { open = $bindable(false), shiftData, onSuccess }: any = $props();

	let requestType = $state<'change' | 'swap' | 'cancel'>('change');
	let proposedDate = $state('');
	let proposedStartTime = $state('');
	let proposedEndTime = $state('');
	let reason = $state('');

	// Derived label for select
	let requestTypeLabel = $derived(
		requestType === 'change'
			? 'Αλλαγή Ωρών/Ημερομηνίας'
			: requestType === 'swap'
				? 'Ανταλλαγή με Συνάδελφο'
				: 'Ακύρωση Βάρδιας'
	);

	// Reset form when modal closes
	$effect(() => {
		if (!open) {
			requestType = 'change';
			proposedDate = '';
			proposedStartTime = '';
			proposedEndTime = '';
			reason = '';
		}
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('el-GR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	function handleError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Σφάλμα';
		toast.text = text;
	}

	function refreshForm() {
		requestType = 'change';
		proposedDate = '';
		proposedStartTime = '';
		proposedEndTime = '';
		reason = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-3 text-2xl">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
					<Repeat class="h-5 w-5 text-amber-600" />
				</div>
				Αίτημα Αλλαγής Βάρδιας
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Υποβάλετε αίτημα για αλλαγή, ανταλλαγή ή ακύρωση της βάρδιας σας
			</Dialog.Description>
		</Dialog.Header>

		{#if shiftData}
			<form
				{...createShiftChangeRequest.enhance(async ({ form, submit }) => {
					open = false;
					showProgress('Υποβολή αιτήματος...');
					await submit();
					if(createShiftChangeRequest.result?.success === true){
						showSuccessToast('Επιτυχία','Το αιτήμα σας υποβλήθηκε με επυτιχία');
					}else {
						handleError(createShiftChangeRequest.result?.message || 'Αποτυχία υποβολής αιτήματος');
					}
					refreshForm();
					hideProgress();
					form.reset();
				})}
				class="space-y-6 py-6"
			>
				<!-- Hidden shift_id field -->
				<input
					type="hidden"
					{...createShiftChangeRequest.fields.shift_id.as('text')}
					value={shiftData.id}
				/>

				<!-- Current Shift Info -->
				<Alert.Root class="border-blue-200 bg-blue-50">
					<BadgeAlertIcon class="h-4 w-4 text-blue-600" />
					<Alert.Title>Τρέχουσα Βάρδια</Alert.Title>
					<Alert.Description>
						<div class="mt-2 space-y-1 text-sm">
							<p><strong>Ημερομηνία:</strong> {formatDate(shiftData.shift_date)}</p>
							{#if shiftData.start_time && shiftData.end_time}
								<p>
									<strong>Ώρες:</strong>
									{formatTime(shiftData.start_time)} - {formatTime(shiftData.end_time)}
								</p>
							{/if}
						</div>
					</Alert.Description>
				</Alert.Root>

				<!-- Request Type Selection -->
				<div class="space-y-2">
					<Label for="request-type">Τύπος Αιτήματος *</Label>
					<Select.Root type="single" bind:value={requestType}>
						<Select.Trigger class="w-full">
							{requestTypeLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="change" label="Αλλαγή Ωρών/Ημερομηνίας">
								Αλλαγή Ωρών/Ημερομηνίας
							</Select.Item>
							<Select.Item value="swap" label="Ανταλλαγή με Συνάδελφο">
								Ανταλλαγή με Συνάδελφο
							</Select.Item>
							<Select.Item value="cancel" label="Ακύρωση Βάρδιας">Ακύρωση Βάρδιας</Select.Item>
						</Select.Content>
					</Select.Root>
					<input
						type="hidden"
						{...createShiftChangeRequest.fields.request_type.as('text')}
						value={requestType}
					/>
					<p class="text-xs text-muted-foreground">
						{#if requestType === 'change'}
							Ζητήστε αλλαγή στις ώρες ή την ημερομηνία της βάρδιας σας
						{:else if requestType === 'swap'}
							Ζητήστε ανταλλαγή βάρδιας με συνάδελφο
						{:else}
							Ζητήστε ακύρωση αυτής της βάρδιας
						{/if}
					</p>
				</div>

				<!-- Proposed Changes (only for 'change' type) -->
				{#if requestType === 'change'}
					<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
						<h3 class="flex items-center gap-2 text-sm font-semibold">
							<Calendar class="h-4 w-4" />
							Προτεινόμενες Αλλαγές (προαιρετικό)
						</h3>

						<!-- Proposed Date -->
						<div class="space-y-2">
							<Label for="proposed-date">Νέα Ημερομηνία</Label>
							<InputCalendar id="proposed-date" bind:value={proposedDate} />
							<input
								bind:value={proposedDate}
								class="hidden"
								type="date"
								id="proposed-date"
								{...createShiftChangeRequest.fields.proposed_date.as('text')}
							/>
						</div>

						<!-- Proposed Time Range -->
						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="proposed-start">Νέα Ώρα Έναρξης</Label>
								<Input
									id="proposed-start"
									type="time"
									{...createShiftChangeRequest.fields.proposed_start_time.as('text')}
									bind:value={proposedStartTime}
									class="w-full"
								/>
							</div>
							<div class="space-y-2">
								<Label for="proposed-end">Νέα Ώρα Λήξης</Label>
								<Input
									id="proposed-end"
									type="time"
									{...createShiftChangeRequest.fields.proposed_end_time.as('text')}
									bind:value={proposedEndTime}
									class="w-full"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- Reason (required) -->
				<div class="space-y-2">
					<Label for="reason">Αιτιολογία *</Label>
					<Textarea
						id="reason"
						{...createShiftChangeRequest.fields.reason.as('text')}
						bind:value={reason}
						placeholder="Εξηγήστε τον λόγο του αιτήματός σας (τουλάχιστον 10 χαρακτήρες)"
						rows={4}
						class="resize-none"
					/>
					<p class="text-xs text-muted-foreground">
						{reason.length}/500 χαρακτήρες
					</p>
				</div>

				<!-- Footer Actions -->
				<Dialog.Footer class="gap-2">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						class="w-full md:w-auto"
					>
						<XIcon class="mr-2 h-4 w-4" />
						Ακύρωση
					</Button>
					<Button
						type="submit"
						disabled={reason.length < 10}
						class="w-full gap-2 bg-amber-600 hover:bg-amber-700 md:w-auto"
					>
						<Repeat class="h-4 w-4" />
						Υποβολή Αιτήματος
					</Button>
				</Dialog.Footer>
			</form>
		{:else}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">Δεν βρέθηκαν δεδομένα βάρδιας</p>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
