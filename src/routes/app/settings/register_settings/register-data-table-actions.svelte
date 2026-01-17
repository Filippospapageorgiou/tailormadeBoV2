<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Eye, Trash } from 'lucide-svelte';
	import { deleteRegisterClosing } from './data.remote';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { Row } from '$lib/components/ui/table';
	import { setDeleteAction } from './index.svelte';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import { toast, Toaster } from 'svelte-sonner';

	let {
		id,
		closingDate,
		totalSales,
		status
	}: {
		id: number;
		closingDate: string;
		totalSales: number;
		status: string;
	} = $props();

	// Delete dialog state
	let deleteDialogOpen = $state(false);

	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	let isDeleting = $state(false);
	async function handleDeleteSubmit() {
		setDeleteAction(true);
		isDeleting = true;
		try {
			const result = await deleteRegisterClosing({ closingId: id });
			if (result.success) {
				toast.success(result?.message);
			} else {
				toast.error(result?.message || 'Failed to delete register closing');
			}
		} catch (error: any) {
			console.error('Error deleting register closing:', error);
			toast.error(error || 'Failed to delete register closing');
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
		}
	}

	// Format date for display
	let formattedDate = $derived(
		new Date(closingDate).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);

	function cancelDelete() {
		deleteDialogOpen = false;
	}

	// Format currency
	let formattedSales = $derived(
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'EUR'
		}).format(totalSales || 0)
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="relative size-8 p-0 text-muted-foreground hover:text-foreground"
			>
				<span class="sr-only">Open menu</span>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-48">
		<DropdownMenu.Item
			onclick={() => goto(`/app/settings/register_settings/${id}`)}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<Eye class="h-4 w-4 text-muted-foreground" />
			<span>View Details</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator class="my-1 h-px bg-border" />
		<DropdownMenu.Item
			onclick={handleDeleteClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
		>
			<Trash class="h-4 w-4 text-red-600" />
			<span class="text-red-600">Delete Closing</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή Κλεισήματος"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το κλείσημο ταμείου"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={`${closingDate} (ID:${id})`}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={cancelDelete}
>
	{#snippet children()}
		Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το κλείσημο με
		ημερομηνία <span class="font-medium">{closingDate}</span>
		και συνολίκο ταμείο <span class="font-medium">{totalSales}</span>
	{/snippet}
</DeleteConfirmDialog>