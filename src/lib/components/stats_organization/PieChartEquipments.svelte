<script lang="ts">
	import { Monitor, Wrench, XCircle, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { PieChart } from 'layerchart';
	import Button from '$lib/components/ui/button/button.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let { stats, onRefresh, isLoading = false } = $props<{
		stats: {
			total: number;
			byStatus: { operational: number; maintenance: number; broken: number };
			byServiceStatus: { good: number; warning: number; overdue: number };
			totalOrgs: number;
		} | null;
		onRefresh?: () => void;
		isLoading?: boolean;
	}>();

	// Chart config for equipment status
	const chartConfig = {
		operational: {
			label: 'Σε λειτουργία',
			color: 'hsl(152 60% 45%)'
		},
		maintenance: {
			label: 'Σε service',
			color: 'hsl(38 92% 50%)'
		},
		broken: {
			label: 'Βλάβη',
			color: 'hsl(0 72% 51%)'
		}
	} satisfies Chart.ChartConfig;

	// Pie chart data
	let pieData = $derived.by(() => {
		if (!stats) return [];

		return [
			{
				status: 'operational',
				count: stats.byStatus.operational,
				color: chartConfig.operational.color
			},
			{
				status: 'maintenance',
				count: stats.byStatus.maintenance,
				color: chartConfig.maintenance.color
			},
			{
				status: 'broken',
				count: stats.byStatus.broken,
				color: chartConfig.broken.color
			}
		].filter((d) => d.count > 0);
	});

	// Calculate percentages
	function getPercentage(value: number): string {
		if (!stats || stats.total === 0) return '0%';
		return `${Math.round((value / stats.total) * 100)}%`;
	}
</script>

<Card.Root class="relative flex flex-col rounded-2xl p-6 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm h-full">
	<!-- Subtle gradient background - different from others -->
	<div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-rose-500/5 -z-10"></div>
	
	<!-- Subtle ambient glow -->
	<div class="absolute -top-32 -right-32 w-64 h-64 bg-orange-400/8 rounded-full blur-3xl -z-10"></div>
	<div class="absolute -bottom-32 -left-32 w-64 h-64 bg-rose-400/8 rounded-full blur-3xl -z-10"></div>

	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="text-base">Επισκόπηση Εξοπλισμού</Card.Title>
				<Card.Description class="text-xs">
					{stats?.totalOrgs ?? 0} καταστήματα • {stats?.total ?? 0} συσκευές
				</Card.Description>
			</div>
			
			{#if onRefresh}
				<Button 
					variant="ghost" 
					size="icon" 
					class="h-8 w-8" 
					onclick={onRefresh}
					disabled={isLoading}
				>
					<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin-clockwise repeat-infinite' : ''}" />
				</Button>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="flex-1 pt-4">
		{#if !isLoading && (stats && stats.total > 0)}
			<div class="flex items-center gap-6">
				<!-- Pie Chart -->
				<div class="flex-shrink-0">
					<Chart.Container config={chartConfig} class="aspect-square h-[140px] w-[140px]">
						<PieChart
							data={pieData}
							key="status"
							value="count"
							c="color"
							innerRadius={45}
							props={{ 
								pie: { 
									motion: 'tween',
								} 
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel indicator="line" />
							{/snippet}
						</PieChart>
					</Chart.Container>
				</div>

				<!-- Stats -->
				<div class="flex flex-col gap-3 flex-1">
					<!-- Equipment Status Legend -->
					<div class="space-y-2">
						<p class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Κατάσταση</p>
						
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full" style="background-color: {chartConfig.operational.color}"></div>
							<span class="text-xs flex-1">Λειτουργικά</span>
							<span class="text-xs font-semibold">{stats.byStatus.operational}</span>
						</div>
						
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full" style="background-color: {chartConfig.maintenance.color}"></div>
							<span class="text-xs flex-1">Σε service</span>
							<span class="text-xs font-semibold">{stats.byStatus.maintenance}</span>
						</div>
						
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full" style="background-color: {chartConfig.broken.color}"></div>
							<span class="text-xs flex-1">Βλάβη</span>
							<span class="text-xs font-semibold">{stats.byStatus.broken}</span>
						</div>
					</div>
				</div>
			</div>
        {:else if isLoading}
            <div class="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
				<div class="text-center">
					<Spinner />
				</div>
			</div>
		{:else}
			<div class="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
				<div class="text-center">
					<Monitor class="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p>Δεν υπάρχει εξοπλισμός</p>
				</div>
			</div>
		{/if}
	</Card.Content>

	<!-- Service Status Footer -->
	<Card.Footer class="pt-4 border-t border-border/40">
		<div class="w-full">
			<p class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Service Status</p>
			<div class="flex items-center gap-4">
				<!-- Good -->
				<div class="flex items-center gap-1.5">
					<CheckCircle class="h-3.5 w-3.5 text-emerald-500" />
					<span class="text-xs font-medium">{stats?.byServiceStatus.good ?? 0}</span>
					<span class="text-[10px] text-muted-foreground">OK</span>
				</div>
				
				<div class="h-3 w-px bg-border/60"></div>
				
				<!-- Warning -->
				<div class="flex items-center gap-1.5">
					<AlertTriangle class="h-3.5 w-3.5 text-orange-500" />
					<span class="text-xs font-medium">{stats?.byServiceStatus.warning ?? 0}</span>
					<span class="text-[10px] text-muted-foreground">Service</span>
				</div>
				
				<div class="h-3 w-px bg-border/60"></div>
				
				<!-- Overdue -->
				<div class="flex items-center gap-1.5">
					<Clock class="h-3.5 w-3.5 text-red-500" />
					<span class="text-xs font-medium">{stats?.byServiceStatus.overdue ?? 0}</span>
					<span class="text-[10px] text-muted-foreground">Overdue</span>
				</div>
			</div>
		</div>
	</Card.Footer>
</Card.Root>