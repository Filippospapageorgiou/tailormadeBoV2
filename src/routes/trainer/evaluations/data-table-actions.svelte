<script lang="ts">
	import { Ellipsis, Eye, Trash2, Send, MailCheck } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { goto } from '$app/navigation';
	import { deleteEvaluation, submitEvaluationFinal } from '$lib/api/trainers/trainer_evalution/data.remote';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let { id, status }: { id: number; status: string } = $props();

	let canEdit = $derived(status === 'draft' || status === 'reopened');

	// Delete
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	async function handleDeleteSubmit() {
		isDeleting = true;
		try {
			const result = await deleteEvaluation({ evaluationId: id });
			if (result.success) {
				toast.success('Αξιολόγηση διαγράφθηκε με επιτυχία');
			} else {
				toast.error('Παρουσιάστηκε σφάλμα κατά την διαγραφή');
			}
		} catch (error: any) {
			toast.error('Παρουσιάστηκε σφάλμα κατά την διαγραφή');
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
		}
	}

	// Submit
	let submitDialogOpen = $state(false);
	let isSubmitting = $state(false);

	async function handleSubmitConfirm() {
		isSubmitting = true;
		try {
			await submitEvaluationFinal({ evaluationId: id });
			toast.success('Αξιολόγηση υποβλήθηκε με επιτυχία');
			submitDialogOpen = false;
		} catch (error: any) {
			toast.error('Παρουσιάστηκε σφάλμα κατά την υποβολή');
			submitDialogOpen = false;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props }: {props:any})}
			<Button {...props} variant="ghost" size="icon" class="relative h-8 w-8 p-0">
				<span class="sr-only">Ενέργειες</span>
				<Ellipsis class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Group>
			<DropdownMenu.Label>Ενέργειες</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => goto(`/trainer/evaluations/${id}`)} class="gap-2">
				<Eye class="h-4 w-4" />
				Προβολή
			</DropdownMenu.Item>
			{#if canEdit}
				<DropdownMenu.Item onclick={() => { submitDialogOpen = true }} class="gap-2 text-emerald-600 focus:text-emerald-600">
					<Send class="h-4 w-4" />
					Υποβολή
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item onclick={() => { deleteDialogOpen = true }} class="gap-2 text-destructive focus:text-destructive">
				<Trash2 class="h-4 w-4" />
				Διαγραφή
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Delete dialog -->
<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή αξιολόγησης"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αξιολόγηση;"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={`Διαγραφή (ID: ${id})`}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={() => { deleteDialogOpen = false }}
/>

<!-- Submit confirmation dialog -->
<Dialog.Root bind:open={submitDialogOpen}>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
				<Send class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
			</div>
			<Dialog.Title>Υποβολή αξιολόγησης</Dialog.Title>
			<Dialog.Description>
				Είστε σίγουροι ότι θέλετε να υποβάλλετε αυτή την αξιολόγηση;
			</Dialog.Description>
		</Dialog.Header>

		<div class="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
			<div class="flex items-start gap-2">
				<MailCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
				<span>Η ανάθεση θα διαγραφεί και ο υπεύθυνος θα ειδοποιηθεί αυτόματα με email.</span>
			</div>
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="outline" onclick={() => { submitDialogOpen = false }} disabled={isSubmitting}>
				Άκυρο
			</Button>
			<Button
				onclick={handleSubmitConfirm}
				disabled={isSubmitting}
				class="bg-emerald-600 text-white hover:bg-emerald-700"
			>
				{#if isSubmitting}
					<Spinner />
					Υποβολή...
				{:else}
					<Send class="h-4 w-4" />
					Υποβολή
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>