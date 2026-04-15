<script lang="ts">
	import { Wrench, CheckCircle2, XCircle, AlertTriangle, Plus, MessageSquareWarning } from 'lucide-svelte';
	import { differenceInDays, parseISO } from 'date-fns';
	import type { Equipment, EquipmentStatus, EquipmentWithLogCount } from '$lib/models/equipment.types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let {
		equipment,
		index = 0,
		visitMode = false,
		onAddAction,
		onViewLogs
	}: {
		equipment: EquipmentWithLogCount;
		index?: number;
		visitMode?: boolean;
		onAddAction?: (equipmentId: number) => void;
		onViewLogs?: (equipmentId: number) => void;
	} = $props();

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

	let serviceBars = $derived.by(() => {
		if (serviceStatus === 'overdue') return { count: 1, color: 'bg-red-500' };
		if (serviceStatus === 'warning') return { count: 4, color: 'bg-orange-400' };
		if (serviceStatus === 'unknown') return { count: 0, color: 'bg-muted-foreground/30' };
		return { count: 9, color: 'bg-emerald-500' };
	});

	const statusColors: Record<EquipmentStatus, string> = {
		operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
		maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20',
		broken: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
	};

	const statusLabels: Record<EquipmentStatus, string> = {
		operational: 'Σε λειτουργία',
		maintenance: 'Σε service',
		broken: 'Βλάβη'
	};

	const statusIcons = {
		operational: CheckCircle2,
		maintenance: Wrench,
		broken: XCircle
	};

	const StatusIcon = $derived(statusIcons[equipment.status]);

	const borderColor = $derived(
		serviceStatus === 'overdue'
			? 'border-red-500/40 hover:border-red-500/60'
			: serviceStatus === 'warning'
				? 'border-orange-400/40 hover:border-orange-400/60'
				: 'border-border/60 hover:border-border'
	);

	let logCount = $derived(equipment.maintenance_logs?.[0]?.count ?? 0);
</script>

<div
	role="button"
	tabindex="0"
	onclick={() => onViewLogs?.(equipment.id)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onViewLogs?.(equipment.id);
		}
	}}
	style="animation-delay: {index * 60}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-down cursor-pointer overflow-hidden rounded-xl border bg-gradient-to-br from-muted/50 to-transparent backdrop-blur-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {borderColor}"
>
	<!-- Image -->
	<div class="relative h-36 w-full overflow-hidden">
		{#if equipment.image_url}
			<img
				src={equipment.image_url}
				loading="lazy"
				decoding="async"
				width="400"
				height="200"
				class="h-full w-full object-cover"
				alt={equipment.name}
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-muted/50">
				<Wrench class="h-10 w-10 text-muted-foreground/30" />
			</div>
		{/if}

		<!-- Status Badge -->
		<div class="absolute top-2 right-2">
			<Badge
				class="gap-1 rounded-md border-0 px-2 py-0.5 text-[9px] font-semibold shadow-sm backdrop-blur-md {statusColors[equipment.status]}"
			>
				<StatusIcon class="h-2.5 w-2.5" />
				{statusLabels[equipment.status]}
			</Badge>
		</div>

		<!-- Service dot -->
		<div class="absolute top-2 left-2">
			<div
				class="h-2 w-2 rounded-full ring-2 ring-black/20 {serviceStatus === 'overdue'
					? 'bg-red-500 shadow-sm shadow-red-500/50'
					: serviceStatus === 'warning'
						? 'bg-orange-400 shadow-sm shadow-orange-400/50'
						: serviceStatus === 'good'
							? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
							: 'bg-muted-foreground/40'}"
			></div>
		</div>

		<!-- Maintenance log count badge -->
		{#if logCount > 0}
			<div class="absolute bottom-2 left-2">
				<Badge class="gap-1 border-0 bg-orange-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm backdrop-blur-sm">
					<MessageSquareWarning class="h-2.5 w-2.5" />
					{logCount} αναφορ{logCount === 1 ? 'ά' : 'ές'}
				</Badge>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="space-y-3 p-3.5">
		<!-- Name & Model -->
		<div class="min-w-0">
			<h4 class="truncate text-sm font-semibold tracking-tight">{equipment.name}</h4>
			<div class="mt-0.5 flex items-center gap-2">
				<span class="rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground/60">
					#{equipment.id.toString().padStart(4, '0')}
				</span>
				{#if equipment.model}
					<span class="truncate text-[11px] text-muted-foreground/70">{equipment.model}</span>
				{/if}
			</div>
		</div>

		<!-- Service Health -->
		{#if equipment.next_service_date}
			<div class="space-y-1.5 rounded-lg bg-muted/30 p-2.5 dark:bg-muted/15">
				<div class="flex items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						<div class="flex h-4 items-end gap-px">
							{#each { length: 9 } as _, i}
								<div
									class="w-[3px] rounded-full transition-all duration-500 {i < serviceBars.count
										? serviceBars.color
										: 'bg-muted/40 dark:bg-muted/20'}"
									style="height: {35 + i * 7}%"
								></div>
							{/each}
						</div>
						<p class="text-[11px] font-medium {serviceStatus === 'overdue'
								? 'text-red-600 dark:text-red-400'
								: serviceStatus === 'warning'
									? 'text-orange-600 dark:text-orange-400'
									: 'text-emerald-600 dark:text-emerald-400'}">
							{daysUntilService === null
								? '—'
								: daysUntilService < 0
									? `ΚΑΘΥΣΤ. ${Math.abs(daysUntilService)} ΜΕΡΕΣ`
									: `${daysUntilService} ΜΕΡΕΣ`}
						</p>
					</div>

					{#if logCount > 0}
						<button
							class="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
							onclick={(e) => {
								e.stopPropagation();
								onViewLogs?.(equipment.id);
							}}
						>
							{logCount} αναφορ{logCount === 1 ? 'ά' : 'ές'}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Maintenance Logs indicator (shown when no service date section or no image) -->
		{#if logCount > 0 && !equipment.next_service_date}
			<button
				class="flex w-full items-center gap-2 rounded-lg bg-orange-500/10 p-2.5 text-left transition-colors hover:bg-orange-500/15"
				onclick={(e) => {
					e.stopPropagation();
					onViewLogs?.(equipment.id);
				}}
			>
				<MessageSquareWarning class="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
				<div class="min-w-0 flex-1">
					<p class="text-[11px] font-medium text-orange-700 dark:text-orange-300">
						{logCount} αναφορ{logCount === 1 ? 'ά' : 'ές'} προβλημάτων
					</p>
				</div>
			</button>
		{/if}

		<!-- Visit Mode Action -->
		{#if visitMode}
			<Button
				variant="outline"
				size="sm"
				class="w-full gap-1.5 text-xs"
				onclick={(e: MouseEvent) => {
					e.stopPropagation();
					onAddAction?.(equipment.id);
				}}
			>
				<Plus class="h-3.5 w-3.5" />
				Προσθήκη Ενέργειας
			</Button>
		{/if}
	</div>
</div>
