<script lang="ts">
	import type { ManualWithDetails } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { deleteManual } from '../../../../lib/api/manual/data.remote';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';

	let {
		open = $bindable(),
		manual,
		onSuccess
	}: {
		open: boolean;
		manual: ManualWithDetails;
		onSuccess: () => Promise<void>;
	} = $props();

	let isDeleting = $state(false);

	async function handleDelete() {
		isDeleting = true;
		try {
			const result = await deleteManual({ id: manual.id });
			if (result.success) {
				await onSuccess();
				toast.success('Το εγχειρίδιο διαγράφηκε');
				open = false;
			} else {
				toast.error(result.message || 'Σφάλμα κατά τη διαγραφή');
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά τη διαγραφή εγχειριδίου');
		} finally {
			isDeleting = false;
			open = false;
		}
	}
</script>

<DeleteConfirmDialog
	bind:open
	title="Διαγραφή Εγχειριδίου"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το εγχειρίδιο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Θα διαγραφούν και όλα τα αρχεία πολυμέσων."
	itemName="{manual.title} (ID: {manual.id})"
	{isDeleting}
	onConfirm={handleDelete}
	onCancel={() => (open = false)}
>
	{#snippet children()}
		<div class="flex items-center gap-4 rounded-lg p-4">
			{#if manual.media && manual.media[0]}
				<img
					src={manual.media[0]}
					alt={manual.title}
					class="h-16 w-16 rounded-lg object-cover"
				/>
			{/if}
			<div>
				<p class="font-semibold">{manual.title}</p>
				<p class="text-xs text-muted-foreground">
					{MANUAL_CATEGORY_LABELS[manual.category]} &middot; ID: #{manual.id}
				</p>
			</div>
		</div>
	{/snippet}
</DeleteConfirmDialog>
