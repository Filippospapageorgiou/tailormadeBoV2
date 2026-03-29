<script lang="ts">
	import { Ellipsis, Eye, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cancelVisit } from '$lib/api/trainers/equipment/data.remote';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let {
		id,
		basePath = ''
	}: {
		id: number;
		basePath?: string;
	} = $props();
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	async function handleDeleteSubmit() {
		isDeleting = true;
		try {
			const result = await cancelVisit({ visitId: id });
			if (result.success) {
				toast.success('Η επίσκεψη διαγράφηκε επιτυχώς');
				deleteDialogOpen = false;
			} else {
				toast.error(result.message || 'Παρουσιάστηκε σφάλμα κατά τη διαγραφή');
				deleteDialogOpen = false;
			}
		} catch (error: any) {
			toast.error('Παρουσιάστηκε σφάλμα κατά τη διαγραφή');
			deleteDialogOpen = false;
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
		}
	}

	function cancelDelete() {
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
			<DropdownMenu.Item onclick={() => goto(`${basePath}/${id}`)} class="gap-2">
				<Eye class="h-4 w-4" />
				Προβολή
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			onclick={() => {
				deleteDialogOpen = true;
			}}
			class="gap-2 text-destructive focus:text-destructive"
		>
			<Trash2 class="h-4 w-4" />
			Διαγραφή
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή Επίσκεψης"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επίσκεψη; Θα διαγραφούν όλες οι ενέργειες και οι φωτογραφίες."
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={`Επίσκεψη (ID: ${id})`}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={cancelDelete}
/>
