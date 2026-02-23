<script lang="ts">
	import { Ellipsis, Eye, FilePenLine, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { goto } from '$app/navigation';
	import { DeleteIcon } from '@lucide/svelte';
	import { deleteEvaluation } from '$lib/api/trainers/trainer_evalution/data.remote';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';

	let { id, status }: { id: number; status: string } = $props();

	let canEdit = $derived(status === 'draft' || status === 'reopened');

	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);
	async function handleDeleteSubmit(){
		isDeleting = true;
		try {
			const result = await deleteEvaluation({ evaluationId: id });
			if (result.success) {
				toast.success('Αξιολόγηση διαγράφθηκε με επιτυχία');
				deleteDialogOpen = false;
			} else {
				toast.error('Παρουσιάστηκε σφάλμα κάτα την διαγραφή');
				deleteDialogOpen = false;
			}
		} catch (error: any) {
			toast(error);
			deleteDialogOpen = false;
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
		}

	}

	function cancelDelete(){
		deleteDialogOpen = false;
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
			<DropdownMenu.Item onclick={() => {deleteDialogOpen = true}} class="gap-2 text-destructive focus:text-destructive">
				<Trash2 class="h-4 w-4" />
				Διαγραφή
			</DropdownMenu.Item>
			{#if canEdit}
				<DropdownMenu.Item onclick={() => goto(`/trainer/evaluations/${id}/edit`)} class="gap-2">
					<FilePenLine class="h-4 w-4" />
					Συνέχεια Συμπλήρωσης
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή συστατικού"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό τον αξιολόγηση;"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={`Διαγραφή (ID: ${id})`}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={cancelDelete}
>
</DeleteConfirmDialog>