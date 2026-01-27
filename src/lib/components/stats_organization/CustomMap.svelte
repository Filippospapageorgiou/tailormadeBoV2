<script lang="ts">
	import { Map, MapControls } from '$lib/components/ui/map';
	import MapMarker from '../ui/map/MapMarker.svelte';
	import MarkerContent from '../ui/map/MarkerContent.svelte';
	import MarkerPopup from '../ui/map/MarkerPopup.svelte';
	import MarkerTooltip from '../ui/map/MarkerTooltip.svelte';
	import { MapPin, Phone, Mail, MapPinned, Users, Package } from 'lucide-svelte';
	import Separator from '../ui/separator/separator.svelte';
	import ChartAreaOrgData from './chartAreaOrgData.svelte';
	import { getOrganizationBonusData } from '$lib/api/statistics_organization/data.remote';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';

	let { organizations } = $props();

	// Store for bonus data per org (for the chart)
	let orgBonusData: Record<number, any[]> = $state({});
	let loadingOrgs: Record<number, boolean> = $state({});

	// Track active queries to react to their changes
	let activeQueries: Record<number, ReturnType<typeof getOrganizationBonusData>> = $state({});

	// Filter only those with coordinates
	const mappableOrgs = $derived(
		organizations.filter((org: { latitude: any; longitude: any }) => org.latitude && org.longitude)
	);

	// Map center
	const mapCenter = $derived<[number, number]>(
		mappableOrgs.length > 0
			? [mappableOrgs[0].longitude, mappableOrgs[0].latitude]
			: [23.729757, 37.976707]
	);

	// Get marker colors based on latest_percentage_change
	function getMarkerColors(latestPercentage: number | null): {
		primary: string;
		secondary: string;
		secondaryStrong: string;
		glow: string;
		border: string;
		shadow: string;
	} {
		// Negative percentage = red
		if (latestPercentage !== null && latestPercentage < 0) {
			return {
				primary: 'bg-red-500',
				secondary: 'bg-red-500/40',
				secondaryStrong: 'bg-red-500/60',
				glow: 'bg-red-400/80',
				border: 'border-red-300',
				shadow: 'shadow-red-500/50'
			};
		}

		// Positive or unknown = green
		return {
			primary: 'bg-emerald-500',
			secondary: 'bg-emerald-500/40',
			secondaryStrong: 'bg-emerald-500/60',
			glow: 'bg-emerald-400/80',
			border: 'border-emerald-300',
			shadow: 'shadow-emerald-500/50'
		};
	}

	// Get trend status for display
	function getTrendStatus(latestPercentage: number | null): 'positive' | 'negative' | 'unknown' {
		if (latestPercentage === null) return 'unknown';
		return latestPercentage >= 0 ? 'positive' : 'negative';
	}

	// Load full chart data when popup opens
	function loadOrgData(orgId: number) {
		if (untrack(() => orgBonusData[orgId]) || untrack(() => loadingOrgs[orgId])) return;

		loadingOrgs[orgId] = true;
		activeQueries[orgId] = getOrganizationBonusData({ id: orgId });
	}

	// React to query state changes
	$effect(() => {
		const queries = activeQueries;

		for (const [orgIdStr, query] of Object.entries(queries)) {
			const orgId = parseInt(orgIdStr);
			const current = query.current;

			if (current) {
				untrack(() => {
					if (orgBonusData[orgId] && orgBonusData[orgId].length > 0) return;
					if (!loadingOrgs[orgId]) return;

					if (current.success) {
						orgBonusData[orgId] = current.data;
						loadingOrgs[orgId] = false;
					} else if (current.message) {
						orgBonusData[orgId] = [];
						loadingOrgs[orgId] = false;
					}
				});
			}
		}
	});
</script>

