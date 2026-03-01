<script lang="ts">
	import { goto } from '$app/navigation';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		ClipboardList,
		Plus,
		Building2,
		CheckCircle2,
		Clock,
		ArrowRight,
		Star,
		CalendarDays,
		FileText,
		TrendingUp,
		MapPin,
		AlertTriangle
	} from 'lucide-svelte';
	import {
		getMyAssignedOrgs,
		getMyEvaluations
	} from '$lib/api/trainers/trainer_evalution/data.remote.js';
	import { getAllOrganizations } from '$lib/api/trainers/trainer_managment/data.remote.js';
	import type { EvaluationStatus } from '$lib/models/trainers.types.js';
	import type { Organization } from '$lib/models/database.types.js';
	import TrainerMap from '$lib/components/trainer/TrainerMap.svelte';
	import { setAssignmentStore, getAssignmentStore } from '$lib/stores/assignedOrg.svelte.js';

	let assignmentStore = getAssignmentStore();

	let { data } = $props();
	let user = getProfileContext();

	// Queries
	let assignedOrgsQuery = getMyAssignedOrgs();
	let evaluationsQuery = getMyEvaluations();
	let allOrgsQuery = getAllOrganizations();

	// Shape returned by getMyAssignedOrgs
	type AssignedOrg = {
		trainer_id: string;
		assigned_by: string;
		is_active: boolean;
		created_at: string;
		updated_at: string;
		id: number;
		org_id: number;
		visit_date: string;
		core_organizations: {
			id: number;
			store_name: string;
			email: string | null;
			phone: string | null;
			status: boolean;
			location: string | null;
			latitude: number;
			longitude: number;
		} | null;
	};

	// Shape returned by getMyEvaluations
	type EvaluationListItem = {
		id: number;
		org_id: number;
		visit_date: string;
		submit: EvaluationStatus;
		overall_rating: number | null;
		submitted_at: string | null;
		created_at: string;
		core_organizations: {
			id: number;
			store_name: string;
			location: string | null;
		} | null;
	};

	// Derived data
	let assignedOrgs = $derived(
		(assignedOrgsQuery?.current?.assignments ?? []) as unknown as AssignedOrg[]
	);
	let recentEvaluations = $derived(
		(evaluationsQuery?.current?.evaluations ?? []) as unknown as EvaluationListItem[]
	);
	let allOrgs = $derived((allOrgsQuery?.current?.organizations ?? []) as Organization[]);

	// Stats derived from evaluations
	let stats = $derived({
		total: recentEvaluations.length,
		draft: recentEvaluations.filter((e) => e.submit === 'draft').length,
		submitted: recentEvaluations.filter((e) => e.submit === 'submitted').length,
		reviewed: recentEvaluations.filter((e) => e.submit === 'reviewed').length
	});

	// Loading states
	let orgsLoading = $derived(assignedOrgsQuery?.current === undefined);
	let evalsLoading = $derived(evaluationsQuery?.current === undefined);
	let allOrgsLoading = $derived(allOrgsQuery?.current === undefined);

	// Check if an org has an active draft
	function hasDraft(orgId: number): boolean {
		return recentEvaluations.some((e) => e.org_id === orgId && e.submit === 'draft');
	}

	// Most recent visit date for an org
	function lastVisitDate(orgId: number): string | null {
		const visits = recentEvaluations
			.filter((e) => e.org_id === orgId)
			.map((e) => e.visit_date)
			.sort((a, b) => b.localeCompare(a));
		return visits[0] ?? null;
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function greetingByTime(): string {
		const h = new Date().getHours();
		if (h < 12) return 'Καλημέρα';
		if (h < 18) return 'Καλό απόγευμα';
		return 'Καλησπέρα';
	}

	function formatDate(dateStr: string): string {
		return new Intl.DateTimeFormat('el-GR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(dateStr));
	}

	type StatusConfig = {
		label: string;
		variant: 'default' | 'secondary' | 'destructive' | 'outline';
		icon: any;
		color: string;
	};

	const statusConfig: Record<EvaluationStatus, StatusConfig> = {
		draft: {
			label: 'Πρόχειρο',
			variant: 'secondary',
			icon: FileText,
			color: 'text-muted-foreground'
		},
		submitted: {
			label: 'Υποβλήθηκε',
			variant: 'default',
			icon: Clock,
			color: 'text-primary'
		},
		reviewed: {
			label: 'Ελέγχθηκε',
			variant: 'outline',
			icon: CheckCircle2,
			color: 'text-emerald-600'
		},
		reopened: {
			label: 'Επαναστάλθηκε',
			variant: 'destructive',
			icon: ArrowRight,
			color: 'text-destructive'
		}
	};

	// ── Emergency modal state ──────────────────────────────────────────
	let emergencyModalOpen = $state(false);
	let emergencyStep = $state<1 | 2>(1);
	let selectedOrgValue = $state('');

	let selectedOrgId = $derived(selectedOrgValue ? Number(selectedOrgValue) : null);

	let selectedOrg = $derived(allOrgs.find((o) => o.id === selectedOrgId) ?? null);

	let triggerContent = $derived(selectedOrg?.store_name ?? 'Επέλεξε κατάστημα...');

	let isAssigned = $derived(
		selectedOrgId !== null && assignedOrgs.some((a) => a.org_id === selectedOrgId)
	);

	let selectedHasDraft = $derived(selectedOrgId !== null && hasDraft(selectedOrgId));

	function openEmergencyModal() {
		emergencyStep = 1;
		selectedOrgValue = '';
		emergencyModalOpen = true;
	}

	function handleEmergencyConfirm() {
		if (!selectedOrg) return;
		const orgId = selectedOrg.id;
		emergencyModalOpen = false;
		emergencyStep = 1;
		selectedOrgValue = '';
		goto(`/trainer/evaluations/new?org=${orgId}`);
	}

	// ── Assigned org evaluation ────────────────────────────────────────
	function handleNewEval(org: AssignedOrg) {
		assignmentStore.setTrainerAssignmentOrg({
			id: org.id,
			trainer_id: org.trainer_id,
			org_id: org.org_id,
			assigned_by: org.assigned_by,
			is_active: org.is_active,
			created_at: org.created_at,
			updated_at: org.updated_at,
			visit_date: org.visit_date
		});

		goto(`/trainer/evaluations/new`);
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-4 pt-6">
	<!-- Greeting header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<Avatar.Root class="h-12 w-12 ring-2 ring-primary/20">
				<Avatar.Image src={user.imageUrl} alt={user.username} class="dark:bg-white" />
				<Avatar.Fallback class="font-medium">{getInitials(user.username ?? 'TM')}</Avatar.Fallback>
			</Avatar.Root>
			<div>
				<p class="text-sm text-muted-foreground">{greetingByTime()},</p>
				<h1 class="text-xl font-semibold">{user.username}</h1>
			</div>
		</div>
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each [{ label: 'Σύνολο', value: stats.total, icon: ClipboardList, color: 'text-foreground', bg: 'bg-muted/50' }, { label: 'Πρόχειρα', value: stats.draft, icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted/30' }, { label: 'Υποβληθέντα', value: stats.submitted, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' }, { label: 'Ελεγμένα', value: stats.reviewed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' }] as stat}
			<Card.Root
				class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm"
			>
				<div class="flex items-start justify-between">
					<div>
						<p class="text-xs text-muted-foreground">{stat.label}</p>
						<p class="mt-1 text-2xl font-bold {stat.color}">
							{evalsLoading ? '—' : stat.value}
						</p>
					</div>
					<div class="rounded-lg p-2 {stat.bg}">
						<stat.icon class="h-4 w-4 {stat.color}" />
					</div>
				</div>
			</Card.Root>
		{/each}
	</div>

	<!-- Main grid -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
		<!-- Assigned Organizations -->
		<div class="lg:col-span-3">
			<Card.Root
				class="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
			>
				<div
					class="absolute -top-20 -right-20 -z-10 h-48 w-48 rounded-full bg-primary/8 blur-3xl"
				></div>

				<Card.Header class="pb-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-primary/10 p-2">
								<Building2 class="h-4 w-4 text-primary" />
							</div>
							<div>
								<Card.Title class="text-base">Τα Καταστήματά μου</Card.Title>
								<Card.Description class="text-xs">
									{orgsLoading ? '...' : `${assignedOrgs.length} ανατεθειμένα`}
								</Card.Description>
							</div>
						</div>

						<Button
							variant="destructive"
							size="sm"
							class="gap-1.5 rounded-xl text-xs"
							onclick={openEmergencyModal}
						>
							<AlertTriangle class="h-3.5 w-3.5" />
							Έκτακτη
						</Button>
					</div>
				</Card.Header>

				<Card.Content class="space-y-2">
					{#if orgsLoading}
						{#each Array(3) as _}
							<div class="h-16 animate-pulse rounded-xl bg-muted/40"></div>
						{/each}
					{:else if assignedOrgs.length > 0}
						{#each assignedOrgs as org, i}
							{@const storeName = org.core_organizations?.store_name ?? 'Κατάστημα'}
							{@const orgId = org.org_id}
							{@const draft = hasDraft(orgId)}
							{@const lastVisit = lastVisitDate(orgId)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								style="animation-delay: {i * 60}ms; animation-fill-mode: backwards;"
								class="group flex animate-fade-in-down cursor-pointer items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3 transition-all hover:border-primary/20 hover:bg-primary/5"
								onclick={() => handleNewEval(org)}
								role="button"
								tabindex="0"
							>
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground"
								>
									{getInitials(storeName)}
								</div>

								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{storeName}</p>
									<!-- Scheduled visit date assigned by admin -->
									<p class="flex items-center gap-1 text-xs">
										<CalendarDays class="h-3 w-3 text-primary" />
										<span class="font-semibold text-foreground">{formatDate(org.visit_date)}</span>
									</p>
									{#if lastVisit}
										<p class="text-[10px] text-muted-foreground">
											Τελευταία: {formatDate(lastVisit)}
										</p>
									{/if}
								</div>

								<div class="flex shrink-0 items-center gap-2">
									{#if draft}
										<Badge variant="secondary" class="text-[10px]">Πρόχειρο</Badge>
									{/if}
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
										onclick={(e: MouseEvent) => {
											e.stopPropagation();
											goto(`/trainer/evaluations/new?org=${orgId}`);
										}}
									>
										<Plus class="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						{/each}
					{:else}
						<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
							<Building2 class="mb-2 h-8 w-8 opacity-30" />
							<p class="text-sm">Δεν έχετε ανατεθειμένα καταστήματα</p>
							<p class="text-xs opacity-70">Επικοινωνήστε με τη διαχείριση</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Recent Evaluations -->
		<div class="lg:col-span-2">
			<Card.Root
				class="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
			>
				<div
					class="absolute -bottom-20 -left-20 -z-10 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl"
				></div>

				<Card.Header class="pb-3">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-emerald-500/10 p-2">
							<TrendingUp class="h-4 w-4 text-emerald-600" />
						</div>
						<div>
							<Card.Title class="text-base">Πρόσφατες</Card.Title>
							<Card.Description class="text-xs">Τελευταίες αξιολογήσεις</Card.Description>
						</div>
					</div>
				</Card.Header>

				<Card.Content class="space-y-2">
					{#if evalsLoading}
						{#each Array(3) as _}
							<div class="h-14 animate-pulse rounded-xl bg-muted/40"></div>
						{/each}
					{:else if recentEvaluations.length > 0}
						{#each recentEvaluations.slice(0, 5) as ev, i}
							{@const cfg = statusConfig[ev.submit]}
							<button
								style="animation-delay: {i * 60}ms; animation-fill-mode: backwards;"
								class="flex w-full animate-fade-in-down cursor-pointer items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3 text-left transition-all hover:border-primary/20 hover:bg-primary/5"
								onclick={() => goto(`/trainer/evaluations/${ev.id}`)}
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
									<cfg.icon class="h-3.5 w-3.5 {cfg.color}" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium">
										{ev.core_organizations?.store_name ?? '—'}
									</p>
									<p class="text-[10px] text-muted-foreground">{formatDate(ev.visit_date)}</p>
								</div>
								{#if ev.overall_rating}
									<div class="flex shrink-0 items-center gap-0.5 text-yellow-500">
										<Star class="h-3 w-3 fill-current" />
										<span class="text-xs font-medium">{ev.overall_rating}</span>
									</div>
								{:else}
									<Badge variant={cfg.variant} class="shrink-0 text-[10px]">{cfg.label}</Badge>
								{/if}
							</button>
						{/each}

						<Button
							variant="ghost"
							class="mt-1 w-full text-xs text-muted-foreground"
							onclick={() => goto('/trainer/evaluations')}
						>
							Δες όλες
							<ArrowRight class="ml-1 h-3 w-3" />
						</Button>
					{:else}
						<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
							<ClipboardList class="mb-2 h-8 w-8 opacity-30" />
							<p class="text-sm">Δεν υπάρχουν αξιολογήσεις</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<!-- Map Section -->
	{#if !orgsLoading}
		{@const pendingOrgs = assignedOrgs.filter(
			(o) => o.core_organizations?.latitude && o.core_organizations?.longitude
		)}
		{#if pendingOrgs.length > 0}
			<div class="space-y-3">
				<!-- Section header -->
				<div class="flex items-center justify-between">
					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-primary/10 p-2">
							<MapPin class="h-4 w-4 text-primary" />
						</div>
						<div>
							<h2 class="text-sm font-semibold">Εκκρεμείς Επισκέψεις</h2>
							<p class="text-xs text-muted-foreground">
								Καταστήματα που σου έχουν ανατεθεί και δεν έχουν αξιολογηθεί ακόμα.
							</p>
						</div>
					</div>
					<div class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
						<div class="size-2 animate-pulse rounded-full bg-primary"></div>
						<span>{pendingOrgs.length} εκκρεμεί</span>
					</div>
				</div>

				<!-- Map -->
				<div
					class="h-[460px] overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-sm lg:h-[560px]"
				>
					<TrainerMap assignedOrgs={pendingOrgs} evaluations={recentEvaluations} />
				</div>
			</div>
		{/if}
	{/if}
</div>

<Dialog.Root bind:open={emergencyModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<!-- STEP 1: Select org -->
		{#if emergencyStep === 1}
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-destructive">
					<AlertTriangle class="h-5 w-5" />
					Έκτακτη Αξιολόγηση
				</Dialog.Title>
				<Dialog.Description>
					Επέλεξε το κατάστημα που θέλεις να αξιολογήσεις έκτακτα.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<Select.Root type="single" name="emergencyOrg" bind:value={selectedOrgValue}>
					<Select.Trigger class="w-full">
						{triggerContent}
					</Select.Trigger>
					<Select.Content class="max-h-64 overflow-y-auto">
						<Select.Group>
							<Select.Label>Όλα τα καταστήματα</Select.Label>
							{#each allOrgs as org (org.id)}
								{@const assigned = assignedOrgs.some((a) => a.org_id === org.id)}
								{@const draft = hasDraft(org.id)}
								<Select.Item value={String(org.id)} label={org.store_name ?? 'Κατάστημα'}>
									<div class="flex w-full items-center justify-between gap-2">
										<span class="truncate">{org.store_name ?? 'Κατάστημα'}</span>
										<div class="flex shrink-0 items-center gap-1">
											{#if draft}
												<Badge variant="secondary" class="text-[10px]">Πρόχειρο</Badge>
											{/if}
											{#if !assigned}
												<Badge variant="outline" class="text-[10px] text-muted-foreground"
													>Μη ανατεθειμένο</Badge
												>
											{/if}
										</div>
									</div>
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>

				<!-- Warnings -->
				{#if selectedOrg && !isAssigned}
					<div
						class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
					>
						<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
						<span
							>Αυτό το κατάστημα δεν σου έχει ανατεθεί. Η αξιολόγηση θα καταγραφεί ως έκτακτη.</span
						>
					</div>
				{/if}

				{#if selectedHasDraft}
					<div
						class="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400"
					>
						<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
						<span>Υπάρχει ήδη πρόχειρη αξιολόγηση για αυτό το κατάστημα. Θα δημιουργηθεί νέα.</span>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={() => (emergencyModalOpen = false)}>Άκυρο</Button>
				<Button variant="destructive" disabled={!selectedOrg} onclick={() => (emergencyStep = 2)}>
					Επόμενο
					<ArrowRight class="ml-1.5 h-3.5 w-3.5" />
				</Button>
			</Dialog.Footer>

			<!-- STEP 2: Confirm -->
		{:else if emergencyStep === 2}
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<CheckCircle2 class="h-5 w-5 text-emerald-600" />
					Επιβεβαίωση
				</Dialog.Title>
				<Dialog.Description>Έλεγξε τα στοιχεία πριν συνεχίσεις.</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-3 py-2">
				<!-- Org summary card -->
				<div class="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground"
						>
							{getInitials(selectedOrg?.store_name ?? 'TM')}
						</div>
						<div>
							<p class="text-sm font-medium">{selectedOrg?.store_name ?? '—'}</p>
							{#if selectedOrg?.location}
								<p class="text-xs text-muted-foreground">{selectedOrg.location}</p>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
						<CalendarDays class="h-3.5 w-3.5" />
						<span
							>Ημερομηνία επίσκεψης: <span class="font-semibold text-foreground"
								>{formatDate(new Date().toISOString())}</span
							></span
						>
					</div>

					{#if !isAssigned}
						<Badge variant="outline" class="text-[10px] text-muted-foreground"
							>Μη ανατεθειμένο κατάστημα</Badge
						>
					{/if}
				</div>

				<!-- Final warning -->
				<div
					class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
					<span>Είσαι σίγουρος; Η έκτακτη αξιολόγηση θα καταχωρηθεί αμέσως.</span>
				</div>
			</div>

			<Dialog.Footer class="gap-2">
				<Button variant="outline" onclick={() => (emergencyStep = 1)}>
					<ArrowRight class="mr-1.5 h-3.5 w-3.5 rotate-180" />
					Πίσω
				</Button>
				<Button variant="destructive" onclick={handleEmergencyConfirm}>
					<AlertTriangle class="mr-1.5 h-3.5 w-3.5" />
					Δημιουργία Έκτακτης
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
