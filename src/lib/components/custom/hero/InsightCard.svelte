<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import {
		TrendingUp,
		Target,
		CheckCircle2,
		Clock,
		Activity,
		Award,
		Calendar,
		Hourglass,
		CircleDashed
	} from 'lucide-svelte';
	import { getTasksAndBonuses } from '$lib/api/stats/data.remote';
	import { toast } from 'svelte-sonner';

	let queryTasksBonus = getTasksAndBonuses();

	let data = $derived(queryTasksBonus.current?.data);
	let todayTasks = $derived(data?.todayTasks);
	let weeklyTasks = $derived(data?.weeklyTasks);
	let monthlyTasks = $derived(data?.monthlyTasks);
	let bonuses = $derived(data?.bonuses);

	// Combined totals across all frequencies
	let allTasks = $derived((() => {
		if (!todayTasks || !weeklyTasks || !monthlyTasks) return null;
		const total = todayTasks.totalTasks + weeklyTasks.totalTasks + monthlyTasks.totalTasks;
		const completed =
			todayTasks.completedTasks + weeklyTasks.completedTasks + monthlyTasks.completedTasks;
		const pending =
			todayTasks.pendingTasks + weeklyTasks.pendingTasks + monthlyTasks.pendingTasks;
		return {
			hasTasks: total > 0,
			totalTasks: total,
			completedTasks: completed,
			pendingTasks: pending,
			completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
		};
	})());

	// Animation state for the ring
	let animatedPercentage = $state(0);
	let isLoaded = $state(false);

	$effect(() => {
		if (!queryTasksBonus?.current?.success && queryTasksBonus.current?.message) {
			toast.error(queryTasksBonus.current?.message || '');
		}
	});

	// Animate the ring when data loads
	$effect(() => {
		if (allTasks && !isLoaded) {
			isLoaded = true;
			const target = allTasks.completionPercentage;
			const duration = 1500;
			const startTime = performance.now();

			function animate(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const eased = 1 - Math.pow(1 - progress, 3);
				animatedPercentage = Math.round(target * eased);
				if (progress < 1) {
					requestAnimationFrame(animate);
				}
			}

			requestAnimationFrame(animate);
		}
	});

	// Active tab state
	let activeTab = $state('performance');

	// Circular progress calculation
	function getCircleProgress(percentage: number) {
		const radius = 52;
		const circumference = 2 * Math.PI * radius;
		const offset = circumference - (percentage / 100) * circumference;
		return { radius, circumference, offset };
	}

	let mainProgress = $derived(getCircleProgress(animatedPercentage));

	// Secondary rings based on combined tasks
	let completedRatio = $derived(
		allTasks?.totalTasks ? allTasks.completedTasks / allTasks.totalTasks : 0
	);
	let pendingRatio = $derived(
		allTasks?.totalTasks ? allTasks.pendingTasks / allTasks.totalTasks : 0
	);

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('el-GR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(amount);
	}
</script>

<Card
	style="animation-delay: 100ms; animation-fill-mode: backwards;"
	class="relative h-full animate-fade-in-left overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-background via-card/30 to-background shadow-sm"
