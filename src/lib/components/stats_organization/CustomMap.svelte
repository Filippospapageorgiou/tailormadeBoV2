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

	// Store for bonus data per org
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

	// Start loading data when popup opens
	function loadOrgData(orgId: number) {
		// Check without triggering reactivity
		if (untrack(() => orgBonusData[orgId]) || untrack(() => loadingOrgs[orgId])) return;
		
		loadingOrgs[orgId] = true;
		activeQueries[orgId] = getOrganizationBonusData({ id: orgId });
	}

	// React to query state changes
	$effect(() => {
		// Read the queries (this creates the dependency)
		const queries = activeQueries;
		
		for (const [orgIdStr, query] of Object.entries(queries)) {
			const orgId = parseInt(orgIdStr);
			const current = query.current;
			
			if (current) {
				// Use untrack to prevent the effect from re-running when we write
				untrack(() => {
					// Check if we already processed this
					if (orgBonusData[orgId] && orgBonusData[orgId].length > 0) return;
					if (!loadingOrgs[orgId]) return; // Already processed
					
					if (current.success) {
						orgBonusData[orgId] = current.data;
						loadingOrgs[orgId] = false;
						toast.success('Επιτυχής ανάκτηση δεδομένων');
					} else if (current.message) {
						orgBonusData[orgId] = []; // Set empty to prevent retries
						loadingOrgs[orgId] = false;
						toast.error('Σφάλμα κατά την ανάκτηση δεδομένων');
					}
				});
			}
		}
	});
</script>

<div class="h-full w-full">
	<Map center={mapCenter} zoom={11}>
		{#each mappableOrgs as org (org.id)}
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
							class="absolute size-8 animate-pulsing rounded-full bg-emerald-500/40 repeat-infinite"
						></div>
						<!-- Outer pulse ring 2 (delayed) -->
						<div
							class="absolute size-6 animate-pulsing rounded-full bg-emerald-500/60 repeat-infinite [animation-delay:300ms]"
						></div>
						<!-- Inner glow -->
						<div
							class="absolute size-4 animate-pulse-fade-in rounded-full bg-emerald-400/80 blur-sm repeat-infinite"
						></div>
						<!-- Core dot -->
						<div
							class="relative size-3 rounded-full border-2 border-emerald-300 bg-emerald-500 shadow-lg shadow-emerald-500/50 repeat-infinite"
						></div>
					</div>
				</MarkerContent>

				<MarkerTooltip class="border border-border/50">
					<span class="font-bold">{org.store_name}</span>
				</MarkerTooltip>

				<MarkerPopup class="border border-border/50">
					<div class="w-90 space-y-4 p-3">
						<!-- Header -->
						<div class="flex items-start gap-3">
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50"
							>
								<MapPin class="size-5 text-emerald-600 dark:text-emerald-400" />
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
							<div class="flex h-[80px] items-center justify-center">
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
									<a
										href="mailto:{org.email}"
										class="truncate hover:text-foreground hover:underline"
									>
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
