<script lang="ts">
	import type { PageProps } from './types';
	import { goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	import { differenceInDays, parseISO } from 'date-fns';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import {
		ArrowLeft,
		Users,
		Wrench,
		Mail,
		Phone,
		MapPin,
		Globe,
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
		return new Date(dateString).toLocaleDateString('el-GR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatShortDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('el-GR', {
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

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-6xl px-4 py-6 md:px-6">
		<!-- Header -->
		<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onclick={handleBack}
					class="h-9 w-9 shrink-0"
					aria-label="Go back"
				>
					<ArrowLeft class="h-4 w-4" />
				</Button>

				<div class="flex items-center gap-3.5">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Building2 class="h-5 w-5" />
					</div>
					<div>
						<div class="flex items-center gap-2.5">
							<h1 class="text-2xl font-semibold tracking-tight text-foreground">
								{organization.store_name || 'Unnamed Organization'}
							</h1>
							{#if organization.status}
								<Badge variant="secondary" class="gap-1.5 font-normal">
									<span class="size-1.5 rounded-full bg-green-500"></span>
									Active
								</Badge>
							{:else}
								<Badge variant="secondary" class="gap-1.5 font-normal text-destructive">
									<span class="size-1.5 rounded-full bg-destructive"></span>
									Inactive
								</Badge>
							{/if}
						</div>
						<p class="mt-0.5 text-sm text-muted-foreground">
							Created {formatDate(organization.created_at)}
						</p>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					onclick={() => goto(`/app/organization_managment`)}
					size="sm"
					class="h-9 cursor-pointer gap-2"
				>
					<Settings class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Edit</span>
				</Button>
				<Button onclick={openInviteDialog} size="sm" class="h-9 cursor-pointer gap-2">
					<UserPlus class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Invite</span>
				</Button>
			</div>
		</div>

		<!-- Tabs -->
		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List class="mb-8 grid w-full grid-cols-3">
				<Tabs.Trigger value="overview" class="gap-2">
					<Building2 class="h-4 w-4" />
					<span class="hidden sm:inline">Overview</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="equipment" class="gap-2">
					<Wrench class="h-4 w-4" />
					<span class="hidden sm:inline">Equipment</span>
					{#if stats.equipmentCount > 0}
						<Badge variant="secondary" class="ml-1 hidden sm:inline-flex"
							>{stats.equipmentCount}</Badge
						>
					{/if}
				</Tabs.Trigger>
				<Tabs.Trigger value="bonus" class="gap-2">
					<DollarSign class="h-4 w-4" />
					<span class="hidden sm:inline">Bonus</span>
					{#if bonusHistory.length > 0}
						<Badge variant="secondary" class="ml-1 hidden sm:inline-flex"
							>{bonusHistory.length}</Badge
						>
					{/if}
				</Tabs.Trigger>
			</Tabs.List>

			<!-- ====== OVERVIEW TAB ====== -->
			<Tabs.Content value="overview" class="space-y-10">
				<!-- Stats Row -->
				<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div
						class="group relative overflow-hidden rounded-xl border border-border/50 p-5 transition-all duration-300 hover:shadow-sm"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p
									class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
								>
									Employees
								</p>
								<p class="text-2xl font-bold tabular-nums tracking-tight">
									{stats.employeeCount}
								</p>
							</div>
							<div class="rounded-lg bg-primary/10 p-2.5 text-primary">
								<Users class="h-5 w-5" />
							</div>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/50 p-5 transition-all duration-300 hover:shadow-sm"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p
									class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
								>
									Equipment
								</p>
								<p class="text-2xl font-bold tabular-nums tracking-tight">
									{stats.equipmentCount}
								</p>
							</div>
							<div class="rounded-lg bg-primary/10 p-2.5 text-primary">
								<Package class="h-5 w-5" />
							</div>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/50 p-5 transition-all duration-300 hover:shadow-sm"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p
									class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
								>
									Operational
								</p>
								<p class="text-2xl font-bold tabular-nums tracking-tight">
									{stats.activeEquipment}
								</p>
							</div>
							<div class="rounded-lg bg-green-500/10 p-2.5 text-green-600 dark:text-green-400">
								<CheckCircle class="h-5 w-5" />
							</div>
						</div>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/50 p-5 transition-all duration-300 hover:shadow-sm"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p
									class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
								>
									Maintenance
								</p>
								<p class="text-2xl font-bold tabular-nums tracking-tight">
									{stats.maintenanceEquipment}
								</p>
							</div>
							<div
								class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400"
							>
								<AlertTriangle class="h-5 w-5" />
							</div>
						</div>
					</div>
				</div>

				<!-- Organization Details -->
				<section>
					<h2 class="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
						Organization Details
					</h2>
					<div class="rounded-xl border border-border/50">
						<div class="grid grid-cols-1 sm:grid-cols-2">
							<div class="flex items-center gap-3.5 px-5 py-4">
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60"
								>
									<Mail class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0">
									<p class="text-xs font-medium text-muted-foreground">Email</p>
									<p class="truncate text-sm">{organization.email || '—'}</p>
								</div>
							</div>
							<div
								class="flex items-center gap-3.5 border-t border-border/50 px-5 py-4 sm:border-t-0 sm:border-l"
							>
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60"
								>
									<Phone class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0">
									<p class="text-xs font-medium text-muted-foreground">Phone</p>
									<p class="truncate text-sm">{organization.phone || '—'}</p>
								</div>
							</div>
						</div>
						<Separator class="opacity-50" />
						<div class="grid grid-cols-1 sm:grid-cols-2">
							<div class="flex items-center gap-3.5 px-5 py-4">
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60"
								>
									<Globe class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0">
									<p class="text-xs font-medium text-muted-foreground">Country</p>
									<p class="truncate text-sm">{organization.country || '—'}</p>
								</div>
							</div>
							<div
								class="flex items-center gap-3.5 border-t border-border/50 px-5 py-4 sm:border-t-0 sm:border-l"
							>
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60"
								>
									<MapPin class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0">
									<p class="text-xs font-medium text-muted-foreground">Location</p>
									<p class="truncate text-sm">{organization.location || '—'}</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<!-- Team Members -->
				<section>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-sm font-medium uppercase tracking-wider text-muted-foreground">
							Team Members
						</h2>
						{#if employees.length > 0}
							<span class="text-xs tabular-nums text-muted-foreground">
								{employees.length} member{employees.length > 1 ? 's' : ''}
							</span>
						{/if}
					</div>

					{#if employees.length > 0}
						<div class="rounded-xl border border-border/50 overflow-hidden">
							<div class="divide-y divide-border/50">
								{#each employees as employee}
									<div
										class="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/30"
									>
										<Avatar.Root class="h-9 w-9 dark:bg-white">
											<Avatar.Image
												src={employee.image_url || undefined}
												alt={employee.username}
											/>
											<Avatar.Fallback class="text-xs font-medium">
												{getInitials(employee.username)}
											</Avatar.Fallback>
										</Avatar.Root>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium">{employee.username}</p>
											<p class="truncate text-xs text-muted-foreground">
												{employee.email}
											</p>
										</div>
										<Badge variant="secondary" class="shrink-0 text-xs font-normal">
											{employee.role_name}
										</Badge>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div
							class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-14 text-center"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted"
							>
								<Users class="h-6 w-6 text-muted-foreground" />
							</div>
							<p class="text-sm font-medium text-foreground">No team members yet</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Invite someone to get started
							</p>
							<Button
								onclick={openInviteDialog}
								variant="outline"
								size="sm"
								class="mt-5 gap-2"
							>
								<UserPlus class="h-3.5 w-3.5" />
								Invite First Member
							</Button>
						</div>
					{/if}
				</section>
			</Tabs.Content>

			<!-- ====== EQUIPMENT TAB ====== -->
			<Tabs.Content value="equipment" class="space-y-6">
				{#if equipment.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted"
						>
							<Wrench class="h-6 w-6 text-muted-foreground" />
						</div>
						<p class="text-sm font-medium text-foreground">No equipment registered</p>
						<p class="mt-1 text-xs text-muted-foreground">
							This organization has no registered equipment.
						</p>
					</div>
				{:else}
					<div class="rounded-xl border border-border/50 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-border/50 bg-muted/30">
										<th
											class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Name</th
										>
										<th
											class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Model</th
										>
										<th
											class="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell"
											>Serial</th
										>
										<th
											class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Status</th
										>
										<th
											class="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell"
											>Last Service</th
										>
										<th
											class="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell"
											>Next Service</th
										>
										<th
											class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
											>Due</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-border/30">
									{#each equipment as item}
										<tr class="transition-colors hover:bg-muted/20">
											<td class="px-5 py-3.5">
												<div class="flex items-center gap-3">
													{#if item.image_url}
														<img
															src={item.image_url}
															alt={item.name}
															class="h-8 w-8 rounded-lg object-cover"
															width="32"
															height="32"
														/>
													{:else}
														<div
															class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"
														>
															<Wrench class="h-3.5 w-3.5 text-muted-foreground" />
														</div>
													{/if}
													<span class="text-sm font-medium">{item.name}</span>
												</div>
											</td>
											<td class="px-5 py-3.5 text-sm text-muted-foreground"
												>{item.model || '—'}</td
											>
											<td
												class="hidden px-5 py-3.5 font-mono text-xs text-muted-foreground sm:table-cell"
												>{item.serial_number || '—'}</td
											>
											<td class="px-5 py-3.5">
												{#if item.status === 'operational'}
													<Badge
														variant="secondary"
														class="gap-1.5 text-xs font-normal text-green-600 dark:text-green-400"
													>
														<span class="size-1.5 rounded-full bg-green-500"></span>
														Operational
													</Badge>
												{:else if item.status === 'maintenance'}
													<Badge
														variant="secondary"
														class="gap-1.5 text-xs font-normal text-amber-600 dark:text-amber-400"
													>
														<span class="size-1.5 rounded-full bg-amber-500"></span>
														Maintenance
													</Badge>
												{:else}
													<Badge
														variant="secondary"
														class="gap-1.5 text-xs font-normal text-red-600 dark:text-red-400"
													>
														<span class="size-1.5 rounded-full bg-red-500"></span>
														Out of Service
													</Badge>
												{/if}
											</td>
											<td
												class="hidden px-5 py-3.5 text-sm text-muted-foreground md:table-cell"
												>{formatShortDate(item.last_service_date)}</td
											>
											<td
												class="hidden px-5 py-3.5 text-sm text-muted-foreground md:table-cell"
												>{formatShortDate(item.next_service_date)}</td
											>
											<td class="px-5 py-3.5 text-right">
												{#if item.next_service_date}
													{@const daysUntil = differenceInDays(
														parseISO(item.next_service_date),
														new Date()
													)}
													{#if daysUntil < 0}
														<span
															class="text-xs font-medium text-red-600 dark:text-red-400"
														>
															{Math.abs(daysUntil)}d overdue
														</span>
													{:else if daysUntil <= 7}
														<span
															class="text-xs font-medium text-amber-600 dark:text-amber-400"
														>
															{daysUntil}d
														</span>
													{:else}
														<span class="text-xs text-muted-foreground">
															{daysUntil}d
														</span>
													{/if}
												{:else}
													<span class="text-xs text-muted-foreground">—</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</Tabs.Content>

			<!-- ====== BONUS HISTORY TAB ====== -->
			<Tabs.Content value="bonus" class="space-y-4">
				{#if bonusHistory.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted"
						>
							<DollarSign class="h-6 w-6 text-muted-foreground" />
						</div>
						<p class="text-sm font-medium text-foreground">No bonus history</p>
						<p class="mt-1 text-xs text-muted-foreground">
							No bonus payments have been recorded yet.
						</p>
					</div>
				{:else}
					{#each bonusHistory as historyItem}
						{@const isExpanded = isPeriodExpanded(historyItem.period.id)}
						<div class="rounded-xl border border-border/50 overflow-hidden">
							<!-- Quarter Summary Header -->
							<button
								class="w-full px-5 py-4 text-left transition-colors hover:bg-muted/20"
								onclick={() => togglePeriodExpansion(historyItem.period.id)}
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
										>
											<DollarSign class="h-4.5 w-4.5" />
										</div>
										<div>
											<h3 class="text-sm font-semibold">
												{getQuarterLabel(
													historyItem.period.quarter,
													historyItem.period.year
												)}
											</h3>
											<p class="text-xs text-muted-foreground">
												vs {getQuarterLabel(
													historyItem.period.comparison_quarter,
													historyItem.period.comparison_year
												)}
											</p>
										</div>
										<Badge variant="secondary" class="text-xs font-normal">
											{historyItem.period.status}
										</Badge>
									</div>
									<div class="flex items-center gap-5">
										<div class="hidden gap-6 sm:flex">
											<div class="text-right">
												<p class="text-xs text-muted-foreground">Pool</p>
												<p class="text-sm font-semibold tabular-nums">
													{formatCurrency(historyItem.orgData.total_bonus_pool)}
												</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-muted-foreground">Paid</p>
												<p class="text-sm font-semibold tabular-nums">
													{historyItem.payouts.length}
												</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-muted-foreground">Change</p>
												<p
													class="text-sm font-semibold tabular-nums {historyItem.orgData.percentage_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"
												>
													{formatPercentage(historyItem.orgData.percentage_change)}
												</p>
											</div>
										</div>
										{#if isExpanded}
											<ChevronDown class="h-4 w-4 text-muted-foreground" />
										{:else}
											<ChevronRight class="h-4 w-4 text-muted-foreground" />
										{/if}
									</div>
								</div>

								<!-- Mobile Summary -->
								<div class="mt-3 grid grid-cols-3 gap-4 sm:hidden">
									<div>
										<p class="text-xs text-muted-foreground">Pool</p>
										<p class="text-sm font-semibold tabular-nums">
											{formatCurrency(historyItem.orgData.total_bonus_pool)}
										</p>
									</div>
									<div>
										<p class="text-xs text-muted-foreground">Paid</p>
										<p class="text-sm font-semibold tabular-nums">
											{historyItem.payouts.length}
										</p>
									</div>
									<div>
										<p class="text-xs text-muted-foreground">Change</p>
										<p
											class="text-sm font-semibold tabular-nums {historyItem.orgData.percentage_change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"
										>
											{formatPercentage(historyItem.orgData.percentage_change)}
										</p>
									</div>
								</div>
							</button>

							<!-- Expanded Content -->
							{#if isExpanded}
								<div class="border-t border-border/50 px-5 py-5">
									<!-- Org Data Summary -->
									<div
										class="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border/50 p-4 sm:grid-cols-4"
									>
										<div>
											<p class="text-xs text-muted-foreground">Current Kilos</p>
											<p class="text-sm font-semibold tabular-nums">
												{formatNumber(historyItem.orgData.current_kilos)} kg
											</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Previous Kilos</p>
											<p class="text-sm font-semibold tabular-nums">
												{formatNumber(historyItem.orgData.previous_kilos)} kg
											</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Difference</p>
											<p
												class="flex items-center gap-1 text-sm font-semibold tabular-nums {historyItem.orgData.kilo_difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"
											>
												{#if historyItem.orgData.kilo_difference >= 0}
													<TrendingUp class="h-3.5 w-3.5" />
												{:else}
													<TrendingDown class="h-3.5 w-3.5" />
												{/if}
												{formatNumber(Math.abs(historyItem.orgData.kilo_difference))} kg
											</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Above Network Avg</p>
											{#if historyItem.orgData.above_network_average}
												<Badge
													variant="secondary"
													class="mt-1 gap-1 border-0 bg-green-500/10 text-xs font-normal text-green-600 hover:bg-green-500/20 dark:text-green-400"
												>
													<CheckCircle class="h-3 w-3" /> Yes
												</Badge>
											{:else}
												<Badge variant="secondary" class="mt-1 text-xs font-normal"
													>No</Badge
												>
											{/if}
										</div>
									</div>

									<!-- Employee Payouts -->
									<h4
										class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										Employee Payouts
									</h4>
									{#if historyItem.payouts.length === 0}
										<p class="text-sm text-muted-foreground">
											No employee payouts for this period.
										</p>
									{:else}
										<div class="overflow-x-auto rounded-lg border border-border/50">
											<table class="w-full">
												<thead>
													<tr class="border-b border-border/50 bg-muted/20">
														<th
															class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
															>Employee</th
														>
														<th
															class="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell"
															>Hours</th
														>
														<th
															class="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell"
															>Shifts</th
														>
														<th
															class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
															>Share</th
														>
														<th
															class="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
															>Amount</th
														>
													</tr>
												</thead>
												<tbody class="divide-y divide-border/30">
													{#each historyItem.payouts as payout}
														<tr class="transition-colors hover:bg-muted/20">
															<td class="px-4 py-3">
																<div class="flex items-center gap-3">
																	<Avatar.Root class="h-7 w-7 dark:bg-white">
																		<Avatar.Image
																			src={payout.employee?.image_url || undefined}
																			alt={payout.employee?.username || 'Employee'}
																		/>
																		<Avatar.Fallback class="text-[10px] font-medium">
																			{getInitials(
																				payout.employee?.username || '??'
																			)}
																		</Avatar.Fallback>
																	</Avatar.Root>
																	<div class="min-w-0">
																		<p class="truncate text-sm font-medium">
																			{payout.employee?.username || 'Unknown'}
																		</p>
																		<p
																			class="hidden truncate text-xs text-muted-foreground sm:block"
																		>
																			{payout.employee?.email || ''}
																		</p>
																	</div>
																</div>
															</td>
															<td
																class="hidden px-4 py-3 text-sm tabular-nums text-muted-foreground sm:table-cell"
															>
																{payout.hours_worked?.toFixed(1) || '0'}h
															</td>
															<td
																class="hidden px-4 py-3 text-sm tabular-nums text-muted-foreground sm:table-cell"
															>
																{payout.total_shifts_in_pool}
															</td>
															<td
																class="px-4 py-3 text-sm tabular-nums text-muted-foreground"
															>
																{payout.percentage_share?.toFixed(1) || '0'}%
															</td>
															<td class="px-4 py-3 text-right">
																<span class="text-sm font-semibold tabular-nums">
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
						</div>
					{/each}
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
					autocomplete="email"
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
			<Button
				variant="outline"
				onclick={() => (inviteDialogOpen = false)}
				disabled={isInviting}
			>
				Cancel
			</Button>
			<Button
				onclick={handleInviteSubmit}
				disabled={isInviting || !inviteEmail.trim()}
				class="gap-2"
			>
				{#if isInviting}
					<Spinner class="h-4 w-4" />
					Sending…
				{:else}
					<Mail class="h-4 w-4" />
					Send Invitation
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
