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
	import { showFailToast, showSuccessToast, toast } from '$lib/stores/toast.svelte';
	import type { RoleTypes } from '$lib/models/database.types';
	import BadgeColorPicker from '$lib/components/custom/badge-color-picker.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';

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
	let selectedRoleId = $state(String(role_id));

	// Delete dialog state
	let deleteDialogOpen = $state(false);

	// Badge color dialog state
	let badgeColorDialogOpen = $state(false);
	let selectedBadgeColor = $state(badge_color || '#3b82f6');

	function handleEditClick() {
		selectedRoleId = String(role_id);
		editDialogOpen = true;
	}

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
				showSuccessToast('Success', result?.message);
			} else {
				showFailToast('Error', result?.message || 'Failed to update the user');
			}
		} catch (error: any) {
			showFailToast('Error', 'An unexpected error occured');
		} finally {
			hideProgress();
		}
	}

	async function handleDeleteSubmit() {
		deleteDialogOpen = false;
		showProgress('Deleting user...');

		try {
			const result = await deleteUser({ userId: id });

			if (result.success) {
				await query.refresh();
				showSuccessToast('Success', result?.message);
			} else {
				showFailToast('Error', result?.message || 'Failed to update the user');
			}
		} catch (error: any) {
			showFailToast('Error', 'An unexpected error occured');
		} finally {
			hideProgress();
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
				showSuccessToast('Success', result?.message);
			} else {
				showFailToast('Error', result?.message || 'Failed to update the user');
			}
		} catch (error: any) {
			showFailToast('Error', 'An unexpected error occured');
		} finally {
			hideProgress();
		}
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
				<div class="col-span-3 flex flex-row gap-8">
					<Label class="text-right">Authorize to close register</Label>
					<Switch bind:checked={can_close_register} />
				</div>
				<div class="col-span-3 flex flex-row gap-8">
					<Label class="text-right">Is Manager</Label>
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

<!-- Delete User Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="rounded-2xl p-6 shadow-lg sm:max-w-[425px]">
		<Dialog.Header class="space-y-3">
			<Dialog.Title class="text-xl font-semibold">Delete User</Dialog.Title>
			<Dialog.Description class="text-sm leading-relaxed text-gray-600">
				Are you sure you want to delete user
				<span class="font-medium text-gray-900">"{username}"</span>?
				<br />
				<br />
				This action <span class="font-semibold text-red-500">cannot</span> be undone. The user will be
				permanently removed from the authentication system and the database.
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
				Delete User
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