>
	<!-- Ambient glow effect - theme aware -->
	<div
		class="pointer-events-none absolute -top-20 right-0 h-48 w-48 animate-float rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-3xl"
		style="animation-delay: 1.5s;"
	></div>
	<div
		class="pointer-events-none absolute -bottom-20 left-0 h-40 w-40 animate-float rounded-full bg-primary/8 dark:bg-primary/5 blur-3xl"
		style="animation-delay: 4s;"
	></div>

	<div class="relative flex h-full flex-col p-6">
		<!-- Header -->
		<div class="mb-4 space-y-1">
			<div class="flex items-center gap-2">
				<Activity class="h-4 w-4 text-primary" />
				<h3 class="font-tailormade font-medium text-foreground/90">Insights</h3>
			</div>
			<p class="text-xs text-muted-foreground/70">Όλες οι εργασίες & Bonus</p>
		</div>

		<!-- Tabs -->
		<Tabs value={activeTab} onValueChange={(v) => (activeTab = v)} class="w-full">
			<TabsList class="grid w-full grid-cols-2 bg-muted/40 dark:bg-muted/30 p-1">
				<TabsTrigger
					value="performance"
					class="text-xs font-normal data-[state=active]:bg-background data-[state=active]:shadow-sm"
				>
					<span class="flex items-center gap-1.5">
						<Target class="h-3 w-3" />
						Εργασίες
					</span>
				</TabsTrigger>
				<TabsTrigger
					value="trends"
					class="text-xs font-normal data-[state=active]:bg-background data-[state=active]:shadow-sm"
				>
					<span class="flex items-center gap-1.5">
						<Award class="h-3 w-3" />
						Bonus
					</span>
				</TabsTrigger>
			</TabsList>

			<!-- Tasks Tab -->
			<TabsContent value="performance" class="mt-4 space-y-4">
				{#if !allTasks}
					<!-- Loading state -->
					<div class="flex items-center gap-4">
						<div class="h-32 w-32 animate-pulse rounded-full bg-muted/20"></div>
						<div class="flex-1 space-y-3">
							<div class="h-14 animate-pulse rounded-lg bg-muted/20"></div>
							<div class="h-14 animate-pulse rounded-lg bg-muted/20"></div>
							<div class="h-14 animate-pulse rounded-lg bg-muted/20"></div>
						</div>
					</div>
				{:else if !allTasks.hasTasks}
					<!-- No tasks -->
					<div
						class="flex h-40 flex-col items-center justify-center rounded-lg border border-border/30 bg-muted/20 text-center"
					>
						<CheckCircle2 class="mb-2 h-8 w-8 text-emerald-500/40 dark:text-emerald-400/40" />
						<p class="text-sm text-muted-foreground/70">Δεν έχεις εργασίες!</p>
						<p class="text-xs text-muted-foreground/50">Δεν υπάρχουν ανατεθειμένες εργασίες</p>
					</div>
				{:else}
					<div class="flex items-center gap-4">
						<!-- Animated Circular Progress Chart -->
						<div class="relative flex-shrink-0">
							<svg class="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
								<!-- Background circle -->
								<circle
									cx="60"
									cy="60"
									r={52}
									stroke="currentColor"
									stroke-width="8"
									fill="transparent"
									class="text-muted/15 dark:text-muted/10"
								/>
								<!-- Completed ring (green) -->
								<circle
									cx="60"
									cy="60"
									r="42"
									stroke="currentColor"
									stroke-width="6"
									fill="transparent"
									class="text-emerald-500/50 dark:text-emerald-400/50 transition-all duration-1000 ease-out"
									stroke-dasharray={2 * Math.PI * 42}
									stroke-dashoffset={2 *
										Math.PI *
										42 *
										(1 - completedRatio * (animatedPercentage / 100))}
									stroke-linecap="round"
								/>
								<!-- Pending ring (amber) -->
								<circle
									cx="60"
									cy="60"
									r="32"
									stroke="currentColor"
									stroke-width="6"
									fill="transparent"
									class="text-amber-500/35 dark:text-amber-400/35 transition-all duration-1000 ease-out"
									stroke-dasharray={2 * Math.PI * 32}
									stroke-dashoffset={2 *
										Math.PI *
										32 *
										(1 - pendingRatio * (animatedPercentage / 100))}
									stroke-linecap="round"
								/>
								<!-- Primary progress ring -->
								<circle
									cx="60"
									cy="60"
									r={mainProgress.radius}
									stroke="currentColor"
									stroke-width="8"
									fill="transparent"
									class="text-primary/90 drop-shadow-[0_0_6px_rgba(var(--primary),0.25)] transition-all duration-100"
									stroke-dasharray={mainProgress.circumference}
									stroke-dashoffset={mainProgress.offset}
									stroke-linecap="round"
								/>
							</svg>
							<!-- Center text -->
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span
									class="font-tailormade text-2xl font-semibold tabular-nums text-foreground/90"
								>
									{animatedPercentage}%
								</span>
								<span class="text-[10px] text-muted-foreground/60">ολοκλήρωση</span>
							</div>
						</div>

						<!-- Tasks Metrics List -->
						<div class="flex-1 space-y-3">
							<!-- Total Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/30 bg-card/30 p-2.5 transition-colors hover:bg-card/60"
								style="animation-delay: 200ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/15"
									>
										<Target class="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-normal text-foreground/80">Σύνολο Εργασιών</span>
										<span class="text-[10px] text-muted-foreground/60">Ημ. · Εβδ. · Μήνας</span>
									</div>
								</div>
								<span
									class="font-tailormade text-sm font-semibold text-sky-600 dark:text-sky-400 tabular-nums"
									>{allTasks.totalTasks}</span
								>
							</div>

							<!-- Completed Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/30 bg-card/30 p-2.5 transition-colors hover:bg-card/60"
								style="animation-delay: 300ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15"
									>
										<CheckCircle2 class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-normal text-foreground/80">Ολοκληρωμένες</span>
										<span class="text-[10px] text-muted-foreground/60">Έτοιμα tasks</span>
									</div>
								</div>
								<span
									class="font-tailormade text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
									>{allTasks.completedTasks}</span
								>
							</div>

							<!-- Pending Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/30 bg-card/30 p-2.5 transition-colors hover:bg-card/60"
								style="animation-delay: 400ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/15"
									>
										<Hourglass class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-normal text-foreground/80">Εκκρεμούν</span>
										<span class="text-[10px] text-muted-foreground/60">Απομένουν</span>
									</div>
								</div>
								<span
									class="font-tailormade text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums"
									>{allTasks.pendingTasks}</span
								>
							</div>
						</div>
					</div>

					<!-- Ring Legend -->
					<div class="flex items-center justify-center gap-4 pt-2">
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-primary/80"></div>
							<span class="text-[10px] text-muted-foreground/60">Συνολικά</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-emerald-500/60 dark:bg-emerald-400/60"></div>
							<span class="text-[10px] text-muted-foreground/60">Ολοκληρωμένα</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-amber-500/50 dark:bg-amber-400/50"></div>
							<span class="text-[10px] text-muted-foreground/60">Εκκρεμή</span>
						</div>
					</div>
				{/if}
			</TabsContent>

			<!-- Bonus Tab -->
			<TabsContent value="trends" class="mt-4">
				{#if !bonuses}
					<!-- Loading state -->
					<div class="space-y-3">
						{#each Array(3) as _, i}
							<div
								class="h-16 animate-pulse rounded-lg bg-muted/20"
								style="animation-delay: {i * 100}ms;"
							></div>
						{/each}
					</div>
				{:else if !bonuses.hasBonuses}
					<!-- No bonuses -->
					<div
						class="flex h-40 flex-col items-center justify-center rounded-lg border border-border/30 bg-muted/20 text-center"
					>
						<Award class="mb-2 h-8 w-8 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground/70">Δεν υπάρχουν bonus ακόμα</p>
						<p class="text-xs text-muted-foreground/50">Τα bonus θα εμφανιστούν όταν δημοσιευτούν</p>
					</div>
				{:else}
					<!-- Total Earned Header -->
					<div
						class="mb-4 animate-fade-in-down rounded-lg border border-emerald-500/15 dark:border-emerald-400/15 bg-emerald-500/8 dark:bg-emerald-400/8 p-3 text-center"
						style="animation-delay: 100ms; animation-fill-mode: backwards;"
					>
						<p class="text-xs text-emerald-600/80 dark:text-emerald-400/80">Συνολικά Bonus</p>
						<p
							class="font-tailormade text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
						>
							{formatCurrency(bonuses.totalEarned)}
						</p>
					</div>

					<!-- Bonus History List -->
					<div class="max-h-[200px] space-y-2 overflow-y-auto pr-1">
						{#each bonuses.history as bonus, index}
							<div
								class="group animate-fade-in-down rounded-lg border border-border/30 bg-card/30 p-3 transition-all hover:bg-card/60"
								style="animation-delay: {(index + 2) * 100}ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15"
										>
											<Calendar class="h-4 w-4 text-primary" />
										</div>
										<div class="flex flex-col">
											<span class="font-tailormade text-sm font-medium text-foreground/90"
												>{bonus.year}</span
											>
											<span class="text-[10px] text-muted-foreground/60">
												{bonus.totalShifts} βάρδιες <span class="text-muted-foreground/40">•</span>
												{bonus.hoursWorked} ώρες
											</span>
										</div>
									</div>
									<div class="text-right">
										<p
											class="font-tailormade text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
										>
											{formatCurrency(bonus.bonusAmount)}
										</p>
										<p class="text-[10px] text-muted-foreground/60">
											{bonus.percentageShare.toFixed(1)}% μερίδιο
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</TabsContent>
		</Tabs>
	</div>
</Card>