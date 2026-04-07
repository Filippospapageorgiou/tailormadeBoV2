<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Wrench,
		Building2,
		AlertTriangle,
		Search,
		Filter,
		RefreshCw,
		CheckCircle2,
		Clock,
		Cog,
		ArrowRight,
		Monitor
	} from 'lucide-svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { PieChart } from 'layerchart';
	import {
		getAllOrgsWithEquipment,
		getRecentIssues
	} from '$lib/api/trainers/equipment/data.remote.js';
	import ImagePreviewModal from '$lib/components/custom/ImagePreviewModal.svelte';
	import OrgSummaryCard from './components/OrgSummaryCard.svelte';
	import { differenceInDays, parseISO } from 'date-fns';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	let previewOpen = $state(false);
	let previewUrl = $state<string | null>(null);

	function openPreview(url: string) {
		previewUrl = url;
		previewOpen = true;
	}

	// Queries
	let orgsQuery = getAllOrgsWithEquipment();
	let issuesQuery = getRecentIssues();

	type OrgData = {
		org_id: number;
		org: { id: number; store_name: string; location: string | null; phone: string | null };
		isAssigned: boolean;
		equipments: any[];
		counts: {
			total: number;
			overdue: number;
			broken: number;
			maintenance: number;
			operational: number;
		};
		lastVisitDate: string | null;
		lastVisitStatus: string | null;
	};

	let allOrgs = $derived((orgsQuery?.current?.orgs ?? []) as OrgData[]);
	let recentIssues = $derived((issuesQuery?.current?.issues ?? []) as any[]);
	let loading = $derived(orgsQuery?.current === undefined);

	// Filters
	let searchQuery = $state('');
	let showAssignedOnly = $state(false);

	// Global stats
	let globalStats = $derived({
		totalOrgs: allOrgs.length,
		totalEquipment: allOrgs.reduce((sum, o) => sum + o.counts.total, 0),
		totalOverdue: allOrgs.reduce((sum, o) => sum + o.counts.overdue, 0),
		totalBroken: allOrgs.reduce((sum, o) => sum + o.counts.broken, 0),
		totalMaintenance: allOrgs.reduce((sum, o) => sum + o.counts.maintenance, 0),
		totalOperational: allOrgs.reduce((sum, o) => sum + o.counts.operational, 0)
	});

	// Service status computed from all equipment
	let serviceStats = $derived.by(() => {
		const today = new Date();
		let good = 0,
			warning = 0,
			overdue = 0,
			noDate = 0;
		for (const org of allOrgs) {
			for (const eq of org.equipments) {
				if (!eq.next_service_date) {
					noDate++;
					continue;
				}
				const days = differenceInDays(parseISO(eq.next_service_date), today);
				if (days < 0) overdue++;
				else if (days < 14) warning++;
				else good++;
			}
		}
		return { good, warning, overdue, noDate };
	});

	// Chart configs
	const statusChartConfig = {
		operational: { label: 'Λειτουργικά', color: 'hsl(152 60% 45%)' },
		maintenance: { label: 'Σε service', color: 'hsl(38 92% 50%)' },
		broken: { label: 'Βλάβη', color: 'hsl(0 72% 51%)' }
	} satisfies Chart.ChartConfig;

	const serviceChartConfig = {
		good: { label: 'Εντάξει', color: 'hsl(152 60% 45%)' },
		warning: { label: 'Σύντομα', color: 'hsl(38 92% 50%)' },
		overdue: { label: 'Εκπρόθεσμα', color: 'hsl(0 72% 51%)' }
	} satisfies Chart.ChartConfig;

	let statusPieData = $derived(
		[
			{
				status: 'operational',
				count: globalStats.totalOperational,
				color: statusChartConfig.operational.color
			},
			{
				status: 'maintenance',
				count: globalStats.totalMaintenance,
				color: statusChartConfig.maintenance.color
			},
			{ status: 'broken', count: globalStats.totalBroken, color: statusChartConfig.broken.color }
		].filter((d) => d.count > 0)
	);

	let servicePieData = $derived(
		[
			{ status: 'good', count: serviceStats.good, color: serviceChartConfig.good.color },
			{ status: 'warning', count: serviceStats.warning, color: serviceChartConfig.warning.color },
			{ status: 'overdue', count: serviceStats.overdue, color: serviceChartConfig.overdue.color }
		].filter((d) => d.count > 0)
	);

	let filteredOrgs = $derived.by(() => {
		let orgs = allOrgs;
		if (showAssignedOnly) orgs = orgs.filter((o) => o.isAssigned);
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			orgs = orgs.filter(
				(o) =>
					o.org.store_name.toLowerCase().includes(q) || o.org.location?.toLowerCase().includes(q)
			);
		}
		return [...orgs].sort((a, b) => {
			if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
			const aIssues = a.counts.overdue + a.counts.broken;
			const bIssues = b.counts.overdue + b.counts.broken;
			if (aIssues !== bIssues) return bIssues - aIssues;
			return a.org.store_name.localeCompare(b.org.store_name);
		});
	});

	let isRefreshing = $state(false);
	async function refresh() {
		isRefreshing = true;
		await orgsQuery.refresh();
		await issuesQuery.refresh();
		isRefreshing = false;
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-4 pt-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-xl bg-primary/10 p-2.5">
				<Cog class="h-5 w-5 text-primary" />
			</div>
			<div>
				<h1 class="text-xl font-semibold">Εξοπλισμός</h1>
				<p class="text-sm text-muted-foreground">
					{loading
						? '...'
						: `${globalStats.totalOrgs} καταστήματα · ${globalStats.totalEquipment} μηχανήματα`}
				</p>
			</div>
		</div>
		<Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl" onclick={refresh}>
			<RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}" />
		</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each [{ label: 'Μηχανήματα', value: globalStats.totalEquipment, icon: Cog, color: 'text-foreground', bg: 'bg-muted/50' }, { label: 'Λειτουργικά', value: globalStats.totalOperational, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }, { label: 'Σε Service', value: globalStats.totalMaintenance, icon: Wrench, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' }, { label: 'Βλάβες / Εκπρόθ.', value: globalStats.totalBroken + globalStats.totalOverdue, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' }] as stat}
			<Card.Root
				class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm"
			>
				<div class="flex items-start justify-between">
					<div>
						<p class="text-xs text-muted-foreground">{stat.label}</p>
						<p class="mt-1 text-2xl font-bold {stat.color}">{loading ? '—' : stat.value}</p>
					</div>
					<div class="rounded-lg p-2 {stat.bg}">
						<stat.icon class="h-4 w-4 {stat.color}" />
					</div>
				</div>
			</Card.Root>
		{/each}
	</div>

	<!-- Charts Row -->
	{#if !loading && globalStats.totalEquipment > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- Equipment Status Pie -->
			<Card.Root
				class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
			>
				<div
					class="absolute -top-24 -right-24 -z-10 h-48 w-48 rounded-full bg-orange-400/8 blur-3xl"
				></div>
				<Card.Header class="pb-2">
					<Card.Title class="text-sm">Κατάσταση Εξοπλισμού</Card.Title>
					<Card.Description class="text-xs"
						>{globalStats.totalEquipment} συσκευές συνολικά</Card.Description
					>
				</Card.Header>
				<Card.Content>
					{#if statusPieData.length > 0}
						<div class="flex items-center gap-6">
							<div class="shrink-0">
								<Chart.Container
									config={statusChartConfig}
									class="aspect-square h-[130px] w-[130px]"
								>
									<PieChart
										data={statusPieData}
										key="status"
										value="count"
										c="color"
										innerRadius={40}
										props={{ pie: { motion: 'tween' } }}
									>
										{#snippet tooltip()}
											<Chart.Tooltip hideLabel indicator="line" />
										{/snippet}
									</PieChart>
								</Chart.Container>
							</div>
							<div class="flex flex-1 flex-col gap-2.5">
								<div class="flex items-center gap-2">
									<div
										class="h-2.5 w-2.5 rounded-full"
										style="background-color: {statusChartConfig.operational.color}"
									></div>
									<span class="flex-1 text-xs">Λειτουργικά</span>
									<span class="text-xs font-semibold">{globalStats.totalOperational}</span>
								</div>
								<div class="flex items-center gap-2">
									<div
										class="h-2.5 w-2.5 rounded-full"
										style="background-color: {statusChartConfig.maintenance.color}"
									></div>
									<span class="flex-1 text-xs">Σε service</span>
									<span class="text-xs font-semibold">{globalStats.totalMaintenance}</span>
								</div>
								<div class="flex items-center gap-2">
									<div
										class="h-2.5 w-2.5 rounded-full"
										style="background-color: {statusChartConfig.broken.color}"
									></div>
									<span class="flex-1 text-xs">Βλάβη</span>
									<span class="text-xs font-semibold">{globalStats.totalBroken}</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="flex h-[130px] items-center justify-center text-sm text-muted-foreground">
							<div class="text-center">
								<Monitor class="mx-auto mb-2 h-8 w-8 opacity-50" />
								<p>Δεν υπάρχει εξοπλισμός</p>
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Service Health Pie -->
			<Card.Root
				class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
			>
				<div
					class="absolute -bottom-24 -left-24 -z-10 h-48 w-48 rounded-full bg-emerald-400/8 blur-3xl"
				></div>
				<Card.Header class="pb-2">
					<Card.Title class="text-sm">Service Status</Card.Title>
					<Card.Description class="text-xs">Ημερομηνίες επόμενου service</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if servicePieData.length > 0}
						<div class="flex items-center gap-6">
							<div class="shrink-0">
								<Chart.Container
									config={serviceChartConfig}
									class="aspect-square h-[130px] w-[130px]"
								>
									<PieChart
										data={servicePieData}
										key="status"
										value="count"
										c="color"
										innerRadius={40}
										props={{ pie: { motion: 'tween' } }}
									>
										{#snippet tooltip()}
											<Chart.Tooltip hideLabel indicator="line" />
										{/snippet}
									</PieChart>
								</Chart.Container>
							</div>
							<div class="flex flex-1 flex-col gap-2.5">
								<div class="flex items-center gap-2">
									<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
									<span class="flex-1 text-xs">Εντάξει</span>
									<span class="text-xs font-semibold">{serviceStats.good}</span>
								</div>
								<div class="flex items-center gap-2">
									<AlertTriangle class="h-3.5 w-3.5 text-orange-500" />
									<span class="flex-1 text-xs">Σύντομα (&lt;14 μέρες)</span>
									<span class="text-xs font-semibold">{serviceStats.warning}</span>
								</div>
								<div class="flex items-center gap-2">
									<Clock class="h-3.5 w-3.5 text-red-500" />
									<span class="flex-1 text-xs">Εκπρόθεσμα</span>
									<span class="text-xs font-semibold">{serviceStats.overdue}</span>
								</div>
								{#if serviceStats.noDate > 0}
									<div class="flex items-center gap-2">
										<Cog class="h-3.5 w-3.5 text-muted-foreground/50" />
										<span class="flex-1 text-xs text-muted-foreground">Χωρίς ημ/νία</span>
										<span class="text-xs font-semibold text-muted-foreground"
											>{serviceStats.noDate}</span
										>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex h-[130px] items-center justify-center text-sm text-muted-foreground">
							<div class="text-center">
								<Clock class="mx-auto mb-2 h-8 w-8 opacity-50" />
								<p>Δεν υπάρχουν δεδομένα service</p>
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<!-- Search + Filter -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative min-w-[200px] flex-1">
			<Search class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Αναζήτηση καταστήματος..."
				class="h-9 rounded-xl pl-9 text-sm"
				bind:value={searchQuery}
			/>
		</div>
		<Button
			variant={showAssignedOnly ? 'default' : 'outline'}
			size="sm"
			class="h-9 gap-1.5 rounded-xl text-xs"
			onclick={() => (showAssignedOnly = !showAssignedOnly)}
		>
			<Filter class="h-3 w-3" />
			{showAssignedOnly ? 'Ανατεθειμένα' : 'Όλα τα καταστήματα'}
		</Button>
	</div>

	<!-- Org Cards Grid -->
	{#if loading}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(6) as _}
				<div class="h-44 animate-pulse rounded-2xl bg-muted/40"></div>
			{/each}
		</div>
	{:else if filteredOrgs.length > 0}
		<ScrollArea class="h-[150px]">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredOrgs as org, i (org.org_id)}
					<OrgSummaryCard
						orgName={org.org.store_name}
						location={org.org.location}
						counts={org.counts}
						isAssigned={org.isAssigned}
						lastVisitDate={org.lastVisitDate}
						index={i}
						onclick={() => goto(`/trainer/equipment/${org.org_id}`)}
					/>
				{/each}
			</div>
		</ScrollArea>
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/60 py-12 text-muted-foreground"
		>
			<Building2 class="mb-2 h-8 w-8 opacity-30" />
			<p class="text-sm">Δεν βρέθηκαν καταστήματα</p>
		</div>
	{/if}

	<!-- Recent Issues -->
	<Card.Root
		class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
	>
		<div
			class="absolute -bottom-20 -left-20 -z-10 h-48 w-48 rounded-full bg-orange-500/8 blur-3xl"
		></div>

		<Card.Header class="pb-3">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-orange-500/10 p-2">
					<AlertTriangle class="h-4 w-4 text-orange-600 dark:text-orange-400" />
				</div>
				<div>
					<Card.Title class="text-base">Πρόσφατες Αναφορές</Card.Title>
					<Card.Description class="text-xs"
						>Αναφορές προβλημάτων από όλα τα καταστήματα</Card.Description
					>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="space-y-2">
			{#if issuesQuery?.current === undefined}
				{#each Array(3) as _}
					<div class="h-14 animate-pulse rounded-xl bg-muted/40"></div>
				{/each}
			{:else if recentIssues.length > 0}
				{#each recentIssues.slice(0, 10) as issue, i}
					{@const eqName = issue.equipment?.name ?? '—'}
					{@const orgName = issue.equipment?.core_organizations?.store_name ?? '—'}
					{@const orgId = issue.equipment?.org_id}
					{@const reporter = issue.profiles?.username ?? 'Άγνωστος'}
					{@const date = new Intl.DateTimeFormat('el-GR', {
						day: 'numeric',
						month: 'short',
						hour: '2-digit',
						minute: '2-digit'
					}).format(new Date(issue.created_at))}
					<button
						style="animation-delay: {i * 40}ms; animation-fill-mode: backwards;"
						class="flex w-full animate-fade-in-down items-start gap-3 rounded-xl border border-border/30 bg-background/50 p-3 text-left transition-all hover:bg-muted/30"
						onclick={() => orgId && goto(`/trainer/equipment/${orgId}`)}
					>
						<div
							class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"
						>
							<AlertTriangle class="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="truncate text-xs font-medium">{eqName}</p>
								<span class="shrink-0 text-[10px] text-muted-foreground">·</span>
								<span class="shrink-0 text-[10px] text-muted-foreground">{orgName}</span>
							</div>
							<p class="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
								{issue.issue_description}
							</p>
							<p class="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
								{issue.action_taken}
							</p>

							<!-- Issue images -->
							{#if issue.images?.length}
								<div class="mt-1.5 flex gap-1.5">
									{#each issue.images.slice(0, 3) as img}
										<!-- svelte-ignore node_invalid_placement_ssr -->
										<button
											type="button"
											class="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/40 transition-opacity hover:opacity-80"
											onclick={(e) => {
												e.stopPropagation();
												openPreview(img);
											}}
										>
											<img
												src={img}
												alt="Φωτογραφία αναφοράς"
												class="h-full w-full object-cover"
												loading="lazy"
											/>
										</button>
									{/each}
									{#if issue.images.length > 3}
										<div
											class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/50 text-[10px] font-medium text-muted-foreground"
										>
											+{issue.images.length - 3}
										</div>
									{/if}
								</div>
							{/if}
							<div class="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
								<span>{reporter}</span>
								<span>·</span>
								<span>{date}</span>
							</div>
						</div>
						<ArrowRight class="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
					</button>
				{/each}
			{:else}
				<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
					<CheckCircle2 class="mb-2 h-8 w-8 opacity-30" />
					<p class="text-sm">Δεν υπάρχουν πρόσφατες αναφορές</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Image Preview Modal -->
<ImagePreviewModal bind:open={previewOpen} imageUrl={previewUrl} />
