<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import {
		ArrowLeft,
		Users,
		Wrench,
		Mail,
		Phone,
		MapPin,
		Globe,
		Calendar,
		UserPlus,
		Building2,
		CheckCircle,
		AlertTriangle,
		Settings
	} from 'lucide-svelte';
	import { inviteUserToOrg } from './data.remote';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import type { RoleTypes } from '$lib/models/database.types';

	let { data }: PageProps = $props();

	let organization = $derived(data.organization);
	let employees = $derived(data.employees);
	let equipment = $derived(data.equipment);
	let roleTypes = $derived(data.roleTypes);
	let stats = $derived(data.stats);

	// Invite modal state
	let inviteDialogOpen = $state(false);
	let isInviting = $state(false);
	let inviteEmail = $state('');
	let selectedRoleId = $state('2'); // Default to admin

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Get selected role name for display
	let selectedRoleName = $derived(() => {
		const role = roleTypes.find((r: RoleTypes) => r.id === parseInt(selectedRoleId, 10));
		return role?.role_name || 'Select a role';
	});

	function handleBack() {
		goto('/app/organization_managment');
	}

	function openInviteDialog() {
		inviteEmail = '';
		selectedRoleId = '2';
		inviteDialogOpen = true;
	}

	async function handleInviteSubmit() {
		if (!inviteEmail.trim()) {
			showFailToast('Error', 'Please enter an email address');
			return;
		}

		isInviting = true;

		try {
			const result = await inviteUserToOrg({
				email: inviteEmail.trim(),
				orgId: organization.id,
				roleId: parseInt(selectedRoleId, 10)
			});

			if (result.success) {
				showSuccessToast('Success', result.message);
				inviteDialogOpen = false;
				inviteEmail = '';
			} else {
				showFailToast('Error', result.message || 'Failed to send invitation');
			}
		} catch (error) {
			console.error('Error inviting user:', error);
			showFailToast('Error', 'An unexpected error occurred');
		} finally {
			isInviting = false;
		}
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-6xl px-4 py-6 md:px-6">
		<!-- Header -->
		<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					onclick={handleBack}
					class="rounded-lg border border-border hover:bg-muted"
				>
					<ArrowLeft class="h-4 w-4" />
				</Button>
				<div>
					<div class="flex items-center gap-3">
						<h1 class="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
							{organization.store_name || 'Unnamed Organization'}
						</h1>
						{#if organization.status}
							<Badge
								class="border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5"
							>
								<!-- svelte-ignore element_invalid_self_closing_tag -->
								<span
									class="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
									aria-hidden="true"
								/>
								active
							</Badge>
						{:else}
							<Badge
								class="border-none bg-destructive/10 text-destructive focus-visible:ring-destructive/20 focus-visible:outline-none dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/5"
							>
								<!-- svelte-ignore element_invalid_self_closing_tag -->
								<span class="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
								inactive
							</Badge>
						{/if}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						<Calendar class="mr-1 inline h-3 w-3" />
						Created {formatDate(organization.created_at)}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={() => goto(`/app/organization_managment`)} class="gap-2">
					<Settings class="h-4 w-4" />
					<span class="hidden sm:inline">Edit</span>
				</Button>
				<Button onclick={openInviteDialog} class="gap-2">
					<UserPlus class="h-4 w-4" />
					<span class="hidden sm:inline">Invite User</span>
				</Button>
			</div>
		</div>

		<!-- Stats Cards Grid -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Employees Card -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/20 via-card/80 to-indigo-500/30"
				></div>
				<div
					class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-blue-500/25 blur-3xl"
				></div>
				<div
					class="absolute -bottom-16 -left-16 -z-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl"
				></div>

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Employees</p>
						<p class="mt-1 text-3xl font-bold tracking-tight">{stats.employeeCount}</p>
						<p class="mt-1 text-xs text-muted-foreground">team members</p>
					</div>
					<div class="rounded-xl bg-blue-500/10 p-3">
						<Users class="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
			</Card.Root>

			<!-- Equipment Card -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/20 via-card/80 to-pink-500/30"
				></div>
				<div
					class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-purple-500/25 blur-3xl"
				></div>
				<div
					class="absolute -bottom-16 -left-16 -z-10 h-32 w-32 rounded-full bg-pink-500/20 blur-3xl"
				></div>

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Equipment</p>
						<p class="mt-1 text-3xl font-bold tracking-tight">{stats.equipmentCount}</p>
						<p class="mt-1 text-xs text-muted-foreground">total items</p>
					</div>
					<div class="rounded-xl bg-purple-500/10 p-3">
						<Wrench class="h-6 w-6 text-purple-600 dark:text-purple-400" />
					</div>
				</div>
			</Card.Root>

			<!-- Active Equipment Card -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-green-500/20 via-card/80 to-emerald-500/30"
				></div>
				<div
					class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-green-500/25 blur-3xl"
				></div>
				<div
					class="absolute -bottom-16 -left-16 -z-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl"
				></div>

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Operational</p>
						<p class="mt-1 text-3xl font-bold tracking-tight">{stats.activeEquipment}</p>
						<p class="mt-1 text-xs text-muted-foreground">working items</p>
					</div>
					<div class="rounded-xl bg-green-500/10 p-3">
						<CheckCircle class="h-6 w-6 text-green-600 dark:text-green-400" />
					</div>
				</div>
			</Card.Root>

			<!-- Maintenance Card -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/20 via-card/80 to-orange-500/30"
				></div>
				<div
					class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-amber-500/25 blur-3xl"
				></div>
				<div
					class="absolute -bottom-16 -left-16 -z-10 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl"
				></div>

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Maintenance</p>
						<p class="mt-1 text-3xl font-bold tracking-tight">{stats.maintenanceEquipment}</p>
						<p class="mt-1 text-xs text-muted-foreground">needs attention</p>
					</div>
					<div class="rounded-xl bg-amber-500/10 p-3">
						<AlertTriangle class="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
				</div>
			</Card.Root>
		</div>

		<!-- Organization Details Card -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Contact Information -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-card/80 to-secondary/30"
				></div>
				<div
					class="absolute -top-20 -right-20 -z-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
				></div>
				<div
					class="absolute -bottom-20 -left-20 -z-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl"
				></div>

				<Card.Header class="p-0 pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<Building2 class="h-5 w-5" />
						Organization Details
					</Card.Title>
				</Card.Header>

				<Card.Content class="space-y-4 p-0">
					<div class="flex items-start gap-3">
						<Mail class="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Email</p>
							<p class="text-sm">{organization.email || '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<Phone class="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Phone</p>
							<p class="text-sm">{organization.phone || '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<Globe class="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Country</p>
							<p class="text-sm">{organization.country || '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<MapPin class="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Location</p>
							<p class="text-sm">{organization.location || '—'}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Invite User Card -->
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/20 via-card/80 to-teal-500/30"
				></div>
				<div
					class="absolute -top-20 -left-20 -z-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl"
				></div>
				<div
					class="absolute -right-20 -bottom-20 -z-10 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl"
				></div>

				<Card.Header class="p-0 pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<UserPlus class="h-5 w-5" />
						Invite Team Member
					</Card.Title>
					<Card.Description>
						Invite the first admin to manage this organization. They will be able to invite
						additional team members.
					</Card.Description>
				</Card.Header>

				<Card.Content class="p-0">
					{#if stats.employeeCount === 0}
						<div class="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
							<p class="text-sm text-amber-700 dark:text-amber-400">
								<AlertTriangle class="mr-2 inline h-4 w-4" />
								This organization has no members yet. Invite an admin to get started.
							</p>
						</div>
					{:else}
						<div class="rounded-lg border border-dashed border-green-500/50 bg-green-500/5 p-4">
							<p class="text-sm text-green-700 dark:text-green-400">
								<CheckCircle class="mr-2 inline h-4 w-4" />
								This organization has {stats.employeeCount} member{stats.employeeCount > 1
									? 's'
									: ''}.
							</p>
						</div>
					{/if}

					<Button onclick={openInviteDialog} class="mt-4 w-full gap-2">
						<UserPlus class="h-4 w-4" />
						Send Invitation
					</Button>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Team Members Preview (if any) -->
		{#if employees.length > 0}
			<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-slate-500/10 via-card/90 to-zinc-500/20"
				></div>

				<Card.Header class="p-0 pb-4">
					<Card.Title class="flex items-center gap-2 text-lg">
						<Users class="h-5 w-5" />
						Team Members
					</Card.Title>
					<Card.Description>Current members of this organization</Card.Description>
				</Card.Header>

				<Card.Content class="p-0">
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each employees as employee}
							<div class="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
								<img
									src={employee.image_url || '/default-avatar.png'}
									alt={employee.username}
									class="h-10 w-10 rounded-full object-cover dark:bg-white"
								/>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{employee.username}</p>
									<p class="truncate text-xs text-muted-foreground">{employee.email}</p>
								</div>
								<Badge
									variant="secondary"
									style="background-color: {employee.badge_color || '#3b82f6'}; color: white;"
									class="text-xs"
								>
									{employee.role_name}
								</Badge>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</main>
</div>

<!-- Invite User Dialog -->
<Dialog.Root bind:open={inviteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Invite User to {organization.store_name}</Dialog.Title>
			<Dialog.Description>
				Send an email invitation to join this organization. They will receive a link to set up their
				account.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="invite-email">Email Address</Label>
				<Input
					id="invite-email"
					type="email"
					bind:value={inviteEmail}
					placeholder="user@example.com"
					disabled={isInviting}
				/>
			</div>

			<div class="grid gap-2">
				<Label>Role</Label>
				<Select.Root type="single" bind:value={selectedRoleId}>
					<Select.Trigger class="w-full">
						{selectedRoleName()}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Select Role</Select.Label>
							{#each roleTypes as role (role.id)}
								<Select.Item value={String(role.id)} label={role.role_name}>
									{role.role_name}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">
					The role determines what permissions the user will have.
				</p>
			</div>
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (inviteDialogOpen = false)}
				disabled={isInviting}
				class="cursor-pointer"
			>
				Cancel
			</Button>
			<Button
				onclick={handleInviteSubmit}
				disabled={isInviting || !inviteEmail.trim()}
				class="cursor-pointer gap-2"
			>
				{#if isInviting}
					<Spinner class="h-4 w-4" />
					Sending...
				{:else}
					<Mail class="h-4 w-4" />
					Send Invitation
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
