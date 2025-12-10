<script lang="ts">
	import { Wrench, CheckCircle2, XCircle, AlertTriangle } from 'lucide-svelte';
	import { differenceInDays, parseISO } from 'date-fns';
	import type { Equipment, EquipmentStatus } from '$lib/models/equipment.types';
	import CustomButton from '../../../../lib/components/custom/register_settings/customButton/customButton.svelte';
	import MaintanceModal from './MaintanceModal.svelte';

	let { equipment }: { equipment: Equipment } = $props();
	let modalOpen = $state(false);
	// Derived state for service calculations
	let daysUntilService = $derived(
		equipment.next_service_date
			? differenceInDays(parseISO(equipment.next_service_date), new Date())
			: null
	);

	let serviceStatus = $derived.by(() => {
		if (daysUntilService === null) return 'unknown';
		if (daysUntilService < 0) return 'overdue';
		if (daysUntilService < 14) return 'warning';
		return 'good';
	});

	let statusCustom = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-gray-400' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	const statusColors: Record<EquipmentStatus, string> = {
		operational: 'bg-white/90 text-emerald-800 border-emerald-200 backdrop-blur-sm',
		maintenance: 'bg-white/90 text-orange-800 border-orange-200 backdrop-blur-sm',
		broken: 'bg-white/90 text-red-800 border-red-200 backdrop-blur-sm'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	const StatusIcon = statusIcons[equipment.status];
</script>

<div
	class="group relative cursor-pointer overflow-hidden rounded-xl border-1 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg {serviceStatus ===
	'overdue'
		? 'border-red-400'
		: serviceStatus === 'warning'
			? 'border-orange-200'
			: 'border-border/60'}"
	role="button"
	tabindex="0"
>
	<!-- Hero Image Section -->
	<div class="relative h-52 w-full overflow-hidden bg-muted">
		<img
			src={equipment.image_url || '/placeholder.svg'}
			alt={equipment.name}
			class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
		/>

		<!-- Status Badge -->
		<div class="absolute top-4 right-4">
			<span
				class={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors ${statusColors[equipment.status]}`}
			>
				<StatusIcon class="h-3 w-3" />
				{statusCustom.find((s) => s.value === equipment.status)?.label || equipment.status}
			</span>
		</div>
	</div>

	<!-- Content Section -->
	<div class="space-y-6 p-6">
		<div class="flex items-start justify-between">
			<div>
				<h3 class="font-serif text-xl font-medium tracking-wide text-foreground">
					{equipment.name}
				</h3>
				<p class="mt-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
					ID: #{equipment.id.toString().padStart(4, '0')}
				</p>
				{#if equipment.model}
					<p class="text-xs text-muted-foreground">
						{equipment.model}
					</p>
				{/if}
			</div>

			<CustomButton href={equipment.manual_url!} label="manual" />
		</div>

		<!-- Service Health Section -->
		{#if equipment.next_service_date}
			<div class="space-y-3">
				<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
					>Service Status</span
				>

				<!-- Bars and Text Layout -->
				<div class="flex w-full items-center justify-between">
					<!-- Left Group: Bars & Text -->
					<div class="flex items-center gap-4">
						<!-- Futuristic Vertical Bars -->
						<div class="flex h-4 items-center gap-1">
							{#each { length: 9 } as _, i}
								<div
									class={`w-1 rounded-full transition-all duration-500 ${
										i < serviceBars.count ? serviceBars.color : 'bg-muted/30'
									}`}
									style="height: 100%"
								></div>
							{/each}
						</div>

						<!-- Days Text -->
						<p
							class={`text-xs font-medium tracking-wide ${
								serviceStatus === 'overdue'
									? 'text-red-600'
									: serviceStatus === 'warning'
										? 'text-orange-600'
										: 'text-emerald-600'
							}`}
						>
							{daysUntilService === null
								? 'No service date'
								: daysUntilService < 0
									? `OVERDUE ${Math.abs(daysUntilService)} DAYS`
									: `${daysUntilService} DAYS REMAINING`}
						</p>
					</div>

					<!-- Right Group: Report Button -->
					<button
						onclick={() => {
							modalOpen = !modalOpen;
						}}
						class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 active:bg-orange-200"
					>
						<AlertTriangle class="h-3.5 w-3.5" />
						Report Issue
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
					>Service Status</span
				>
				<p class="text-xs text-muted-foreground">No service date scheduled</p>
			</div>
		{/if}
	</div>
</div>

<MaintanceModal bind:open={modalOpen} {equipment} />
