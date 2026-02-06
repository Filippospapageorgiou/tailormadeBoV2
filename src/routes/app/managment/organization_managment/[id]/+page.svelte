<script lang="ts">
	import type { PageProps } from './types';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { differenceInDays, parseISO } from 'date-fns';
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
		Settings,
		ChevronDown,
		ChevronRight,
		TrendingUp,
		TrendingDown,
		DollarSign,
		Clock,
		Package
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
	let bonusHistory = $derived(data.bonusHistory);

	// Tab state
	let activeTab = $state('overview');

	// Invite modal state
	let inviteDialogOpen = $state(false);
	let isInviting = $state(false);
	let inviteEmail = $state('');
	let selectedRoleId = $state('2');

	// Bonus history expanded state
	let expandedPeriods = $state<Set<number>>(new Set());

	// Format date
	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatShortDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatCurrency(amount: number | null): string {
		if (amount === null || amount === undefined) return '€0.00';
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	function formatNumber(num: number | null): string {
		if (num === null || num === undefined) return '0';
		return new Intl.NumberFormat('el-GR').format(num);
	}

	function formatPercentage(num: number | null): string {
		if (num === null || num === undefined) return '0%';
		return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
	}

	function getQuarterLabel(quarter: number, year: number): string {
		return `Q${quarter} ${year}`;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'operational':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'maintenance':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
			case 'out_of_service':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'operational':
				return 'Operational';
			case 'maintenance':
				return 'Maintenance';
			case 'out_of_service':
				return 'Out of Service';
			default:
				return status;
		}
	}

	// Get selected role name for display
	let selectedRoleName = $derived(() => {
		const role = roleTypes.find((r: RoleTypes) => r.id === parseInt(selectedRoleId, 10));
		return role?.role_name || 'Select a role';
	});

	function handleBack() {
		goto('/app/managment/organization_managment');
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

	function togglePeriodExpansion(periodId: number) {
		const newSet = new Set(expandedPeriods);
		if (newSet.has(periodId)) {
			newSet.delete(periodId);
		} else {
			newSet.add(periodId);
		}
		expandedPeriods = newSet;
	}

	function isPeriodExpanded(periodId: number): boolean {
		return expandedPeriods.has(periodId);
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-6xl px-4 py-6 md:px-6">
		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
								class="border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400"
							>
								<span class="mr-1 size-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
								active
							</Badge>
						{:else}
							<Badge class="border-none bg-destructive/10 text-destructive">
								<span class="mr-1 size-1.5 rounded-full bg-destructive"></span>
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

		<!-- Tabs -->
		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List class="mb-6 grid w-full grid-cols-3">
				<Tabs.Trigger value="overview" class="gap-2">
					<Building2 class="h-4 w-4" />
					<span class="hidden sm:inline">Overview</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="equipment" class="gap-2">
					<Wrench class="h-4 w-4" />
					<span class="hidden sm:inline">Equipment</span>
					<Badge variant="secondary" class="ml-1 hidden sm:inline-flex"
						>{stats.equipmentCount}</Badge
					>
				</Tabs.Trigger>
				<Tabs.Trigger value="bonus" class="gap-2">
					<DollarSign class="h-4 w-4" />
					<span class="hidden sm:inline">Bonus History</span>
					<Badge variant="secondary" class="ml-1 hidden sm:inline-flex">{bonusHistory.length}</Badge
					>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Overview Tab -->
			<Tabs.Content value="overview" class="space-y-6">
				<!-- Stats Cards Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Employees Card -->
					<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
						<div
							class="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/20 via-card/80 to-indigo-500/30"
						></div>
						<div
							class="absolute -top-16 -right-16 -z-10 h-32 w-32 rounded-full bg-blue-500/25 blur-3xl"
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

				<!-- Organization Details & Invite Cards -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Contact Information -->
					<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
						<div
							class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-card/80 to-secondary/30"
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
						<Card.Header class="p-0 pb-4">
							<Card.Title class="flex items-center gap-2 text-lg">
								<UserPlus class="h-5 w-5" />
								Invite Team Member
							</Card.Title>
							<Card.Description>
								Invite the first admin to manage this organization.
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-0">
							{#if stats.employeeCount === 0}
								<div class="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
									<p class="text-sm text-amber-700 dark:text-amber-400">
										<AlertTriangle class="mr-2 inline h-4 w-4" />
										This organization has no members yet.
									</p>
								</div>
							{:else}
								<div class="rounded-lg border border-dashed border-green-500/50 bg-green-500/5 p-4">
									<p class="text-sm text-green-700 dark:text-green-400">
										<CheckCircle class="mr-2 inline h-4 w-4" />
										{stats.employeeCount} member{stats.employeeCount > 1 ? 's' : ''}
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

				<!-- Team Members Preview -->
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
						</Card.Header>
						<Card.Content class="p-0">
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{#each employees as employee}
									<div
										class="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3"
									>
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
			</Tabs.Content>

			<!-- Equipment Tab -->
			<Tabs.Content value="equipment" class="space-y-6">
				<Card.Root class="relative overflow-hidden rounded-2xl backdrop-blur-xl">
					<div
						class="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/10 via-card/90 to-pink-500/10"
					></div>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Package class="h-5 w-5" />
							Equipment List
						</Card.Title>
						<Card.Description>All equipment registered to this organization</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if equipment.length === 0}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<Wrench class="h-12 w-12 text-muted-foreground/50" />
								<p class="mt-4 text-lg font-medium text-muted-foreground">No equipment found</p>
								<p class="text-sm text-muted-foreground">
									This organization has no registered equipment.
								</p>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full">
									<thead>
										<tr class="border-b border-border/50">
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Name</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Model</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Serial Number</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Status</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Last Service</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Next Service</th
											>
											<th
												class="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
												>Overdue</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-border/30">
										{#each equipment as item}
											<tr class="transition-colors hover:bg-muted/30">
												<td class="px-4 py-3">
													<div class="flex items-center gap-3">
														{#if item.image_url}
															<img
																src={item.image_url}
																alt={item.name}
																class="h-8 w-8 rounded object-cover"
															/>
														{:else}
															<div
																class="flex h-8 w-8 items-center justify-center rounded bg-muted"
															>
																<Wrench class="h-4 w-4 text-muted-foreground" />
															</div>
														{/if}
														<span class="font-medium">{item.name}</span>
													</div>
												</td>
												<td class="px-4 py-3 text-sm text-muted-foreground">{item.model || '—'}</td>
												<td class="px-4 py-3 font-mono text-sm text-muted-foreground"
													>{item.serial_number || '—'}</td
												>
												<td class="px-4 py-3">
													<Badge class={getStatusColor(item.status)}>
														{getStatusLabel(item.status)}
													</Badge>
												</td>
												<td class="px-4 py-3 text-sm text-muted-foreground"
													>{formatShortDate(item.last_service_date)}</td
												>
												<td class="px-4 py-3 text-sm text-muted-foreground"
													>{formatShortDate(item.next_service_date)}</td
												>
												<td class="px-4 py-3 text-sm">
													{#if item.next_service_date}
														{@const daysUntil = differenceInDays(
															parseISO(item.next_service_date),
															new Date()
														)}
														{#if daysUntil < 0}
															<span class="font-medium text-red-600 dark:text-red-400">
																{Math.abs(daysUntil)} days overdue
															</span>
														{:else if daysUntil === 0}
															<span class="font-medium text-amber-600 dark:text-amber-400">
																Today
															</span>
														{:else if daysUntil <= 7}
															<span class="font-medium text-amber-600 dark:text-amber-400">
																{daysUntil} days
															</span>
														{:else if daysUntil <= 30}
															<span class="text-muted-foreground">
																{daysUntil} days
															</span>
														{:else}
															<span class="text-muted-foreground">
																{daysUntil} days
															</span>
														{/if}
													{:else}
														<span class="text-muted-foreground">—</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<!-- Bonus History Tab -->
			<Tabs.Content value="bonus" class="space-y-6">
				{#if bonusHistory.length === 0}
					<Card.Root class="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl">
						<div
							class="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/10 via-card/90 to-orange-500/10"
						></div>
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<DollarSign class="h-12 w-12 text-muted-foreground/50" />
							<p class="mt-4 text-lg font-medium text-muted-foreground">No bonus history</p>
							<p class="text-sm text-muted-foreground">
								No bonus payments have been recorded for this organization.
							</p>
						</div>
					</Card.Root>
				{:else}
					<div class="space-y-4">
						{#each bonusHistory as historyItem}
							{@const isExpanded = isPeriodExpanded(historyItem.period.id)}
							<Card.Root class="relative overflow-hidden rounded-2xl backdrop-blur-xl">
								<div
									class="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-card/90 to-teal-500/10"
								></div>

								<!-- Quarter Summary Header -->
								<button
									class="w-full p-6 text-left transition-colors hover:bg-muted/20"
									onclick={() => togglePeriodExpansion(historyItem.period.id)}
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-4">
											<div
												class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10"
											>
												<DollarSign class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
											</div>
											<div>
												<h3 class="text-lg font-semibold">
													{getQuarterLabel(historyItem.period.quarter, historyItem.period.year)}
												</h3>
												<p class="text-sm text-muted-foreground">
													vs {getQuarterLabel(
														historyItem.period.comparison_quarter,
														historyItem.period.comparison_year
													)}
												</p>
											</div>
											<Badge
												class={historyItem.period.status === 'published'
													? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
													: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}
											>
												{historyItem.period.status}
											</Badge>
										</div>
										<div class="flex items-center gap-6">
											<!-- Summary Stats -->
											<div class="hidden gap-6 sm:flex">
												<div class="text-right">
													<p class="text-xs text-muted-foreground">Total Pool</p>
													<p class="font-semibold text-emerald-600 dark:text-emerald-400">
														{formatCurrency(historyItem.orgData.total_bonus_pool)}
													</p>
												</div>
												<div class="text-right">
													<p class="text-xs text-muted-foreground">Employees Paid</p>
													<p class="font-semibold">{historyItem.payouts.length}</p>
												</div>
												<div class="text-right">
													<p class="text-xs text-muted-foreground">Change</p>
													<p
														class={`font-semibold ${historyItem.orgData.percentage_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
													>
														{formatPercentage(historyItem.orgData.percentage_change)}
													</p>
												</div>
											</div>
											{#if isExpanded}
												<ChevronDown class="h-5 w-5 text-muted-foreground transition-transform" />
											{:else}
												<ChevronRight class="h-5 w-5 text-muted-foreground transition-transform" />
											{/if}
										</div>
									</div>

									<!-- Mobile Summary Stats -->
									<div class="mt-4 grid grid-cols-3 gap-4 sm:hidden">
										<div>
											<p class="text-xs text-muted-foreground">Total Pool</p>
											<p class="font-semibold text-emerald-600 dark:text-emerald-400">
												{formatCurrency(historyItem.orgData.total_bonus_pool)}
											</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Employees</p>
											<p class="font-semibold">{historyItem.payouts.length}</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Change</p>
											<p
												class={`font-semibold ${historyItem.orgData.percentage_change >= 0 ? 'text-green-600' : 'text-red-600'}`}
											>
												{formatPercentage(historyItem.orgData.percentage_change)}
											</p>
										</div>
									</div>
								</button>

								<!-- Expanded Content -->
								{#if isExpanded}
									<div class="border-t border-border/50 p-6">
										<!-- Org Data Summary -->
										<div
											class="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-4"
										>
											<div>
												<p class="text-xs text-muted-foreground">Current Kilos</p>
												<p class="font-semibold">
													{formatNumber(historyItem.orgData.current_kilos)} kg
												</p>
											</div>
											<div>
												<p class="text-xs text-muted-foreground">Previous Kilos</p>
												<p class="font-semibold">
													{formatNumber(historyItem.orgData.previous_kilos)} kg
												</p>
											</div>
											<div>
												<p class="text-xs text-muted-foreground">Difference</p>
												<p
													class={`flex items-center gap-1 font-semibold ${historyItem.orgData.kilo_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}
												>
													{#if historyItem.orgData.kilo_difference >= 0}
														<TrendingUp class="h-4 w-4" />
													{:else}
														<TrendingDown class="h-4 w-4" />
													{/if}
													{formatNumber(Math.abs(historyItem.orgData.kilo_difference))} kg
												</p>
											</div>
											<div>
												<p class="text-xs text-muted-foreground">Above Network Avg</p>
												<p class="font-semibold">
													{#if historyItem.orgData.above_network_average}
														<Badge
															class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
															>Yes</Badge
														>
													{:else}
														<Badge
															class="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
															>No</Badge
														>
													{/if}
												</p>
											</div>
										</div>

										<!-- Employee Payouts Table -->
										<h4 class="mb-3 font-medium">Employee Payouts</h4>
										{#if historyItem.payouts.length === 0}
											<p class="text-sm text-muted-foreground">
												No employee payouts for this period.
											</p>
										{:else}
											<div class="overflow-x-auto">
												<table class="w-full">
													<thead>
														<tr class="border-b border-border/50">
															<th
																class="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
																>Employee</th
															>
															<th
																class="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
																>Hours Worked</th
															>
															<th
																class="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
																>Shifts</th
															>
															<th
																class="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
																>Share %</th
															>
															<th
																class="px-4 py-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase"
																>Bonus Amount</th
															>
														</tr>
													</thead>
													<tbody class="divide-y divide-border/30">
														{#each historyItem.payouts as payout}
															<tr class="transition-colors hover:bg-muted/20">
																<td class="px-4 py-3">
																	<div class="flex items-center gap-3">
																		<img
																			src={payout.employee?.image_url || '/default-avatar.png'}
																			alt={payout.employee?.username || 'Employee'}
																			class="h-8 w-8 rounded-full object-cover"
																		/>
																		<div>
																			<p class="font-medium">
																				{payout.employee?.username || 'Unknown'}
																			</p>
																			<p class="text-xs text-muted-foreground">
																				{payout.employee?.email || ''}
																			</p>
																		</div>
																	</div>
																</td>
																<td class="px-4 py-3 text-sm">
																	<div class="flex items-center gap-1 text-muted-foreground">
																		<Clock class="h-3 w-3" />
																		{payout.hours_worked?.toFixed(1) || '0'} hrs
																	</div>
																</td>
																<td class="px-4 py-3 text-sm text-muted-foreground"
																	>{payout.total_shifts_in_pool}</td
																>
																<td class="px-4 py-3 text-sm text-muted-foreground"
																	>{payout.percentage_share?.toFixed(1) || '0'}%</td
																>
																<td class="px-4 py-3 text-right">
																	<span
																		class="font-semibold text-emerald-600 dark:text-emerald-400"
																	>
																		{formatCurrency(payout.bonus_amount)}
																	</span>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										{/if}
									</div>
								{/if}
							</Card.Root>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</main>
</div>

<!-- Invite User Dialog -->
<Dialog.Root bind:open={inviteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Invite User to {organization.store_name}</Dialog.Title>
			<Dialog.Description>Send an email invitation to join this organization.</Dialog.Description>
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
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (inviteDialogOpen = false)} disabled={isInviting}>
				Cancel
			</Button>
			<Button
				onclick={handleInviteSubmit}
				disabled={isInviting || !inviteEmail.trim()}
				class="gap-2"
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
