<script lang="ts">
	import { Ellipsis, Eye, Pencil, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { deleteEvaluation } from '$lib/api/trainers/trainer_evalution/data.remote';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import { toast } from 'svelte-sonner';

	let {
		id,
		onview,
		onedit,
	}: {
		id: number;
		onview?: (id: number) => void;
		onedit?: (id: number) => void;
	} = $props();


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
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative h-8 w-8 p-0">
				<span class="sr-only">Ενέργειες</span>
				<Ellipsis class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Group>
			<DropdownMenu.Label>Ενέργειες</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => onview?.(id)} class="gap-2">
				<Eye class="h-4 w-4" />
				Προβολή
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => {deleteDialogOpen = true}} class="gap-2 text-destructive focus:text-destructive">
			<Trash2 class="h-4 w-4" />
			Διαγραφή
		</DropdownMenu.Item>
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