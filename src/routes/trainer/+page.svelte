<script lang="ts">
	import { goto } from '$app/navigation';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
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
		MapPin
	} from 'lucide-svelte';
	import { getMyAssignedOrgs, getMyEvaluations } from '$lib/api/trainers/trainer_evalution/data.remote.js';
	import type { EvaluationStatus } from '$lib/models/trainers.types.js';
	import TrainerMap from '$lib/components/trainer/TrainerMap.svelte';

	let { data } = $props();
	let user = getProfileContext();

	let assignedOrgsQuery = getMyAssignedOrgs();
	let evaluationsQuery = getMyEvaluations();

	// Shape returned by getMyAssignedOrgs
	type AssignedOrg = {
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
			latitude:number;
			longitude:number;
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

	let assignedOrgs = $derived((assignedOrgsQuery?.current?.assignments ?? []) as unknown as AssignedOrg[]);
	let recentEvaluations = $derived((evaluationsQuery?.current?.evaluations ?? []) as unknown as EvaluationListItem[]);

	// Derive stats from the evaluations list — no extra server call needed
	let stats = $derived({
		total: recentEvaluations.length,
		draft: recentEvaluations.filter((e) => e.submit === 'draft').length,
		submitted: recentEvaluations.filter((e) => e.submit === 'submitted').length,
		reviewed: recentEvaluations.filter((e) => e.submit === 'reviewed').length
	});

	// Check if an org has an active draft
	function hasDraft(orgId: number): boolean {
		return recentEvaluations.some((e) => e.org_id === orgId && e.submit === 'draft');
	}

	// Most recent visit date for an org, derived from evaluations list
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
		draft:    { label: 'Πρόχειρο',       variant: 'secondary',    icon: FileText,    color: 'text-muted-foreground' },
		submitted:{ label: 'Υποβλήθηκε',     variant: 'default',      icon: Clock,       color: 'text-primary'          },
		reviewed: { label: 'Ελέγχθηκε',      variant: 'outline',      icon: CheckCircle2,color: 'text-emerald-600'       },
		reopened: { label: 'Επαναστάλθηκε',  variant: 'destructive',  icon: ArrowRight,  color: 'text-destructive'      }
	};

	// Loading state: current is undefined before first response
	let orgsLoading = $derived(assignedOrgsQuery?.current === undefined);
	let evalsLoading = $derived(evaluationsQuery?.current === undefined);
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

		<Button onclick={() => goto('/trainer/evaluations/new')} class="hidden gap-2 sm:flex">
			<Plus class="h-4 w-4" />
			Νέα Αξιολόγηση
		</Button>
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each [
			{ label: 'Σύνολο',       value: stats.total,     icon: ClipboardList, color: 'text-foreground',    bg: 'bg-muted/50'       },
			{ label: 'Πρόχειρα',     value: stats.draft,     icon: FileText,      color: 'text-muted-foreground', bg: 'bg-muted/30'    },
			{ label: 'Υποβληθέντα',  value: stats.submitted, icon: Clock,         color: 'text-primary',       bg: 'bg-primary/10'     },
			{ label: 'Ελεγμένα',     value: stats.reviewed,  icon: CheckCircle2,  color: 'text-emerald-600',   bg: 'bg-emerald-500/10' }
		] as stat}
			<Card.Root class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
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
			<Card.Root class="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
				<div class="absolute -top-20 -right-20 -z-10 h-48 w-48 rounded-full bg-primary/8 blur-3xl"></div>

				<Card.Header class="pb-3">
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
							<div
								style="animation-delay: {i * 60}ms; animation-fill-mode: backwards;"
								class="group animate-fade-in-down flex cursor-pointer items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3 transition-all hover:border-primary/20 hover:bg-primary/5"
								onclick={() => goto(`/trainer/evaluations/new?org=${orgId}`)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && goto(`/trainer/evaluations/new?org=${orgId}`)}
							>
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
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
			<Card.Root class="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
				<div class="absolute -bottom-20 -left-20 -z-10 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl"></div>

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
								class="animate-fade-in-down flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3 text-left transition-all hover:border-primary/20 hover:bg-primary/5"
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
							<Button
								variant="outline"
								size="sm"
								class="mt-3 text-xs"
								onclick={() => goto('/trainer/evaluations/new')}
							>
								<Plus class="mr-1.5 h-3 w-3" />
								Δημιουργία
							</Button>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

	</div>

	<!-- Map Section -->
	{#if !orgsLoading}
		{@const pendingOrgs = assignedOrgs.filter(
			(o) =>
				o.core_organizations?.latitude &&
				o.core_organizations?.longitude 
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

	<!-- Mobile CTA -->
	<Button
		onclick={() => goto('/trainer/evaluations/new')}
		class="flex gap-2 sm:hidden"
		size="lg"
	>
		<Plus class="h-4 w-4" />
		Νέα Αξιολόγηση
	</Button>
</div>