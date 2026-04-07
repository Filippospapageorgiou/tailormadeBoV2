<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		ArrowLeft,
		Play,
		MapPin,
		Phone,
		Search,
		Wrench,
		AlertTriangle,
		CheckCircle2,
		XCircle,
		Cog,
		RefreshCw
	} from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { getOrgEquipment, startVisit } from '$lib/api/trainers/equipment/data.remote.js';
	import type { EquipmentStatus } from '$lib/models/equipment.types.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import TrainerEquipmentCard from '../components/TrainerEquipmentCard.svelte';
	import ImagePreviewModal from '$lib/components/custom/ImagePreviewModal.svelte';

	// Add state for the modal
	let previewOpen = $state(false);
	let previewUrl = $state<string | null>(null);

	function openPreview(url: string) {
		previewUrl = url;
		previewOpen = true;
	}

	let orgId = $derived(Number(page.params.org_id));
	let orgQuery = $derived(getOrgEquipment({ orgId }));

	let org = $derived(orgQuery?.current?.org);
	let equipments = $derived((orgQuery?.current?.equipments ?? []) as any[]);
	let issues = $derived((orgQuery?.current?.issues ?? []) as any[]);
	let loading = $derived(orgQuery?.current === undefined);

	// Filters
	let searchQuery = $state('');
	let statusFilter = $state<EquipmentStatus | 'all' | 'overdue'>('all');

	let filteredEquipments = $derived.by(() => {
		let filtered = equipments;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(e: any) => e.name.toLowerCase().includes(q) || e.model?.toLowerCase().includes(q)
			);
		}
		if (statusFilter === 'overdue') {
			const today = new Date().toISOString().split('T')[0];
			filtered = filtered.filter((e: any) => e.next_service_date && e.next_service_date < today);
		} else if (statusFilter !== 'all') {
			filtered = filtered.filter((e: any) => e.status === statusFilter);
		}
		return filtered;
	});

	let counts = $derived({
		total: equipments.length,
		operational: equipments.filter((e: any) => e.status === 'operational').length,
		maintenance: equipments.filter((e: any) => e.status === 'maintenance').length,
		broken: equipments.filter((e: any) => e.status === 'broken').length,
		overdue: equipments.filter((e: any) => {
			const today = new Date().toISOString().split('T')[0];
			return e.next_service_date && e.next_service_date < today;
		}).length
	});

	let isStarting = $state(false);

	async function handleStartVisit() {
		isStarting = true;
		try {
			const result = await startVisit({ orgId });
			if (result.success && result.visit) {
				showSuccessToast('Επίσκεψη', 'Η επίσκεψη ξεκίνησε');
				goto(`/trainer/equipment/visit/${result.visit.id}`);
			} else {
				showFailToast('Σφάλμα', result.message || 'Αποτυχία');
			}
		} catch {
			showFailToast('Σφάλμα', 'Κάτι πήγε στραβά');
		} finally {
			isStarting = false;
		}
	}

	function handleViewLogs(equipmentId: number) {
		// TODO: logs modal
	}

	const statusFilters: { value: EquipmentStatus | 'all' | 'overdue'; label: string }[] = [
		{ value: 'all', label: 'Όλα' },
		{ value: 'operational', label: 'Λειτουργικά' },
		{ value: 'maintenance', label: 'Service' },
		{ value: 'broken', label: 'Βλάβη' },
		{ value: 'overdue', label: 'Εκπρόθεσμα' }
	];

	let isRefreshing = $state(false);
	async function refresh() {
		isRefreshing = true;
		await orgQuery.refresh();
		isRefreshing = false;
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-4 pt-6">
	<!-- Back + Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="h-9 w-9 rounded-xl"
				onclick={() => goto('/trainer/equipment')}
			>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				{#if loading}
					<div class="h-6 w-48 animate-pulse rounded bg-muted/40"></div>
					<div class="mt-1 h-4 w-32 animate-pulse rounded bg-muted/30"></div>
				{:else if org}
					<h1 class="text-xl font-semibold">{org.store_name}</h1>
					<div class="flex items-center gap-3 text-sm text-muted-foreground">
						{#if org.location}
							<span class="flex items-center gap-1">
								<MapPin class="h-3 w-3" />
								{org.location}
							</span>
						{/if}
						{#if org.phone}
							<span class="flex items-center gap-1">
								<Phone class="h-3 w-3" />
								{org.phone}
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl" onclick={refresh}>
				<RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise repeat-infinite' : ''}" />
			</Button>
			<Button class="gap-2 rounded-xl" disabled={isStarting || loading} onclick={handleStartVisit}>
				{#if isStarting}
					<Spinner class="h-4 w-4" />
					Έναρξη...
				{:else}
					<Play class="h-4 w-4" />
					Έναρξη Επίσκεψης
				{/if}
			</Button>
		</div>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
		{#each [{ label: 'Σύνολο', value: counts.total, color: 'text-foreground' }, { label: 'Λειτουργικά', value: counts.operational, color: 'text-emerald-600 dark:text-emerald-400' }, { label: 'Service', value: counts.maintenance, color: 'text-orange-600 dark:text-orange-400' }, { label: 'Βλάβη', value: counts.broken, color: 'text-red-600 dark:text-red-400' }, { label: 'Εκπρόθεσμα', value: counts.overdue, color: 'text-red-600 dark:text-red-400' }] as stat}
			<div class="rounded-xl border border-border/40 bg-card/60 p-3 text-center backdrop-blur-sm">
				<p class="text-lg font-bold {stat.color}">{loading ? '—' : stat.value}</p>
				<p class="text-[10px] text-muted-foreground">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative min-w-[180px] flex-1">
			<Search class="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Αναζήτηση μηχανήματος..."
				class="h-9 rounded-xl pl-9 text-sm"
				bind:value={searchQuery}
			/>
		</div>
		<div class="flex items-center gap-1">
			{#each statusFilters as filter}
				<Button
					variant={statusFilter === filter.value ? 'default' : 'ghost'}
					size="sm"
					class="h-7 rounded-lg px-2.5 text-[11px]"
					onclick={() => (statusFilter = filter.value)}
				>
					{filter.label}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Equipment Grid -->
	{#if loading}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(4) as _}
				<div class="h-64 animate-pulse rounded-xl bg-muted/40"></div>
			{/each}
		</div>
	{:else if filteredEquipments.length > 0}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredEquipments as eq, i (eq.id)}
				<TrainerEquipmentCard equipment={eq} index={i} onViewLogs={handleViewLogs} />
			{/each}
		</div>
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/60 py-12 text-muted-foreground"
		>
			<Cog class="mb-2 h-8 w-8 opacity-30" />
			<p class="text-sm">
				{equipments.length === 0 ? 'Δεν υπάρχει εξοπλισμός' : 'Κανένα αποτέλεσμα με τα φίλτρα'}
			</p>
		</div>
	{/if}

	<!-- Issues for this Org -->
	{#if issues.length > 0}
		<Card.Root
			class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
		>
			<div
				class="absolute -bottom-16 -left-16 -z-10 h-32 w-32 rounded-full bg-orange-500/8 blur-3xl"
			></div>
			<Card.Header class="pb-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-orange-500/10 p-2">
						<AlertTriangle class="h-4 w-4 text-orange-600 dark:text-orange-400" />
					</div>
					<div>
						<Card.Title class="text-base">Αναφορές Προβλημάτων</Card.Title>
						<Card.Description class="text-xs"
							>Πρόσφατες αναφορές για αυτό το κατάστημα</Card.Description
						>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each issues.slice(0, 10) as issue, i}
					{@const eqName = issue.equipment?.name ?? '—'}
					{@const reporter = issue.profiles?.username ?? 'Άγνωστος'}
					{@const date = new Intl.DateTimeFormat('el-GR', {
						day: 'numeric',
						month: 'short',
						hour: '2-digit',
						minute: '2-digit'
					}).format(new Date(issue.created_at))}
					<div
						style="animation-delay: {i * 40}ms; animation-fill-mode: backwards;"
						class="flex animate-fade-in-down items-start gap-3 rounded-xl border border-border/30 bg-background/50 p-3"
					>
						<div
							class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10"
						>
							<AlertTriangle class="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium">{eqName}</p>
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
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Image Preview Modal -->
<ImagePreviewModal bind:open={previewOpen} imageUrl={previewUrl} />