<div class="h-full w-full">
	<Map center={mapCenter} zoom={11}>
		{#each mappableOrgs as org (org.id)}
			{@const colors = getMarkerColors(org.latest_percentage_change)}
			{@const trendStatus = getTrendStatus(org.latest_percentage_change)}
			<MapMarker longitude={org.longitude} latitude={org.latitude}>
				<MarkerContent>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => loadOrgData(org.id)}
						class="relative flex items-center justify-center"
					>
						<!-- Outer pulse ring 1 -->
						<div
							class="absolute size-8 animate-pulsing rounded-full {colors.secondary} repeat-infinite"
						></div>
						<!-- Outer pulse ring 2 (delayed) -->
						<div
							class="absolute size-6 animate-pulsing rounded-full {colors.secondaryStrong} repeat-infinite [animation-delay:300ms]"
						></div>
						<!-- Inner glow -->
						<div
							class="absolute size-4 animate-pulse-fade-in rounded-full {colors.glow} blur-sm repeat-infinite"
						></div>
						<!-- Core dot -->
						<div
							class="relative size-3 rounded-full border-2 {colors.border} {colors.primary} shadow-lg {colors.shadow} repeat-infinite"
						></div>
					</div>
				</MarkerContent>

				<MarkerTooltip class="border border-border/50">
					<div class="flex items-center gap-2">
						<span class="font-bold">{org.store_name}</span>
						{#if trendStatus === 'positive'}
							<span class="text-xs text-emerald-500">▲ {org.latest_percentage_change?.toFixed(1)}%</span>
						{:else if trendStatus === 'negative'}
							<span class="text-xs text-red-500">▼ {org.latest_percentage_change?.toFixed(1)}%</span>
						{/if}
					</div>
				</MarkerTooltip>

				<MarkerPopup class="border border-border/50">
					<div class="w-90 space-y-4 p-3">
						<!-- Header -->
						<div class="flex items-start gap-3">
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-full {trendStatus === 'negative'
									? 'bg-red-100 dark:bg-red-900/50'
									: 'bg-emerald-100 dark:bg-emerald-900/50'}"
							>
								<MapPin
									class="size-5 {trendStatus === 'negative'
										? 'text-red-600 dark:text-red-400'
										: 'text-emerald-600 dark:text-emerald-400'}"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="truncate font-semibold text-foreground">
									{org.store_name}
								</h3>
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {org.status
										? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
										: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'}"
								>
									{org.status ? '● Ενεργό' : '○ Ανενεργό'}
								</span>
							</div>
						</div>

						<!-- Chart με data -->
						{#if loadingOrgs[org.id]}
							<div class="flex h-[100px] items-center justify-center">
								<div
									class="animate-spin-clockwise repeat-infinite size-4 rounded-full border-2 border-emerald-500 border-t-transparent"
								></div>
							</div>
						{:else}
							<ChartAreaOrgData data={orgBonusData[org.id] ?? []} />
						{/if}

						<Separator />

						<!-- Info Grid -->
						<div class="space-y-2 text-sm">
							{#if org.location}
								<div class="flex items-start gap-2 text-muted-foreground">
									<MapPinned class="mt-0.5 size-4 shrink-0" />
									<span>{org.location}</span>
								</div>
							{/if}

							{#if org.phone}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Phone class="size-4 shrink-0" />
									<a href="tel:{org.phone}" class="hover:text-foreground hover:underline">
										{org.phone}
									</a>
								</div>
							{/if}

							{#if org.email}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Mail class="size-4 shrink-0" />
									
										
									<a href="mailto:{org.email}"
										class="truncate hover:text-foreground hover:underline">
										{org.email}
									</a>
								</div>
							{/if}
						</div>

						<!-- Stats -->
						<div class="grid grid-cols-2 gap-2 pt-1">
							<div class="rounded-lg bg-muted/50 p-2 text-center">
								<div class="flex items-center justify-center gap-1 text-muted-foreground">
									<Users class="size-3.5" />
									<span class="text-lg font-semibold text-foreground">
										{org.employee_count ?? 0}
									</span>
								</div>
								<p class="text-xs text-muted-foreground">Υπάλληλοι</p>
							</div>
							<div class="rounded-lg bg-muted/50 p-2 text-center">
								<div class="flex items-center justify-center gap-1 text-muted-foreground">
									<Package class="size-3.5" />
									<span class="text-lg font-semibold text-foreground">
										{org.equipment_count ?? 0}
									</span>
								</div>
								<p class="text-xs text-muted-foreground">Εξοπλισμός</p>
							</div>
						</div>

						<!-- Coordinates footer -->
						<div class="border-t border-border pt-2 text-center text-xs text-muted-foreground/70">
							📍 {org.latitude.toFixed(5)}, {org.longitude.toFixed(5)}
						</div>
					</div>
				</MarkerPopup>
			</MapMarker>
		{/each}
		<MapControls position="top-right" showLocate showFullscreen />
	</Map>
</div>