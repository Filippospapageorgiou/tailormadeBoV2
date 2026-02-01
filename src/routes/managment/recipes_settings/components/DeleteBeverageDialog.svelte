<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { deleteBeverage } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';

	let {
		open = $bindable(),
		beverage,
		onUpdate
	}: {
		open: boolean;
		beverage: Beverage;
		onUpdate: () => Promise<void>;
	} = $props();

	let isDeleting = $state(false);

	async function handleDelete() {
		isDeleting = true;
		try {
			const result = await deleteBeverage({ beverageId: beverage.id.toString() });
			if (result.success) {
				await onUpdate();
				toast.success('Το ρόφημα διαγράφθηκε')
				open = false;
			} else {
				toast.error('Σφάλμα κάτα την διαγράφη ροφήματος')
			}
		} catch (error: any) {
				toast.error('Σφάλμα κάτα την διαγράφη ροφήματος')
		} finally {
			isDeleting = false;
		}
	}
</script>

<DeleteConfirmDialog
	bind:open
	title="Διαγράφη Ροφήματος"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το ποτό; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
	itemName="{beverage.name} (ID: {beverage.id})"
	{isDeleting}
	onConfirm={handleDelete}
	onCancel={() => (open = false)}>
	{#snippet children()}
		<div class="flex items-center gap-4 rounded-lg p-4">
			{#if beverage.image_url}
				<img
					src={beverage.image_url}
					alt={beverage.name}
					class="h-16 w-16 rounded-lg object-cover"
				/>
			{/if}
			<div>
				<p class="font-semibold">{beverage.name}</p>
				<p class="text-xs text-muted-foreground">ID: #{beverage.id}</p>
			</div>
		</div>
	{/snippet}
</DeleteConfirmDialog>