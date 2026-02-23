<script lang="ts">
	import { Map, MapControls } from '$lib/components/ui/map';
	import MapMarker from '../ui/map/MapMarker.svelte';
	import MarkerContent from '../ui/map/MarkerContent.svelte';
	import MarkerPopup from '../ui/map/MarkerPopup.svelte';
	import MarkerTooltip from '../ui/map/MarkerTooltip.svelte';
	import {
		MapPin,
		CalendarDays,
		MapPinned,
		Phone,
		Star,
		Clock,
		CheckCircle2,
		FileText,
		AlertCircle
	} from 'lucide-svelte';
	import Separator from '../ui/separator/separator.svelte';
	import type { EvaluationStatus } from '$lib/models/trainers.types.js';

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
			latitude: number | null;
			longitude: number | null;
		} | null;
	};

	type EvaluationItem = {
		id: number;
		org_id: number;
		visit_date: string;
		submit: EvaluationStatus;
		overall_rating: number | null;
		submitted_at: string | null;
		created_at: string;
	};

	const statusConfig: Record<
		EvaluationStatus,
		{ label: string; icon: any; color: string; bg: string }
	> = {
		draft: { label: 'Πρόχειρο', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
		submitted: {
			label: 'Υποβλήθηκε',
			icon: Clock,
			color: 'text-blue-500',
			bg: 'bg-blue-500/10'
		},
		reviewed: {
			label: 'Ελέγχθηκε',
			icon: CheckCircle2,
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10'
		},
		reopened: {
			label: 'Επαναστάλθηκε',
			icon: AlertCircle,
			color: 'text-orange-500',
			bg: 'bg-orange-500/10'
		}
	};

	let {
		assignedOrgs,
		evaluations = []
	}: { assignedOrgs: AssignedOrg[]; evaluations?: EvaluationItem[] } = $props();

	// Center on first org or default to Greece
	const mapCenter = $derived<[number, number]>(
		assignedOrgs.length > 0
			? [
					assignedOrgs[0].core_organizations!.longitude!,
					assignedOrgs[0].core_organizations!.latitude!
				]
			: [23.729757, 37.976707]
	);

	// Get evaluations for a specific org, newest first
	function getOrgEvals(orgId: number): EvaluationItem[] {
		return evaluations
			.filter((e) => e.org_id === orgId)
			.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('el-GR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	// How many days until the visit
	function daysUntil(dateString: string): number {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const visit = new Date(dateString);
		return Math.round((visit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	}
</script>

<div class="h-full w-full">
	<Map center={mapCenter} zoom={10}>
		{#each assignedOrgs as assignment (assignment.org_id)}
			{@const org = assignment.core_organizations!}
			{@const days = daysUntil(assignment.visit_date)}
			{@const isOverdue = days < 0}
			{@const orgEvals = getOrgEvals(assignment.org_id)}

			<MapMarker longitude={org.longitude!} latitude={org.latitude!}>
				<MarkerContent>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="relative flex items-center justify-center">
						<div
							class="absolute size-8 animate-pulsing rounded-full {isOverdue
								? 'bg-red-500/40'
								: 'bg-primary/40'} repeat-infinite"
						></div>
						<div
							class="absolute size-6 animate-pulsing rounded-full {isOverdue
								? 'bg-red-500/60'
								: 'bg-primary/60'} repeat-infinite [animation-delay:300ms]"
						></div>
						<div
							class="absolute size-4 animate-pulse-fade-in rounded-full {isOverdue
								? 'bg-red-400/80'
								: 'bg-primary/80'} blur-sm repeat-infinite"
						></div>
						<div
							class="relative size-3 rounded-full border-2 {isOverdue
								? 'border-red-300 bg-red-500 shadow-red-500/50'
								: 'border-primary/50 bg-primary shadow-primary/50'} shadow-lg repeat-infinite"
						></div>
					</div>
				</MarkerContent>

				<MarkerTooltip class="border border-border/50">
					<div class="flex items-center gap-2">
						<span class="text-sm font-bold">{org.store_name}</span>
						{#if isOverdue}
							<span class="text-xs font-medium text-red-500">Εκπρόθεσμη</span>
						{:else if days === 0}
							<span class="text-xs font-medium text-primary">Σήμερα</span>
						{:else}
							<span class="text-xs text-muted-foreground">σε {days} μέρες</span>
						{/if}
					</div>
				</MarkerTooltip>

				<MarkerPopup class="border border-border/50" closeButton>
					<div class="w-full min-w-0 space-y-3 sm:w-72">
						<!-- Header -->
						<div class="flex items-start gap-3">
							<div
								class="flex size-9 shrink-0 items-center justify-center rounded-full {isOverdue
									? 'bg-red-500/20'
									: 'bg-primary/15'}"
							>
								<MapPin class="size-4 {isOverdue ? 'text-red-500' : 'text-primary'}" />
							</div>
							<div class="min-w-0 flex-1 pr-5">
								<h3 class="truncate text-sm font-semibold text-foreground">
									{org.store_name}
								</h3>
								<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
									<span
										class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {isOverdue
											? 'bg-red-500/10 text-red-500'
											: 'bg-primary/10 text-primary'}"
									>
										<CalendarDays class="size-2.5" />
										{formatDate(assignment.visit_date)}
									</span>
									{#if isOverdue}
										<span
											class="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400"
										>
											Εκπρόθεσμη
										</span>
									{:else if days === 0}
										<span
											class="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
										>
											Σήμερα
										</span>
									{:else}
										<span class="text-[10px] text-muted-foreground">σε {days} μέρες</span>
									{/if}
								</div>
							</div>
						</div>

						<Separator />

						<!-- Contact / location info -->
						<div class="space-y-2 text-xs">
							{#if org.location}
								<div class="flex items-start gap-2 text-muted-foreground">
									<MapPinned class="mt-0.5 size-3.5 shrink-0" />
									<span class="line-clamp-2">{org.location}</span>
								</div>
							{/if}
							{#if org.phone}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Phone class="size-3.5 shrink-0" />
									<a href="tel:{org.phone}" class="hover:text-foreground hover:underline">
										{org.phone}
									</a>
								</div>
							{/if}
							{#if !org.location && !org.phone}
								<p class="italic text-muted-foreground">Δεν υπάρχουν στοιχεία επικοινωνίας</p>
							{/if}
						</div>

						<Separator />

						<!-- Last 3 evaluations -->
						<div>
							<p
								class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
							>
								Τελευταίες Αξιολογήσεις
							</p>
							{#if orgEvals.length === 0}
								<p class="text-xs italic text-muted-foreground">
									Δεν υπάρχουν αξιολογήσεις ακόμα
								</p>
							{:else}
								<div class="space-y-1.5">
									{#each orgEvals.slice(0, 3) as ev}
										{@const cfg = statusConfig[ev.submit]}
										<div class="flex items-center gap-2 rounded-lg {cfg.bg} px-2.5 py-1.5">
											<cfg.icon class="size-3 shrink-0 {cfg.color}" />
											<span class="flex-1 text-[11px] text-muted-foreground">
												{formatDate(ev.visit_date)}
											</span>
											{#if ev.overall_rating !== null}
												<div class="flex items-center gap-0.5 text-yellow-500">
													<Star class="size-2.5 fill-current" />
													<span class="text-[11px] font-semibold">{ev.overall_rating}/100</span>
												</div>
											{:else}
												<span class="text-[10px] font-medium {cfg.color}">{cfg.label}</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</MarkerPopup>
			</MapMarker>
		{/each}

		<MapControls position="top-right" showLocate showFullscreen />
	</Map>
</div>
