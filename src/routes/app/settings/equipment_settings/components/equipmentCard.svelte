<script lang="ts">
	import type { EquipmentWithLogCount } from '$lib/models/equipment.types';
	import { Badge } from '$lib/components/ui/badge';
	import { CheckCircle2, XCircle, Wrench } from 'lucide-svelte';
	import { differenceInDays, parseISO } from 'date-fns';
	import type { EquipmentStatus } from '$lib/models/equipment.types';
	import { goto } from '$app/navigation';

	let {
		equipment,
		index,
		backQuery = ''
	}: {
		equipment: EquipmentWithLogCount;
		index: number;
		backQuery?: string;
	} = $props();

	let logCount = $derived(equipment.maintenance_logs?.[0]?.count ?? 0);

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
		{ value: 'maintenance', label: 'Σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-muted-foreground/30' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	const statusColors: Record<EquipmentStatus, string> = {
		operational:
			'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
		maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20',
		broken: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	let StatusIcon = $derived(statusIcons[equipment.status]);

	const borderColor = $derived(
		serviceStatus === 'overdue'
			? 'border-red-500/40 hover:border-red-500/60'
			: serviceStatus === 'warning'
				? 'border-orange-400/40 hover:border-orange-400/60'
				: 'border-border/60 hover:border-border'
	);
</script>

<button
	onclick={() => goto(`/app/settings/equipment_settings/${equipment.id}${backQuery}`)}
	style="animation-delay: {index * 80}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-right cursor-pointer overflow-hidden rounded-xl border bg-background/70 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:bg-background/50 {borderColor}"
>
	<!-- Hero Image -->
	<div class="relative h-48 w-full overflow-hidden sm:h-52">
		<img
			src={equipment.image_url}
			loading="lazy"
			decoding="async"
			width="400"
			height="250"
			class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
			alt={equipment.name}
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
		></div>

		<!-- Logs badge top-right -->
		<div class="absolute top-3 right-3 left-3 z-10 flex items-center justify-end">
			{#if logCount > 0}
				<span
					class="inline-flex items-center gap-1.5 rounded-md bg-red-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md"
				>
					<Wrench class="h-3 w-3" />
					{logCount} Logs
					{#if serviceStatus === 'overdue'}
						<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
					{/if}
				</span>
			{/if}
		</div>

		<!-- Status badge bottom-right -->
		<div class="absolute right-3 bottom-3">
			<Badge
				class="gap-1.5 rounded-md border-0 px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-md {statusColors[
					equipment.status
				]}"
			>
				<StatusIcon class="h-3 w-3" />
				{statusCustom.find((s) => s.value === equipment.status)?.label || equipment.status}
			</Badge>
		</div>

		<!-- Service dot bottom-left -->
		<div class="absolute bottom-3 left-3">
			<div
				class="h-2.5 w-2.5 rounded-full ring-2 ring-black/20 {serviceStatus === 'overdue'
					? 'bg-red-500 shadow-sm shadow-red-500/50'
					: serviceStatus === 'warning'
						? 'bg-orange-400 shadow-sm shadow-orange-400/50'
						: serviceStatus === 'good'
							? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
							: 'bg-muted-foreground/40'}"
			></div>
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-4 p-4 sm:p-5">
		<!-- Header -->
		<div>
			<h3
				class="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary"
			>
				{equipment.name}
			</h3>
			<div class="mt-1 flex flex-wrap items-center gap-2">
				<span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
					#{equipment.id.toString().padStart(4, '0')}
				</span>
				{#if equipment.model}
					<span class="text-xs text-muted-foreground/70">{equipment.model}</span>
				{/if}
			</div>
		</div>

		<!-- Service Health -->
		{#if equipment.next_service_date}
			<div class="space-y-2.5 rounded-lg bg-muted/30 p-3 dark:bg-muted/15">
				<span class="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
					Service Status
				</span>

				<div class="flex w-full items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div class="flex h-5 items-end gap-0.5">
							{#each { length: 9 } as _, i}
								<div
									class="w-1 rounded-full transition-all duration-500 {i < serviceBars.count
										? serviceBars.color
										: 'bg-muted/40 dark:bg-muted/20'}"
									style="height: {40 + i * 7}%"
								></div>
							{/each}
						</div>

						<p
							class="text-xs font-medium {serviceStatus === 'overdue'
								? 'text-red-600 dark:text-red-400'
								: serviceStatus === 'warning'
									? 'text-orange-600 dark:text-orange-400'
									: 'text-emerald-600 dark:text-emerald-400'}"
						>
							{daysUntilService === null
								? 'No service date'
								: daysUntilService < 0
									? `OVERDUE ${Math.abs(daysUntilService)} DAYS`
									: `${daysUntilService} DAYS REMAINING`}
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg bg-muted/30 p-3 dark:bg-muted/15">
				<span class="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
					Service Status
				</span>
				<p class="mt-1.5 text-xs text-muted-foreground/60">No service date scheduled</p>
			</div>
		{/if}
	</div>
</button>
