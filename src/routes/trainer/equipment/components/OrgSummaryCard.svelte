<script lang="ts">
	import { Building2, AlertTriangle, Wrench, XCircle, CheckCircle2, CalendarDays } from 'lucide-svelte';

	type OrgCounts = {
		total: number;
		overdue: number;
		broken: number;
		maintenance: number;
		operational: number;
	};

	let {
		orgName,
		location,
		counts,
		isAssigned,
		lastVisitDate,
		index = 0,
		onclick
	}: {
		orgName: string;
		location: string | null;
		counts: OrgCounts;
		isAssigned: boolean;
		lastVisitDate: string | null;
		index?: number;
		onclick: () => void;
	} = $props();

	let hasIssues = $derived(counts.overdue > 0 || counts.broken > 0);

	function formatDate(dateStr: string): string {
		return new Intl.DateTimeFormat('el-GR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(dateStr));
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}
</script>

<button
	style="animation-delay: {index * 60}ms; animation-fill-mode: backwards;"
	class="group relative w-full animate-fade-in-down overflow-hidden rounded-2xl border text-left transition-all duration-200
		{hasIssues
		? 'border-red-500/30 hover:border-red-500/50 bg-gradient-to-br from-red-500/5 to-transparent'
		: 'border-border/40 hover:border-primary/30 bg-card/60'}
		backdrop-blur-sm hover:shadow-md"
	{onclick}
>
	<div class="p-4">
		<!-- Header -->
		<div class="flex items-start gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold
					{isAssigned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}"
			>
				{getInitials(orgName)}
			</div>

			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<p class="truncate text-sm font-semibold">{orgName}</p>
					{#if isAssigned}
						<span class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
							Ανατεθ.
						</span>
					{/if}
				</div>
				{#if location}
					<p class="truncate text-xs text-muted-foreground">{location}</p>
				{/if}
			</div>
		</div>

		<!-- Counts -->
		<div class="mt-3 grid grid-cols-4 gap-1.5">
			<div class="flex flex-col items-center rounded-lg bg-muted/40 px-2 py-1.5">
				<span class="text-xs font-bold text-foreground">{counts.total}</span>
				<span class="text-[9px] text-muted-foreground">Σύνολο</span>
			</div>
			<div class="flex flex-col items-center rounded-lg px-2 py-1.5
				{counts.operational > 0 ? 'bg-emerald-500/10' : 'bg-muted/40'}">
				<span class="text-xs font-bold {counts.operational > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}">
					{counts.operational}
				</span>
				<span class="text-[9px] text-muted-foreground">OK</span>
			</div>
			<div class="flex flex-col items-center rounded-lg px-2 py-1.5
				{counts.maintenance > 0 ? 'bg-orange-500/10' : 'bg-muted/40'}">
				<span class="text-xs font-bold {counts.maintenance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}">
					{counts.maintenance}
				</span>
				<span class="text-[9px] text-muted-foreground">Service</span>
			</div>
			<div class="flex flex-col items-center rounded-lg px-2 py-1.5
				{counts.broken > 0 || counts.overdue > 0 ? 'bg-red-500/10' : 'bg-muted/40'}">
				<span class="text-xs font-bold {counts.broken > 0 || counts.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}">
					{counts.broken + counts.overdue}
				</span>
				<span class="text-[9px] text-muted-foreground">Προβλ.</span>
			</div>
		</div>

		<!-- Last visit -->
		{#if lastVisitDate}
			<div class="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
				<CalendarDays class="h-3 w-3" />
				<span>Τελευταία επίσκεψη: {formatDate(lastVisitDate)}</span>
			</div>
		{/if}
	</div>
</button>
