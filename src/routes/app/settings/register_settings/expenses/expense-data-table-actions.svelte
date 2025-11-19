<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Eye, Trash } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let {
		id,
		closingId,
		category,
		amount
	}: {
		id: number;
		closingId: number;
		category: string | null;
		amount: number;
	} = $props();

	// Delete dialog state
	let deleteDialogOpen = $state(false);

	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	async function handleDeleteSubmit() {
		// TODO: Implement delete logic
		deleteDialogOpen = false;
	}

	// Format currency
	let formattedAmount = $derived(
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount || 0)
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
			onclick={() => goto(`/app/settings/register_settings/${closingId}`)}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<Eye class="h-4 w-4 text-muted-foreground" />
			<span>View Closing</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator class="my-1 h-px bg-border" />
		<DropdownMenu.Item
			onclick={handleDeleteClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
		>
			<Trash class="h-4 w-4 text-red-600" />
			<span class="text-red-600">Delete Expense</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Delete Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="rounded-2xl p-6 shadow-lg sm:max-w-[425px]">
		<Dialog.Header class="space-y-3">
			<Dialog.Title class="text-xl font-semibold">Delete Expense</Dialog.Title>
			<Dialog.Description class="text-sm leading-relaxed text-gray-600">
				Are you sure you want to delete the expense
				<span class="font-medium text-gray-900">"{category || 'Uncategorized'}"</span>
				for <span class="font-medium">{formattedAmount}</span>?
				<br />
				<br />
				This action <span class="font-semibold text-red-500">cannot</span> be undone.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-100"
				onclick={() => (deleteDialogOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="cursor-pointer bg-red-600 font-medium text-white shadow-md hover:bg-red-700"
				onclick={handleDeleteSubmit}
			>
				Delete Expense
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
