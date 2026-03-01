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
		Mail,
		UserPlus,
		Building2,
		Users,
		Cog,
		Award,
		ClipboardList,
		Calendar,
		Search,
		TrendingUp,
		CheckCircle2,
		Settings,
		Star,
		ListChecks,
		CalendarCheck,
		Phone,
		ChevronDown
	} from 'lucide-svelte';
	import { inviteUserToOrg } from './data.remote';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import type { RoleTypes } from '$lib/models/database.types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart, PieChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { getEvaluations } from '$lib/api/trainers/trainer_managment/data.remote';
	import ImagePreviewModal from '$lib/components/custom/ImagePreviewModal.svelte';

	let { data }: PageProps = $props();

	let organization = $derived(data.organization);
	let roleTypes = $derived(data.roleTypes);
	// Invite modal state
	let inviteDialogOpen = $state(false);
	let isInviting = $state(false);
	let inviteEmail = $state('');
	let selectedRoleId = $state('2');

	// Tab state
	let staffSearch = $state('');

	// Derived data from server load
	let employees = $derived(data.employees);
	let equipment = $derived(data.equipment);
	let bonusHistory = $derived(data.bonusHistory);
	let stats = $derived(data.stats);

	let filteredStaff = $derived(
		staffSearch.trim()
			? employees.filter(
					(e) =>
						(e.full_name ?? '').toLowerCase().includes(staffSearch.toLowerCase()) ||
						(e.username ?? '').toLowerCase().includes(staffSearch.toLowerCase()) ||
						(e.email ?? '').toLowerCase().includes(staffSearch.toLowerCase())
				)
			: employees
	);

	let equipmentCounts = $derived({
		operational: equipment.filter((e) => e.status === 'operational').length,
		maintenance: equipment.filter((e) => e.status === 'maintenance').length,
		broken: equipment.filter((e) => e.status === 'broken').length
	});

	let bonusChartData = $derived(
		[...bonusHistory]
			.sort((a, b) =>
				a.period.year !== b.period.year
					? a.period.year - b.period.year
					: a.period.quarter - b.period.quarter
			)
			.map((item) => ({
				period: `Q${item.period.quarter} '${String(item.period.year).slice(-2)}`,
				bonus: item.orgData.final_bonus,
				percentage: item.orgData.percentage_change
			}))
	);

	let expandedQuarters = $state<Set<number>>(new Set());

	function toggleQuarter(periodId: number) {
		const next = new Set(expandedQuarters);
		if (next.has(periodId)) {
			next.delete(periodId);
		} else {
			next.add(periodId);
		}
		expandedQuarters = next;
	}

	const bonusChartConfig = {
		bonus: { label: 'Final Bonus (€)', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let evaluationsQuery = getEvaluations();
	let orgEvaluations = $derived(
		(evaluationsQuery.current?.evaluations ?? []).filter((e: any) => e.org_id === organization.id)
	);

	// Shifts + tasks from server
	let shiftCountByUser = $derived(data.shiftCountByUser);
	let taskStats = $derived(data.taskStats);

	// Role distribution pie chart
	const PIE_COLORS = [
		'hsl(217 91% 60%)',
		'hsl(142 71% 45%)',
		'hsl(38 92% 50%)',
		'hsl(271 81% 60%)',
		'hsl(0 72% 51%)',
		'hsl(197 97% 42%)'
	];
	let rolePieData = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const emp of employees) {
			const role = emp.role_name || 'Other';
			counts[role] = (counts[role] ?? 0) + 1;
		}
		return Object.entries(counts).map(([role, count], i) => ({
			role,
			count,
			color: PIE_COLORS[i % PIE_COLORS.length]
		}));
	});
	const rolePieChartConfig = { count: { label: 'Members' } } satisfies Chart.ChartConfig;

	// Task summary aggregates
	let taskSummary = $derived.by(() => {
		let td = 0,
			cd = 0,
			tw = 0,
			cw = 0,
			tm = 0,
			cm = 0;
		for (const ts of taskStats) {
			td += ts.daily.total;
			cd += ts.daily.completed;
			tw += ts.weekly.total;
			cw += ts.weekly.completed;
			tm += ts.monthly.total;
			cm += ts.monthly.completed;
		}
		return {
			daily: { total: td, completed: cd, rate: td > 0 ? Math.round((cd / td) * 100) : 0 },
			weekly: { total: tw, completed: cw, rate: tw > 0 ? Math.round((cw / tw) * 100) : 0 },
			monthly: { total: tm, completed: cm, rate: tm > 0 ? Math.round((cm / tm) * 100) : 0 }
		};
	});

	// Task bar chart: daily completion per employee (only those with tasks today)
	let taskChartData = $derived(
		taskStats
			.filter((ts) => ts.daily.total > 0)
			.map((ts) => {
				const emp = employees.find((e) => e.id === ts.userId);
				return {
					name: (emp?.full_name ?? emp?.username ?? '?').split(' ')[0],
					completed: ts.daily.completed,
					remaining: ts.daily.total - ts.daily.completed
				};
			})
	);
	const taskChartConfig = {
		completed: { label: 'Done', color: 'var(--chart-2)' },
		remaining: { label: 'Pending', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;

	function getInitials(fullName: string | null, username: string): string {
		if (fullName) {
			return fullName
				.split(' ')
				.slice(0, 2)
				.map((n: string) => n[0])
				.join('')
				.toUpperCase();
		}
		return username.slice(0, 2).toUpperCase();
	}

	// Format date
	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('el-GR', {
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
	let open = $state(false);
	let imageUrl = $state('');
	function openImageModal(image_url: string | null | undefined) {
		if (!image_url) return;
		open = true;
		imageUrl = image_url;
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 py-6 md:px-6">
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

		<!-- ── Tabbed Detail View ── -->
		<Tabs.Root value="overview" class="mt-6 w-full overflow-visible">
			<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
				{#each [{ value: 'overview', icon: TrendingUp, label: 'Overview' }, { value: 'staff', icon: Users, label: 'Staff' }, { value: 'equipment', icon: Cog, label: 'Equipment' }, { value: 'bonus', icon: Award, label: 'Bonus' }, { value: 'evaluations', icon: ClipboardList, label: 'Evaluations' }, { value: 'tasks', icon: ListChecks, label: 'Tasks' }] as tab}
					<Tabs.Trigger
						value={tab.value}
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground sm:px-4"
					>
						<tab.icon class="h-4 w-4 shrink-0" />
						<span class="hidden sm:inline">{tab.label}</span>
					</Tabs.Trigger>
				{/each}
			</Tabs.List>

			<!-- ── OVERVIEW TAB ── -->
			<Tabs.Content value="overview" class="mt-6 animate-fade-in-left space-y-6">
				<!-- KPI Cards — 6 cards -->
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Staff
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">{stats.employeeCount}</p>
							</div>
							<div class="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
								<Users class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">Members in org</p>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Equipment
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">{stats.equipmentCount}</p>
							</div>
							<div class="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
								<Cog class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">
							{stats.maintenanceEquipment} need service
						</p>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Total Shifts
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">{stats.totalShifts}</p>
							</div>
							<div class="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-600 dark:text-cyan-400">
								<Calendar class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">All recorded shifts</p>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Schedules
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">{stats.schedulesCount}</p>
							</div>
							<div class="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
								<CalendarCheck class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">Weekly schedules</p>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Bonus Periods
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">{bonusHistory.length}</p>
							</div>
							<div
								class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400"
							>
								<Award class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">Bonus records</p>
					</div>

					<div
						class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Evaluations
								</p>
								<p class="text-2xl font-bold tracking-tight tabular-nums">
									{orgEvaluations.length}
								</p>
							</div>
							<div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
								<ClipboardList class="h-5 w-5" />
							</div>
						</div>
						<p class="mt-2 text-[11px] text-muted-foreground">Submitted</p>
					</div>
				</div>

				<!-- Charts row: Bonus Trend + Role Distribution + Tasks Today -->
				<div class="grid gap-4 lg:grid-cols-3">
					<!-- Bonus Trend -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Header class="px-4 pt-4 pb-2">
							<Card.Title class="text-sm font-medium">Bonus Trend</Card.Title>
							<Card.Description class="text-xs">Final bonus per quarter</Card.Description>
						</Card.Header>
						<Card.Content class="px-4 pb-4">
							{#if bonusChartData.length > 0}
								<Chart.Container config={bonusChartConfig} class="h-[160px] w-full">
									<BarChart
										data={bonusChartData}
										xScale={scaleBand().padding(0.6)}
										x="period"
										axis="x"
										series={[
											{
												key: 'bonus',
												label: 'Final Bonus (€)',
												color: bonusChartConfig.bonus.color
											}
										]}
										props={{
											bars: { radius: 4, class: 'transition-opacity hover:opacity-80' },
											xAxis: { tickLabelProps: { class: 'text-[10px] fill-muted-foreground' } }
										}}
									>
										{#snippet tooltip()}
											<Chart.Tooltip>
												{#snippet formatter({ value })}
													<span class="font-medium">€{Number(value).toFixed(2)}</span>
												{/snippet}
											</Chart.Tooltip>
										{/snippet}
									</BarChart>
								</Chart.Container>
							{:else}
								<div
									class="flex h-[160px] items-center justify-center text-sm text-muted-foreground"
								>
									No bonus data yet
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Role Distribution Pie -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Header class="px-4 pt-4 pb-2">
							<Card.Title class="text-sm font-medium">Role Distribution</Card.Title>
							<Card.Description class="text-xs"
								>{stats.employeeCount} members by role</Card.Description
							>
						</Card.Header>
						<Card.Content class="px-4 pb-4">
							{#if rolePieData.length > 0}
								<div class="flex items-center gap-4">
									<Chart.Container config={rolePieChartConfig} class="h-[140px] w-[140px] shrink-0">
										<PieChart
											data={rolePieData}
											key="role"
											value="count"
											c="color"
											innerRadius={42}
											props={{ pie: { motion: 'tween' } }}
										>
											{#snippet tooltip()}
												<Chart.Tooltip hideLabel indicator="line" />
											{/snippet}
										</PieChart>
									</Chart.Container>
									<div class="flex flex-col gap-2">
										{#each rolePieData as d}
											<div class="flex items-center gap-2">
												<div
													class="h-2.5 w-2.5 shrink-0 rounded-full"
													style="background-color: {d.color}"
												></div>
												<span class="min-w-0 truncate text-xs">{d.role}</span>
												<span class="ml-auto text-xs font-semibold">{d.count}</span>
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div
									class="flex h-[140px] items-center justify-center text-sm text-muted-foreground"
								>
									No staff data
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Today's Tasks -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Header class="px-4 pt-4 pb-2">
							<Card.Title class="text-sm font-medium">Today's Tasks</Card.Title>
							<Card.Description class="text-xs">Daily completion for this org</Card.Description>
						</Card.Header>
						<Card.Content class="px-4 pb-4">
							{#if taskSummary.daily.total > 0}
								<!-- Completion ring summary -->
								<div class="mb-3 flex items-center justify-between">
									<div>
										<p class="text-2xl font-bold">{taskSummary.daily.rate}%</p>
										<p class="text-xs text-muted-foreground">
											{taskSummary.daily.completed}/{taskSummary.daily.total} done
										</p>
									</div>
									<div class="text-right text-xs text-muted-foreground">
										<p>{taskSummary.daily.total - taskSummary.daily.completed} pending</p>
									</div>
								</div>
								<div class="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all duration-500"
										style="width: {taskSummary.daily.rate}%"
									></div>
								</div>
								{#if taskChartData.length > 0}
									<Chart.Container config={taskChartConfig} class="h-[80px] w-full">
										<BarChart
											data={taskChartData}
											xScale={scaleBand().padding(0.4)}
											x="name"
											axis="x"
											seriesLayout="stack"
											series={[
												{ key: 'completed', label: 'Done', color: taskChartConfig.completed.color },
												{
													key: 'remaining',
													label: 'Pending',
													color: taskChartConfig.remaining.color
												}
											]}
											props={{
												bars: { radius: 2 },
												xAxis: { tickLabelProps: { class: 'text-[9px] fill-muted-foreground' } }
											}}
										>
											{#snippet tooltip()}
												<Chart.Tooltip />
											{/snippet}
										</BarChart>
									</Chart.Container>
								{/if}
							{:else}
								<div
									class="flex h-[120px] items-center justify-center text-sm text-muted-foreground"
								>
									No tasks assigned today
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</Tabs.Content>

			<!-- ── STAFF TAB ── -->
			<Tabs.Content value="staff" class="mt-6 animate-fade-in-left space-y-4">
				<div class="relative max-w-sm">
					<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input bind:value={staffSearch} placeholder="Search by name or email…" class="pl-9" />
				</div>

				<div class="rounded-xl border border-border/60 bg-card">
					{#if filteredStaff.length === 0}
						<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<Users class="mb-2 h-8 w-8 opacity-40" />
							<p class="text-sm">{staffSearch ? 'No staff found' : 'No staff members'}</p>
						</div>
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row class="hover:bg-transparent">
									<Table.Head class="w-[240px]">Member</Table.Head>
									<Table.Head>Role</Table.Head>
									<Table.Head>Email</Table.Head>
									<Table.Head>Phone</Table.Head>
									<Table.Head class="text-center">Manager</Table.Head>
									<Table.Head class="text-center">Shifts</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each filteredStaff as member (member.id)}
									<Table.Row>
										<Table.Cell>
											<div class="flex items-center gap-3">
												<Avatar.Root class="h-8 w-8">
													<Avatar.Image src={member.image_url} class="dark:bg-white" />
													<Avatar.Fallback class="text-[11px]">
														{getInitials(member.full_name, member.username)}
													</Avatar.Fallback>
												</Avatar.Root>
												<div>
													<p class="text-sm font-medium">{member.full_name ?? member.username}</p>
													<p class="text-xs text-muted-foreground">@{member.username}</p>
												</div>
											</div>
										</Table.Cell>
										<Table.Cell>
											<Badge variant="secondary" class="text-xs">
												{member.role_name || '—'}
											</Badge>
										</Table.Cell>
										<Table.Cell class="text-sm text-muted-foreground"
											>{member.email || '—'}</Table.Cell
										>
										<Table.Cell class="text-sm text-muted-foreground">
											{#if member.phone}
												<span class="flex items-center gap-1">
													<Phone class="h-3 w-3 shrink-0" />{member.phone}
												</span>
											{:else}
												—
											{/if}
										</Table.Cell>
										<Table.Cell class="text-center">
											{#if member.is_manager}
												<CheckCircle2 class="mx-auto h-4 w-4 text-emerald-500" />
											{:else}
												<span class="text-xs text-muted-foreground/40">—</span>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-center">
											<span
												class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums"
											>
												{shiftCountByUser[member.id] ?? 0}
											</span>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				</div>
			</Tabs.Content>

			<!-- ── EQUIPMENT TAB ── -->
			<Tabs.Content value="equipment" class="mt-6 animate-fade-in-left space-y-4">
				<div class="grid grid-cols-3 gap-3">
					<div class="rounded-xl border border-border/60 bg-card p-3 text-center">
						<p class="text-2xl font-bold tabular-nums">{equipmentCounts.operational}</p>
						<p class="mt-1 text-xs text-emerald-600">Operational</p>
					</div>
					<div class="rounded-xl border border-border/60 bg-card p-3 text-center">
						<p class="text-2xl font-bold tabular-nums">{equipmentCounts.maintenance}</p>
						<p class="mt-1 text-xs text-amber-500">Maintenance</p>
					</div>
					<div class="rounded-xl border border-border/60 bg-card p-3 text-center">
						<p class="text-2xl font-bold tabular-nums">{equipmentCounts.broken}</p>
						<p class="mt-1 text-xs text-red-500">Broken</p>
					</div>
				</div>

				<div class="rounded-xl border border-border/60 bg-card">
					{#if equipment.length === 0}
						<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<Cog class="mb-2 h-8 w-8 opacity-40" />
							<p class="text-sm">No equipment registered</p>
						</div>
					{:else}
						<Table.Root>
							<Table.Header>
								<Table.Row class="hover:bg-transparent">
									<Table.Head class="w-[260px]">Equipment</Table.Head>
									<Table.Head>Status</Table.Head>
									<Table.Head>Last Service</Table.Head>
									<Table.Head>Next Service</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each equipment as item (item.id)}
									<Table.Row>
										<Table.Cell>
											<button
												class="flex items-center gap-3"
												onclick={() => {
													openImageModal(item?.image_url);
												}}
											>
												{#if item.image_url}
													<img
														src={item.image_url}
														alt={item.name}
														class="h-8 w-8 rounded-md object-cover"
													/>
												{:else}
													<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
														<Cog class="h-4 w-4 text-muted-foreground" />
													</div>
												{/if}
												<div>
													<p class="text-sm font-medium">{item.name}</p>
													{#if item.model}
														<p class="text-xs text-muted-foreground">{item.model}</p>
													{/if}
												</div>
											</button>
										</Table.Cell>
										<Table.Cell>
											{#if item.status === 'operational'}
												<Badge
													class="border-0 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-400"
													>Operational</Badge
												>
											{:else if item.status === 'maintenance'}
												<Badge
													class="border-0 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400"
													>Maintenance</Badge
												>
											{:else}
												<Badge class="border-0 bg-red-500/10 text-xs text-red-700 dark:text-red-400"
													>Broken</Badge
												>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-sm text-muted-foreground">
											{item.last_service_date ? formatDate(item.last_service_date) : '—'}
										</Table.Cell>
										<Table.Cell class="text-sm">
											{#if item.next_service_date}
												{@const daysUntil = differenceInDays(
													parseISO(item.next_service_date),
													new Date()
												)}
												<span
													class={daysUntil < 0
														? 'text-red-500'
														: daysUntil < 14
															? 'text-amber-500'
															: 'text-muted-foreground'}
												>
													{formatDate(item.next_service_date)}
												</span>
											{:else}
												<span class="text-muted-foreground">—</span>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}
				</div>
			</Tabs.Content>

			<!-- ── BONUS & LEADERBOARD TAB ── -->
			<Tabs.Content value="bonus" class="mt-6 animate-fade-in-left space-y-4">
				{#if bonusHistory.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
						<Award class="mb-3 h-10 w-10 opacity-30" />
						<p class="text-sm">No bonus data for this organization</p>
					</div>
				{:else}
					{@const latest = bonusHistory[0]}
					<!-- Latest Period Summary Card -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Header class="px-4 pt-4 pb-2">
							<div class="flex items-center justify-between">
								<Card.Title class="text-sm font-medium">
									Q{latest.period.quarter}
									{latest.period.year}
								</Card.Title>
								<Badge
									variant={latest.period.status === 'published' ? 'default' : 'secondary'}
									class="text-xs"
								>
									{latest.period.status}
								</Badge>
							</div>
							<Card.Description class="text-xs">Latest bonus period</Card.Description>
						</Card.Header>
						<Card.Content class="px-4 pb-4">
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div class="space-y-1">
									<p class="text-xs tracking-wide text-muted-foreground uppercase">Current kg</p>
									<p class="text-xl font-bold">{latest.orgData.current_kilos}</p>
								</div>
								<div class="space-y-1">
									<p class="text-xs tracking-wide text-muted-foreground uppercase">Previous kg</p>
									<p class="text-xl font-bold">{latest.orgData.previous_kilos}</p>
								</div>
								<div class="space-y-1">
									<p class="text-xs tracking-wide text-muted-foreground uppercase">Change</p>
									<p
										class="text-xl font-bold {latest.orgData.percentage_change >= 0
											? 'text-emerald-600'
											: 'text-red-500'}"
									>
										{latest.orgData.percentage_change >= 0
											? '+'
											: ''}{latest.orgData.percentage_change.toFixed(2)}%
									</p>
								</div>
								<div class="space-y-1">
									<p class="text-xs tracking-wide text-muted-foreground uppercase">Final Bonus</p>
									<p class="text-xl font-bold text-emerald-600">
										€{latest.orgData.final_bonus.toFixed(2)}
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<div class="grid gap-4 lg:grid-cols-2">
						<!-- Bar Chart -->
						<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
							<Card.Header class="px-4 pt-4 pb-2">
								<Card.Title class="text-sm font-medium">Bonus per Period</Card.Title>
							</Card.Header>
							<Card.Content class="px-4 pb-4">
								{#if bonusChartData.length > 0}
									<Chart.Container config={bonusChartConfig} class="h-[180px] w-full">
										<BarChart
											data={bonusChartData}
											xScale={scaleBand().padding(0.6)}
											x="period"
											axis="x"
											series={[
												{
													key: 'bonus',
													label: 'Final Bonus (€)',
													color: bonusChartConfig.bonus.color
												}
											]}
											props={{
												bars: { radius: 4, class: 'transition-opacity hover:opacity-80' },
												xAxis: { tickLabelProps: { class: 'text-[10px] fill-muted-foreground' } }
											}}
										>
											{#snippet tooltip()}
												<Chart.Tooltip>
													{#snippet formatter({ value })}
														<span class="font-medium">€{Number(value).toFixed(2)}</span>
													{/snippet}
												</Chart.Tooltip>
											{/snippet}
										</BarChart>
									</Chart.Container>
								{:else}
									<div
										class="flex h-[180px] items-center justify-center text-sm text-muted-foreground"
									>
										No data
									</div>
								{/if}
							</Card.Content>
						</Card.Root>

						<!-- Employee Payouts — all quarters, collapsible -->
						<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
							<Card.Header class="px-4 pt-4 pb-2">
								<Card.Title class="text-sm font-medium">Employee Payouts</Card.Title>
								<Card.Description class="text-xs">All periods — click to expand</Card.Description>
							</Card.Header>
							<Card.Content class="px-0 pb-0">
								{#if bonusHistory.length === 0}
									<div
										class="flex h-[180px] items-center justify-center text-sm text-muted-foreground"
									>
										No payouts recorded
									</div>
								{:else}
									<div class="max-h-[360px] overflow-y-auto">
										{#each bonusHistory as item (item.period.id)}
											<!-- Quarter header row -->
											<button
												class="flex w-full items-center justify-between border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50"
												onclick={() => toggleQuarter(item.period.id)}
											>
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium"
														>Q{item.period.quarter} {item.period.year}</span
													>
													<Badge
														variant={item.period.status === "published" ? "default" : "secondary"}
														class="text-[10px]"
													>
														{item.period.status}
													</Badge>
													<span class="text-xs text-muted-foreground">
														{item.payouts.length} employees
													</span>
												</div>
												<div class="flex items-center gap-3">
													<span class="text-xs font-semibold text-emerald-600"
														>€{item.orgData.final_bonus.toFixed(2)}</span
													>
													<ChevronDown
														class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {expandedQuarters.has(item.period.id) ? 'rotate-180' : ''}"
													/>
												</div>
											</button>
											
											<!-- Payouts list (expanded) -->
											{#if expandedQuarters.has(item.period.id)}
												<div class="divide-y divide-border/30 bg-muted/20">
													{#if item.payouts.length === 0}
														<p class="px-6 py-3 text-xs text-muted-foreground">
															No payouts recorded for this period
														</p>
													{:else}
														{#each [...item.payouts].sort((a, b) => b.bonus_amount - a.bonus_amount) as payout, i (payout.id)}
															<div class="flex items-center gap-3 px-6 py-2.5">
																<span
																	class="w-4 shrink-0 text-center text-xs font-bold {i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}"
																>
																	{i + 1}
																</span>
																<Avatar.Root class="h-6 w-6 shrink-0">
																	<Avatar.Image src={payout.employee?.image_url ?? undefined} class="dark:bg-white" />
																	<Avatar.Fallback class="text-[9px]">
																		{(payout.employee?.username ?? "?").slice(0, 2).toUpperCase()}
																	</Avatar.Fallback>
																</Avatar.Root>
																<div class="min-w-0 flex-1">
																	<p class="truncate text-xs font-medium">{payout.employee?.username ?? "Unknown"}</p>
																	<p class="text-[10px] text-muted-foreground">{payout.total_shifts_in_pool} shifts</p>
																</div>
																<p class="text-xs font-semibold text-emerald-600">€{payout.bonus_amount.toFixed(2)}</p>
															</div>
														{/each}
													{/if}
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</div>

					<!-- Full Payout History Table -->
					<div class="rounded-xl border border-border/60 bg-card">
						<div class="border-b border-border/40 px-4 py-3">
							<p class="text-sm font-medium">Payout History</p>
						</div>
						<Table.Root>
							<Table.Header>
								<Table.Row class="hover:bg-transparent">
									<Table.Head>Period</Table.Head>
									<Table.Head>Current kg</Table.Head>
									<Table.Head>Change %</Table.Head>
									<Table.Head>Base Bonus</Table.Head>
									<Table.Head>Multiplier</Table.Head>
									<Table.Head>Final Bonus</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each bonusHistory as item}
									<Table.Row>
										<Table.Cell class="font-medium"
											>Q{item.period.quarter} {item.period.year}</Table.Cell
										>
										<Table.Cell>{item.orgData.current_kilos}</Table.Cell>
										<Table.Cell
											class={item.orgData.percentage_change >= 0
												? 'text-emerald-600'
												: 'text-red-500'}
										>
											{item.orgData.percentage_change >= 0
												? '+'
												: ''}{item.orgData.percentage_change.toFixed(2)}%
										</Table.Cell>
										<Table.Cell>€{item.orgData.base_bonus.toFixed(2)}</Table.Cell>
										<Table.Cell>×{item.orgData.multiplier}</Table.Cell>
										<Table.Cell class="font-semibold">
											€{item.orgData.final_bonus.toFixed(2)}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</Tabs.Content>

			<!-- ── EVALUATIONS TAB ── -->
			<Tabs.Content value="evaluations" class="mt-6 animate-fade-in-left space-y-4">
				{#if !evaluationsQuery.current}
					<div class="flex items-center justify-center py-12 text-muted-foreground">
						<Spinner class="mr-2 h-5 w-5" />
						Loading evaluations…
					</div>
				{:else if orgEvaluations.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
						<ClipboardList class="mb-3 h-10 w-10 opacity-30" />
						<p class="text-sm">No evaluations submitted for this organization</p>
					</div>
				{:else}
					{@const avgScore =
						orgEvaluations.reduce((sum: number, e: any) => sum + (e.overall_rating ?? 0), 0) /
						orgEvaluations.length}
					<!-- Summary Card -->
					<Card.Root class="rounded-xl border border-border/60 bg-card p-4">
						<div class="flex items-center gap-4">
							<div class="flex-1 space-y-1">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Average Score
								</p>
								<p class="text-3xl font-bold">
									{avgScore.toFixed(1)}<span class="text-sm font-normal text-muted-foreground"
										>/10</span
									>
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold">{orgEvaluations.length}</p>
								<p class="text-xs text-muted-foreground">evaluations</p>
							</div>
						</div>
						<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-primary transition-all duration-500"
								style="width: {(avgScore / 10) * 100}%"
							></div>
						</div>
					</Card.Root>

					<!-- Evaluation Cards -->
					<div class="space-y-3">
						{#each orgEvaluations as ev (ev.id)}
							<Card.Root class="rounded-xl border border-border/60 bg-card">
								<Card.Content class="p-4">
									<div class="flex items-start justify-between gap-4">
										<div class="flex items-center gap-3">
											<Avatar.Root class="h-9 w-9">
												<Avatar.Image src={ev.profiles?.image_url} />
												<Avatar.Fallback class="text-[11px]">
													{(ev.profiles?.full_name ?? ev.profiles?.username ?? '?')
														.slice(0, 2)
														.toUpperCase()}
												</Avatar.Fallback>
											</Avatar.Root>
											<div>
												<p class="text-sm font-medium">
													{ev.profiles?.full_name ?? ev.profiles?.username ?? 'Unknown Trainer'}
												</p>
												<p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
													<Calendar class="h-3 w-3" />
													{formatDate(ev.visit_date)}
												</p>
											</div>
										</div>
										<div class="text-right">
											{#if ev.overall_rating !== null && ev.overall_rating !== undefined}
												<p class="text-xl font-bold">
													{ev.overall_rating}<span class="text-xs font-normal text-muted-foreground"
														>/10</span
													>
												</p>
											{:else}
												<p class="text-sm text-muted-foreground">No rating</p>
											{/if}
											<Badge variant="secondary" class="mt-1 text-[10px]">{ev.submit}</Badge>
										</div>
									</div>
									{#if ev.overall_rating !== null && ev.overall_rating !== undefined}
										<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
											<div
												class="h-full rounded-full bg-primary transition-all duration-500"
												style="width: {(ev.overall_rating / 10) * 100}%"
											></div>
										</div>
									{/if}
									{#if ev.overall_comments}
										<p class="mt-2 line-clamp-2 text-xs text-muted-foreground">
											{ev.overall_comments}
										</p>
									{/if}
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				{/if}
			</Tabs.Content>

			<!-- ── TASKS TAB ── -->
			<Tabs.Content value="tasks" class="mt-6 animate-fade-in-left space-y-6">
				<!-- Summary KPI cards: Daily / Weekly / Monthly -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<!-- Daily -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Content class="p-4">
							<div class="flex items-center justify-between">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Today — Daily
								</p>
								<Badge variant="secondary" class="text-[10px]">{taskSummary.daily.rate}%</Badge>
							</div>
							<p class="mt-2 text-3xl font-bold tabular-nums">
								{taskSummary.daily.completed}<span
									class="text-base font-normal text-muted-foreground"
									>/{taskSummary.daily.total}</span
								>
							</p>
							<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-emerald-500 transition-all duration-500"
									style="width: {taskSummary.daily.rate}%"
								></div>
							</div>
							<p class="mt-1.5 text-[11px] text-muted-foreground">
								{taskSummary.daily.total - taskSummary.daily.completed} tasks still pending
							</p>
						</Card.Content>
					</Card.Root>

					<!-- Weekly -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Content class="p-4">
							<div class="flex items-center justify-between">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									This Week — Weekly
								</p>
								<Badge variant="secondary" class="text-[10px]">{taskSummary.weekly.rate}%</Badge>
							</div>
							<p class="mt-2 text-3xl font-bold tabular-nums">
								{taskSummary.weekly.completed}<span
									class="text-base font-normal text-muted-foreground"
									>/{taskSummary.weekly.total}</span
								>
							</p>
							<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-blue-500 transition-all duration-500"
									style="width: {taskSummary.weekly.rate}%"
								></div>
							</div>
							<p class="mt-1.5 text-[11px] text-muted-foreground">
								{taskSummary.weekly.total - taskSummary.weekly.completed} tasks still pending
							</p>
						</Card.Content>
					</Card.Root>

					<!-- Monthly -->
					<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card">
						<Card.Content class="p-4">
							<div class="flex items-center justify-between">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									This Month — Monthly
								</p>
								<Badge variant="secondary" class="text-[10px]">{taskSummary.monthly.rate}%</Badge>
							</div>
							<p class="mt-2 text-3xl font-bold tabular-nums">
								{taskSummary.monthly.completed}<span
									class="text-base font-normal text-muted-foreground"
									>/{taskSummary.monthly.total}</span
								>
							</p>
							<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-indigo-500 transition-all duration-500"
									style="width: {taskSummary.monthly.rate}%"
								></div>
							</div>
							<p class="mt-1.5 text-[11px] text-muted-foreground">
								{taskSummary.monthly.total - taskSummary.monthly.completed} tasks still pending
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Today's completion chart + per-employee table -->
				<div class="grid gap-4 lg:grid-cols-5">
					<!-- Stacked bar chart: today's tasks per employee -->
					<Card.Root
						class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-2"
					>
						<Card.Header class="px-4 pt-4 pb-2">
							<Card.Title class="text-sm font-medium">Today's Completion</Card.Title>
							<Card.Description class="text-xs">Daily tasks per staff member</Card.Description>
						</Card.Header>
						<Card.Content class="px-4 pb-4">
							{#if taskChartData.length > 0}
								<Chart.Container config={taskChartConfig} class="h-[220px] w-full">
									<BarChart
										data={taskChartData}
										xScale={scaleBand().padding(0.35)}
										x="name"
										axis="x"
										seriesLayout="stack"
										series={[
											{ key: 'completed', label: 'Done', color: taskChartConfig.completed.color },
											{ key: 'remaining', label: 'Pending', color: taskChartConfig.remaining.color }
										]}
										props={{
											bars: { radius: 3 },
											xAxis: { tickLabelProps: { class: 'text-[10px] fill-muted-foreground' } }
										}}
									>
										{#snippet tooltip()}
											<Chart.Tooltip />
										{/snippet}
									</BarChart>
								</Chart.Container>
							{:else}
								<div
									class="flex h-[220px] items-center justify-center text-sm text-muted-foreground"
								>
									<div class="text-center">
										<ListChecks class="mx-auto mb-2 h-8 w-8 opacity-30" />
										No daily tasks assigned today
									</div>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Per-employee breakdown table -->
					<Card.Root
						class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-3"
					>
						<Card.Header class="px-4 pt-4 pb-2">
							<Card.Title class="text-sm font-medium">Per-Employee Breakdown</Card.Title>
							<Card.Description class="text-xs"
								>Daily · Weekly · Monthly (completed/total)</Card.Description
							>
						</Card.Header>
						<Card.Content class="px-0 pb-0">
							{#if taskStats.every((ts) => ts.daily.total === 0 && ts.weekly.total === 0 && ts.monthly.total === 0)}
								<div
									class="flex h-[220px] items-center justify-center text-sm text-muted-foreground"
								>
									No tasks assigned for this period
								</div>
							{:else}
								<Table.Root>
									<Table.Header>
										<Table.Row class="hover:bg-transparent">
											<Table.Head>Member</Table.Head>
											<Table.Head class="text-center">Daily</Table.Head>
											<Table.Head class="text-center">Weekly</Table.Head>
											<Table.Head class="text-center">Monthly</Table.Head>
											<Table.Head class="text-center">Overall</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each taskStats as ts (ts.userId)}
											{@const emp = employees.find((e) => e.id === ts.userId)}
											{@const total = ts.daily.total + ts.weekly.total + ts.monthly.total}
											{@const done =
												ts.daily.completed + ts.weekly.completed + ts.monthly.completed}
											{@const overallRate = total > 0 ? Math.round((done / total) * 100) : null}
											<Table.Row>
												<Table.Cell>
													<div class="flex items-center gap-2">
														<Avatar.Root class="h-7 w-7">
															<Avatar.Image src={emp?.image_url} />
															<Avatar.Fallback class="text-[10px]">
																{getInitials(emp?.full_name ?? null, emp?.username ?? '?')}
															</Avatar.Fallback>
														</Avatar.Root>
														<p class="text-sm font-medium">
															{emp?.full_name ?? emp?.username ?? '—'}
														</p>
													</div>
												</Table.Cell>
												<Table.Cell class="text-center">
													{#if ts.daily.total > 0}
														<span
															class="text-xs {ts.daily.completed === ts.daily.total
																? 'font-semibold text-emerald-600'
																: ''}"
														>
															{ts.daily.completed}/{ts.daily.total}
														</span>
													{:else}
														<span class="text-xs text-muted-foreground/40">—</span>
													{/if}
												</Table.Cell>
												<Table.Cell class="text-center">
													{#if ts.weekly.total > 0}
														<span
															class="text-xs {ts.weekly.completed === ts.weekly.total
																? 'font-semibold text-emerald-600'
																: ''}"
														>
															{ts.weekly.completed}/{ts.weekly.total}
														</span>
													{:else}
														<span class="text-xs text-muted-foreground/40">—</span>
													{/if}
												</Table.Cell>
												<Table.Cell class="text-center">
													{#if ts.monthly.total > 0}
														<span
															class="text-xs {ts.monthly.completed === ts.monthly.total
																? 'font-semibold text-emerald-600'
																: ''}"
														>
															{ts.monthly.completed}/{ts.monthly.total}
														</span>
													{:else}
														<span class="text-xs text-muted-foreground/40">—</span>
													{/if}
												</Table.Cell>
												<Table.Cell class="text-center">
													{#if overallRate !== null}
														<div class="flex items-center justify-center gap-1.5">
															<div class="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
																<div
																	class="h-full rounded-full {overallRate === 100
																		? 'bg-emerald-500'
																		: overallRate >= 50
																			? 'bg-blue-500'
																			: 'bg-amber-500'} transition-all"
																	style="width: {overallRate}%"
																></div>
															</div>
															<span class="text-xs tabular-nums">{overallRate}%</span>
														</div>
													{:else}
														<span class="text-xs text-muted-foreground/40">—</span>
													{/if}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</main>
</div>

<ImagePreviewModal {imageUrl} bind:open />

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
					Sending…
				{:else}
					<Mail class="h-4 w-4" />
					Send Invitation
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
