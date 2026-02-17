<script lang="ts">
	import { Shield, ShieldCheck } from '@lucide/svelte';
	import {
		Calendar,
		CalendarRange,
		CalendarDays,
		Clock,
		Timer,
		Zap,
		Coffee
	} from 'lucide-svelte';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		selectedFrequency = $bindable('daily' as Frequency),
		dailyStats = { total: 0, completed: 0 },
		weeklyStats = { total: 0, completed: 0 },
		monthlyStats = { total: 0, completed: 0 },
		combinedStats = { total: 0, completed: 0, progress: 0, totalMinutes: 0 }
	}: {
		selectedFrequency: Frequency;
		dailyStats: { total: number; completed: number };
		weeklyStats: { total: number; completed: number };
		monthlyStats: { total: number; completed: number };
		combinedStats: { total: number; completed: number; progress: number; totalMinutes: number };
	} = $props();

	const tabs: { key: Frequency; label: string; icon: typeof Calendar }[] = [
		{ key: 'daily', label: 'Ημερήσια', icon: Calendar },
		{ key: 'weekly', label: 'Εβδομαδιαία', icon: CalendarRange },
		{ key: 'monthly', label: 'Μηνιαία', icon: CalendarDays }
	];

	const statsMap = $derived({
		daily: dailyStats,
		weekly: weeklyStats,
		monthly: monthlyStats
	});

	const activeStats = $derived(statsMap[selectedFrequency]);

	const progressPercent = $derived(
		activeStats.total > 0 ? Math.round((activeStats.completed / activeStats.total) * 100) : 0
	);

	const accentMap: Record<Frequency, { color: string; bg: string; ring: string }> = {
		daily: { color: '#10b981', bg: 'bg-emerald-500/8 dark:bg-emerald-500/10', ring: 'ring-emerald-500/20' },
		weekly: { color: '#3b82f6', bg: 'bg-blue-500/8 dark:bg-blue-500/10', ring: 'ring-blue-500/20' },
		monthly: { color: '#f59e0b', bg: 'bg-amber-500/8 dark:bg-amber-500/10', ring: 'ring-amber-500/20' }
	};

	// ─── Time-of-day greeting ───
	const now = new Date();
	const currentHour = now.getHours();
	
	const todayFormatted = now.toLocaleDateString('el-GR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});

	const currentTime = $state(
		now.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false })
	);

	const freqPeriod: Record<Frequency, string> = {
		daily: 'Σήμερα',
		weekly: 'Αυτή την εβδομάδα',
		monthly: 'Αυτόν τον μήνα'
	};

	// Whether all tasks in active tab are done
	const allDone = $derived(activeStats.total > 0 && activeStats.completed === activeStats.total);
</script>

