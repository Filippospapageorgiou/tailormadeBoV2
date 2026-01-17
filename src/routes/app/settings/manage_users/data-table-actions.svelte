<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Pencil, Trash, Palette } from 'lucide-svelte';
	import { deleteUser, getAllUserFromOrg, updateUserRole, updateBadgeColor } from './data.remote';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import type { RoleTypes } from '$lib/models/database.types';
	import BadgeColorPicker from '$lib/components/custom/badge-color-picker.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';

	let {
		id,
		username,
		role_id,
		role_name,
		badge_color,
		can_close_register,
		is_manager
	}: {
		id: string;
		username: string;
		role_id: number;
		role_name: string;
		badge_color: string;
		can_close_register: boolean;
		is_manager: boolean;
	} = $props();

	let query = getAllUserFromOrg();
	let roleTypes = $derived(query.current?.roleTypes ?? []);
	// Edit dialog state
	let editDialogOpen = $state(false);
	let selectedRoleId = $derived(String(role_id));

	// Badge color dialog state
	let badgeColorDialogOpen = $state(false);
	let selectedBadgeColor = $derived(badge_color || '#3b82f6');

	function handleEditClick() {
		selectedRoleId = String(role_id);
		editDialogOpen = true;
	}

	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);
	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	function handleBadgeColorClick() {
		selectedBadgeColor = badge_color || '#3b82f6';
		badgeColorDialogOpen = true;
	}

	async function handleEditSubmit() {
		editDialogOpen = false;
		showProgress('Updating user role...');

		try {
			const result = await updateUserRole({
				userId: id,
				roleId: parseInt(selectedRoleId, 10),
				canCloseRegister: can_close_register,
				isManager: is_manager
			});

			if (result.success) {
				await query.refresh();
				toast.success(result?.message);
			} else {
				toast.error(result?.message || 'Failed to update the user');
			}
		} catch (error: any) {
			toast.error(error);
		} finally {
			hideProgress();
		}
	}

	async function handleDeleteSubmit() {
		deleteDialogOpen = false;
		isDeleting = true;
		try {
			const result = await deleteUser({ userId: id });
			if (result.success) {
				toast.success(result.message);
				await query.refresh();
				deleteDialogOpen = false;
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast(error);
		} finally {
			isDeleting = false;
		}
	}

	async function handleBadgeColorSubmit() {
		badgeColorDialogOpen = false;
		showProgress('Updating badge color...');

		try {
			const result = await updateBadgeColor({
				userId: id,
				badgeColor: selectedBadgeColor
			});

			if (result.success) {
				await query.refresh();
				toast.success(result?.message);
			} else {
				toast.error(result?.message || 'Failed to update the user');
			}
		} catch (error: any) {
			toast.error(error || 'Failed to update the user');
		} finally {
			hideProgress();
		}
	}

	function cancelDelete() {
		deleteDialogOpen = false;
	}

	// Compute selected role name for display
	let selectedRoleName = $derived(() => {
		const role = roleTypes.find((r: RoleTypes) => r.id === parseInt(selectedRoleId, 10));
		return role?.role_name || 'Select a role';
	});
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
			onclick={handleEditClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<Pencil class="h-4 w-4 text-muted-foreground" />
			<span>Edit Role</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={handleBadgeColorClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<Palette class="h-4 w-4 text-muted-foreground" />
			<span>Change Badge Color</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator class="my-1 h-px bg-border" />
		<DropdownMenu.Item
			onclick={handleDeleteClick}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
		>
			<Trash class="h-4 w-4 text-red-600" />
			<span class="text-red-600">Delete User</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Edit Role Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit User Role</Dialog.Title>
			<Dialog.Description>
				Update the role for <span class="font-semibold">{username}</span>. Changes will take effect
				immediately.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Current Role</Label>
				<div class="col-span-3">
					<span class="text-sm text-muted-foreground">{role_name}</span>
				</div>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">New Role</Label>
				<div class="col-span-3">
					<Select.Root type="single" bind:value={selectedRoleId}>
						<Select.Trigger class="w-full">
							{selectedRoleName()}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Roles</Select.Label>
								{#each roleTypes as roleType (roleType.id)}
									{#if roleType.id !== 1}
										<Select.Item value={String(roleType.id)} label={roleType.role_name}>
											{roleType.role_name}
										</Select.Item>
									{/if}
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="col-span-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Label class="sm:text-right">Authorize to close register</Label>
					<Switch bind:checked={can_close_register} />
				</div>

				<div class="col-span-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Label class="sm:text-right">Is Manager</Label>
					<Switch bind:checked={is_manager} />
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (editDialogOpen = false)} class="cursor-pointer">
				Cancel
			</Button>
			<Button onclick={handleEditSubmit} class="cursor-pointer">Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή συστατικού"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό τον χρήστη;"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={`${username} (ID: ${id})`}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={cancelDelete}
>
	{#snippet children()}
		Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη
        <span class="font-medium">«{username}»</span>?
		<br />
		<br /> Ο χρήστης θα διαγραφεί μόνιμα
        από το σύστημα πιστοποίησης και τη βάση δεδομένων.
	{/snippet}
</DeleteConfirmDialog>

<!-- Badge Color Dialog -->
<Dialog.Root bind:open={badgeColorDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Change Badge Color</Dialog.Title>
			<Dialog.Description>
				Update the badge color for <span class="font-semibold">{username}</span>. This will change
				how their badge appears throughout the application.
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-6">
			<BadgeColorPicker bind:value={selectedBadgeColor} />
		</div>
		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (badgeColorDialogOpen = false)}
				class="cursor-pointer"
			>
				Cancel
			</Button>
			<Button onclick={handleBadgeColorSubmit} class="cursor-pointer">Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
