<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Eye, PenIcon, Trash, Save } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { deleteOrganization, getAllOrganizations, updateOrganization } from './data.remote';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { toast } from 'svelte-sonner';
	import * as Modal from '$lib/components/ui/modal/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	let {
		id,
		storeName,
		status,
		email,
		phone,
		country,
		location
	}: {
		id: number;
		storeName: string | null;
		status: boolean | null;
		email: string | null;
		phone: string | null;
		country: string | null;
		location: string | null;
	} = $props();

	// Get query for refresh
	let query = getAllOrganizations();


	// Delete dialog state
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	// Edit modal state
	let isSubmitting = $state(false);
	let openEdit = $state(false);

	// Local status state for the switch
	let editStatus = $derived(status ?? true);

	// Set form values when modal opens
	function handleEditClick() {
		// Reset status
		editStatus = status ?? true;
		
		// Set all form field values
		updateOrganization.fields.set({
			id: id.toString(),
			store_name: storeName ?? '',
			email: email ?? '',
			phone: phone ?? '',
			country: country ?? '',
			location: location ?? '',
			status: String(status ?? true)
		});
		
		openEdit = true;
	}

	function handleViewClick() {
		goto(`/app/organization_managment/${id}`);
	}

	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	function closeEditModal() {
		openEdit = false;
	}

	async function handleDeleteSubmit() {
		isDeleting = true;
		deleteDialogOpen = false;
		showProgress('Διαγραφή οργανισμού...');

		try {
			const result = await deleteOrganization({ organizationId: id });

			if (result.success) {
				showSuccessToast('Επιτυχία', result.message);
				await query.refresh();
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία διαγραφής οργανισμού');
			}
		} catch (error: any) {
			console.error('Error deleting organization:', error);
			showFailToast('Σφάλμα', 'Απρόσμενο σφάλμα κατά τη διαγραφή');
		} finally {
			isDeleting = false;
			hideProgress();
		}
	}

	// Update the status field when switch changes
	function handleStatusChange(checked: boolean) {
		editStatus = checked;
		updateOrganization.fields.status.set(String(checked));
	}
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
			onclick={handleViewClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<Eye class="h-4 w-4 text-muted-foreground" />
			<span>View Details</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={handleEditClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<PenIcon class="h-4 w-4 text-muted-foreground" />
			<span>Edit</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator class="my-1 h-px bg-border" />
		<DropdownMenu.Item
			onclick={handleDeleteClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
		>
			<Trash class="h-4 w-4 text-destructive" />
			<span class="text-destructive">Delete Organization</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Delete Organization Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="rounded-2xl p-6 shadow-lg sm:max-w-[425px]">
		<Dialog.Header class="space-y-3">
			<Dialog.Title class="text-xl font-semibold">Διαγραφή Οργανισμού</Dialog.Title>
			<Dialog.Description class="text-sm leading-relaxed text-muted-foreground">
				Είστε σίγουροι ότι θέλετε να διαγράψετε τον οργανισμό
				<span class="font-medium">"{storeName || 'Unknown'}"</span>;
				<br />
				<br />
				Αυτή η ενέργεια <span class="font-semibold text-red-500">δεν μπορεί</span> να αναιρεθεί. Ο οργανισμός
				και όλα τα συσχετισμένα δεδομένα θα διαγραφούν οριστικά.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="cursor-pointer"
				onclick={() => (deleteDialogOpen = false)}
				disabled={isDeleting}
			>
				Ακύρωση
			</Button>
			<Button
				variant="destructive"
				class="cursor-pointer"
				onclick={handleDeleteSubmit}
				disabled={isDeleting}
			>
				{#if isDeleting}
					<Spinner class="mr-2 h-4 w-4" />
					Διαγραφή...
				{:else}
					Διαγραφή Οργανισμού
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- EDIT ORGANIZATION MODAL -->
<Modal.Root bind:open={openEdit}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto sm:max-w-[500px]">
		<Modal.Header>
			<Modal.Title>Επεξεργασία οργανισμού</Modal.Title>
			<Modal.Description>Ενημερώστε τα στοιχεία του οργανισμού "{storeName}"</Modal.Description>
		</Modal.Header>

		<ScrollArea class="h-[65dvh] w-full sm:h-auto sm:max-h-[60dvh]">
			<form
				class="space-y-6 px-1 py-4"
				{...updateOrganization.enhance(async ({ form,submit }) => {
					isSubmitting = true;
					await submit();

					if (updateOrganization.result?.success) {
						toast.success('Ο οργανισμός ενημερώθηκε επιτυχώς');
						closeEditModal();
						await query.refresh();
					} else {
						toast.error(
							updateOrganization.result?.message || 'Αποτυχία ενημέρωσης, προσπαθήστε ξανά'
						);
					}
					isSubmitting = false;
				})}
			>
				<!-- Hidden ID field -->
				<input type="hidden" {...updateOrganization.fields.id.as('text')} />

				<div class="space-y-4">
					<!-- Store Name -->
					<div class="space-y-2">
						<Label for="edit-store-name">Όνομα καταστήματος *</Label>
						<Input
							id="edit-store-name"
							{...updateOrganization.fields.store_name.as('text')}
							placeholder="π.χ. Coffee roasters Athens"
						/>
					</div>

					<!-- Email -->
					<div class="space-y-2">
						<Label for="edit-org-email">Email</Label>
						<Input
							id="edit-org-email"
							type="email"
							{...updateOrganization.fields.email.as('text')}
							placeholder="info@example.com"
						/>
					</div>

					<!-- Phone -->
					<div class="space-y-2">
						<Label for="edit-org-phone">Τηλέφωνο</Label>
						<Input
							id="edit-org-phone"
							{...updateOrganization.fields.phone.as('text')}
							placeholder="+30 210 1234567"
						/>
					</div>

					<!-- Country -->
					<div class="space-y-2">
						<Label for="edit-org-country">Χώρα</Label>
						<Input
							id="edit-org-country"
							{...updateOrganization.fields.country.as('text')}
							placeholder="Greece"
						/>
					</div>

					<!-- Location -->
					<div class="space-y-2">
						<Label for="edit-org-location">Τοποθεσία / Διεύθυνση</Label>
						<Input
							id="edit-org-location"
							{...updateOrganization.fields.location.as('text')}
							placeholder="Ermou 15, Athens"
						/>
					</div>

					<!-- Status Toggle -->
					<div class="flex items-center justify-between rounded-lg border border-border p-3">
						<div class="space-y-0.5">
							<Label for="edit-org-status">Κατάσταση</Label>
							<p class="text-xs text-muted-foreground">
								{editStatus ? 'Ο οργανισμός είναι ενεργός' : 'Ο οργανισμός είναι ανενεργός'}
							</p>
						</div>
						<Switch
							id="edit-org-status"
							checked={editStatus}
							onCheckedChange={handleStatusChange}
							class="cursor-pointer"
						/>
						<input type="hidden" {...updateOrganization.fields.status.as('text')} />
					</div>
				</div>

				<Modal.Footer class="py-4">
					<Button type="submit" disabled={isSubmitting} class="cursor-pointer">
						{#if isSubmitting}
							<Spinner class="mr-2 h-4 w-4" />
							Ενημέρωση...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							Αποθήκευση αλλαγών
						{/if}
					</Button>
					<Button variant="outline" type="button" class="cursor-pointer" onclick={closeEditModal}>
						Ακύρωση
					</Button>
				</Modal.Footer>
			</form>
		</ScrollArea>
	</Modal.Content>
</Modal.Root>