<header class="task-header">
	<!-- ─── Hero section ─── -->
	<div class="px-4 pt-6 pb-4 sm:px-6">
		<div class="flex items-start justify-between gap-4">
			<!-- Left: Greeting + date -->
			<div class="min-w-0 flex-1">
				<p class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
					{todayFormatted}
				</p>
				<h1 class="header-title mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Κάθε μέρα ξεκινά εδώ.
					<ShieldCheck class="ml-1 inline-block h-5 w-5 text-primary/60 sm:h-6 sm:w-6" />
				</h1>
				<p class="mt-1 text-[13px] text-muted-foreground/70">
					{#if allDone && activeStats.total > 0}
						Όλες οι εργασίες ολοκληρώθηκαν — καλή δουλειά!
					{:else if activeStats.total > 0}
						{activeStats.total - activeStats.completed} εργασίες απομένουν
					{:else}
						Δεν υπάρχουν εργασίες αυτή τη στιγμή
					{/if}
				</p>
			</div>

			<!-- Right: Progress ring -->
			{#if activeStats.total > 0}
				<div class="relative flex shrink-0 items-center justify-center">
					<svg class="progress-ring" width="64" height="64" viewBox="0 0 64 64">
						<circle
							cx="32" cy="32" r="27"
							fill="none"
							stroke="currentColor"
							stroke-width="3.5"
							opacity="0.06"
						/>
						<circle
							class="progress-ring__fill"
							cx="32" cy="32" r="27"
							fill="none"
							stroke={accentMap[selectedFrequency].color}
							stroke-width="3.5"
							stroke-linecap="round"
							stroke-dasharray={2 * Math.PI * 27}
							stroke-dashoffset={2 * Math.PI * 27 * (1 - progressPercent / 100)}
							transform="rotate(-90 32 32)"
						/>
					</svg>
					<div class="absolute flex flex-col items-center">
						<span class="text-base font-bold tabular-nums leading-none text-foreground">
							{progressPercent}%
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- ─── Quick stats row ─── -->
		{#if combinedStats.total > 0}
			<div class="mt-4 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
				<!-- Completed count -->
				<div class="stat-chip {accentMap[selectedFrequency].bg}">
					<Zap class="h-3 w-3 opacity-60" />
					<span class="tabular-nums font-semibold">{activeStats.completed}</span>
					<span class="text-muted-foreground/70">/ {activeStats.total}</span>
				</div>

				<!-- Time remaining -->
				{#if combinedStats.totalMinutes > 0}
					<div class="stat-chip bg-muted/50">
						<Timer class="h-3 w-3 text-muted-foreground/50" />
						<span class="tabular-nums font-semibold">{combinedStats.totalMinutes}′</span>
						<span class="text-muted-foreground/70">συνολ.</span>
					</div>
				{/if}

				<!-- Current time -->
				<div class="stat-chip bg-muted/50 ml-auto">
					<Clock class="h-3 w-3 text-muted-foreground/50" />
					<span class="tabular-nums font-semibold">{currentTime}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- ─── Frequency tabs ─── -->
	<div class="px-4 sm:px-6">
		<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
		<nav class="flex gap-1 border-b border-border/40" role="tablist">
			{#each tabs as tab (tab.key)}
				{@const isActive = selectedFrequency === tab.key}
				{@const s = statsMap[tab.key]}
				{@const Icon = tab.icon}
				<button
					role="tab"
					aria-selected={isActive}
					onclick={() => (selectedFrequency = tab.key)}
					class="tab-btn group relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-all duration-200
						{isActive
							? 'text-foreground'
							: 'text-muted-foreground/60 hover:text-muted-foreground'}"
				>
					<Icon class="h-3.5 w-3.5 transition-transform duration-200 {isActive ? 'scale-110' : 'scale-100'}" />
					<span class="tracking-wide">{tab.label}</span>
					{#if s.total > 0}
						<span
							class="stat-badge tabular-nums transition-all duration-200
								{isActive
									? 'bg-foreground/10 text-foreground'
									: 'bg-muted/60 text-muted-foreground/60'}"
						>
							{s.completed}/{s.total}
						</span>
					{/if}

					<!-- Active indicator -->
					{#if isActive}
						<span
							class="tab-indicator"
							style="background: {accentMap[selectedFrequency].color}"
						></span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>
</header>

<style>
	.header-title {
		font-family: var(--font-tailormade, 'Sansation', sans-serif);
	}

	.progress-ring__fill {
		transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
					stroke 0.4s ease;
	}

	.stat-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 8px;
		font-size: 11px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.stat-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 18px;
		min-width: 18px;
		padding: 0 5px;
		border-radius: 9px;
		font-size: 9px;
		font-weight: 700;
		line-height: 1;
	}

	.tab-indicator {
		position: absolute;
		bottom: -1px;
		left: 8%;
		right: 8%;
		height: 2.5px;
		border-radius: 2px 2px 0 0;
		opacity: 0.85;
		animation: tab-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes tab-slide-in {
		from {
			transform: scaleX(0);
			opacity: 0;
		}
		to {
			transform: scaleX(1);
			opacity: 0.85;
		}
	}

	.tab-btn {
		-webkit-tap-highlight-color: transparent;
		min-height: 44px;
	}

	/* Hide scrollbar on stats row */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
