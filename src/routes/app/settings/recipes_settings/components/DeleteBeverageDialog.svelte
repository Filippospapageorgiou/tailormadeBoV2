<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { deleteBeverage } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(),
		beverage,
		onUpdate
	}: {
		open: boolean;
		beverage: Beverage;
		onUpdate: () => Promise<void>;
	} = $props();

	async function handleDelete() {
		open = false;
		showProgress('Deleting beverage...');

		try {
			const result = await deleteBeverage({ beverageId:beverage.id.toString() });

			if (result.success) {
				await onUpdate();
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result.message || 'Beverage deleted successfully.';
			} else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result.message || 'Failed to delete beverage.';
			}
		} catch (error: any) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = error.message || 'An unexpected error occurred.';
		} finally {
			hideProgress();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Beverage</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this beverage? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<p class="text-sm">
				You are about to permanently delete the beverage:
				<span class="font-semibold text-neutral-800">{beverage.name}</span>
				(ID: {beverage.id}).
			</p>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} class="cursor-pointer gap-2">
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
