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
	let bonuses = $derived(data?.bonuses);

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
		if (todayTasks && !isLoaded) {
			isLoaded = true;
			const target = todayTasks.completionPercentage;
			const duration = 1500; // 1.5 seconds
			const startTime = performance.now();

			function animate(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function (ease-out-cubic)
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

	// Secondary rings based on tasks
	let completedRatio = $derived(
		todayTasks?.totalTasks ? todayTasks.completedTasks / todayTasks.totalTasks : 0
	);
	let pendingRatio = $derived(
		todayTasks?.totalTasks ? todayTasks.pendingTasks / todayTasks.totalTasks : 0
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
	class="relative h-full animate-fade-in-left overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-card/50 to-background"
>
	<!-- Ambient glow effect -->
	<div
		class="pointer-events-none absolute -top-20 right-0 h-48 w-48 animate-float rounded-full bg-emerald-500/10 blur-3xl"
		style="animation-delay: 1.5s;"
	></div>
	<div
		class="pointer-events-none absolute -bottom-20 left-0 h-40 w-40 animate-float rounded-full bg-blue-500/10 blur-3xl"
		style="animation-delay: 4s;"
	></div>

	<div class="relative flex h-full flex-col p-6">
		<!-- Header -->
		<div class="mb-4 space-y-1">
			<div class="flex items-center gap-2">
				<Activity class="h-4 w-4 text-primary" />
				<h3 class="font-semibold text-foreground">Insights</h3>
			</div>
			<p class="text-xs text-muted-foreground">Εργασίες & Bonus</p>
		</div>

		<!-- Tabs -->
		<Tabs value={activeTab} onValueChange={(v) => (activeTab = v)} class="w-full">
			<TabsList class="grid w-full grid-cols-2 bg-muted/50 p-1">
				<TabsTrigger value="performance" class="text-xs data-[state=active]:bg-background">
					<span class="flex items-center gap-1.5">
						<Target class="h-3 w-3" />
						Εργασίες
					</span>
				</TabsTrigger>
				<TabsTrigger value="trends" class="text-xs data-[state=active]:bg-background">
					<span class="flex items-center gap-1.5">
						<Award class="h-3 w-3" />
						Bonus
					</span>
				</TabsTrigger>
			</TabsList>

			<!-- Tasks Tab -->
			<TabsContent value="performance" class="mt-4 space-y-4">
				{#if !todayTasks}
					<!-- Loading state -->
					<div class="flex items-center gap-4">
						<div class="h-32 w-32 animate-pulse rounded-full bg-muted/30"></div>
						<div class="flex-1 space-y-3">
							<div class="h-14 animate-pulse rounded-lg bg-muted/30"></div>
							<div class="h-14 animate-pulse rounded-lg bg-muted/30"></div>
							<div class="h-14 animate-pulse rounded-lg bg-muted/30"></div>
						</div>
					</div>
				{:else if !todayTasks.hasTasks}
					<!-- No tasks today -->
					<div
						class="flex h-40 flex-col items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-center"
					>
						<CheckCircle2 class="mb-2 h-8 w-8 text-emerald-500/50" />
						<p class="text-sm text-muted-foreground">Δεν έχεις εργασίες σήμερα!</p>
						<p class="text-xs text-muted-foreground/70">Απόλαυσε τη μέρα σου 🎉</p>
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
									class="text-muted/20"
								/>
								<!-- Completed ring (green) -->
								<circle
									cx="60"
									cy="60"
									r="42"
									stroke="currentColor"
									stroke-width="6"
									fill="transparent"
									class="text-emerald-500/60 transition-all duration-1000 ease-out"
									stroke-dasharray={2 * Math.PI * 42}
									stroke-dashoffset={2 * Math.PI * 42 * (1 - completedRatio * (animatedPercentage / 100))}
									stroke-linecap="round"
								/>
								<!-- Pending ring (orange) -->
								<circle
									cx="60"
									cy="60"
									r="32"
									stroke="currentColor"
									stroke-width="6"
									fill="transparent"
									class="text-orange-500/40 transition-all duration-1000 ease-out"
									stroke-dasharray={2 * Math.PI * 32}
									stroke-dashoffset={2 * Math.PI * 32 * (1 - pendingRatio * (animatedPercentage / 100))}
									stroke-linecap="round"
								/>
								<!-- Primary progress ring -->
								<circle
									cx="60"
									cy="60"
									r={52}
									stroke="currentColor"
									stroke-width="8"
									fill="transparent"
									class="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)] transition-all duration-100"
									stroke-dasharray={mainProgress.circumference}
									stroke-dashoffset={mainProgress.offset}
									stroke-linecap="round"
								/>
							</svg>
							<!-- Center text with animation -->
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-2xl font-bold tabular-nums text-foreground">
									{animatedPercentage}%
								</span>
								<span class="text-[10px] text-muted-foreground">ολοκλήρωση</span>
							</div>
						</div>

						<!-- Tasks Metrics List -->
						<div class="flex-1 space-y-3">
							<!-- Total Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/40 bg-card/50 p-2.5 transition-colors hover:bg-card"
								style="animation-delay: 200ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10"
									>
										<Target class="h-3.5 w-3.5 text-blue-500" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-medium text-foreground">Σημερινές Εργασίες</span>
										<span class="text-[10px] text-muted-foreground">Συνολικά tasks</span>
									</div>
								</div>
								<span class="text-sm font-bold text-blue-500">{todayTasks.totalTasks}</span>
							</div>

							<!-- Completed Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/40 bg-card/50 p-2.5 transition-colors hover:bg-card"
								style="animation-delay: 300ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10"
									>
										<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-medium text-foreground">Ολοκληρωμένες</span>
										<span class="text-[10px] text-muted-foreground">Έτοιμα tasks</span>
									</div>
								</div>
								<span class="text-sm font-bold text-emerald-500">{todayTasks.completedTasks}</span>
							</div>

							<!-- Pending Tasks -->
							<div
								class="group flex animate-fade-in items-center justify-between rounded-lg border border-border/40 bg-card/50 p-2.5 transition-colors hover:bg-card"
								style="animation-delay: 400ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10"
									>
										<Hourglass class="h-3.5 w-3.5 text-orange-500" />
									</div>
									<div class="flex flex-col">
										<span class="text-xs font-medium text-foreground">Εκκρεμούν</span>
										<span class="text-[10px] text-muted-foreground">Απομένουν</span>
									</div>
								</div>
								<span class="text-sm font-bold text-orange-500">{todayTasks.pendingTasks}</span>
							</div>
						</div>
					</div>

					<!-- Ring Legend -->
					<div class="flex items-center justify-center gap-4 pt-2">
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-primary"></div>
							<span class="text-[10px] text-muted-foreground">Συνολικά</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-emerald-500/60"></div>
							<span class="text-[10px] text-muted-foreground">Ολοκληρωμένα</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 rounded-full bg-orange-500/40"></div>
							<span class="text-[10px] text-muted-foreground">Εκκρεμή</span>
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
								class="h-16 animate-pulse rounded-lg bg-muted/30"
								style="animation-delay: {i * 100}ms;"
							></div>
						{/each}
					</div>
				{:else if !bonuses.hasBonuses}
					<!-- No bonuses -->
					<div
						class="flex h-40 flex-col items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-center"
					>
						<Award class="mb-2 h-8 w-8 text-muted-foreground/50" />
						<p class="text-sm text-muted-foreground">Δεν υπάρχουν bonus ακόμα</p>
						<p class="text-xs text-muted-foreground/70">Τα bonus θα εμφανιστούν όταν δημοσιευτούν</p>
					</div>
				{:else}
					<!-- Total Earned Header -->
					<div
						class="mb-4 animate-fade-in-down rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center"
						style="animation-delay: 100ms; animation-fill-mode: backwards;"
					>
						<p class="text-xs text-emerald-600 dark:text-emerald-400">Συνολικά Bonus</p>
						<p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
							{formatCurrency(bonuses.totalEarned)}
						</p>
					</div>

					<!-- Bonus History List -->
					<div class="max-h-[200px] space-y-2 overflow-y-auto pr-1">
						{#each bonuses.history as bonus, index}
							<div
								class="group animate-fade-in-down rounded-lg border border-border/40 bg-card/50 p-3 transition-all hover:bg-card hover:shadow-sm"
								style="animation-delay: {(index + 2) * 100}ms; animation-fill-mode: backwards;"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"
										>
											<Calendar class="h-4 w-4 text-primary" />
										</div>
										<div class="flex flex-col">
											<span class="text-sm font-semibold text-foreground">{bonus.year}</span>
											<span class="text-[10px] text-muted-foreground">
												{bonus.totalShifts} βάρδιες • {bonus.hoursWorked} ώρες
											</span>
										</div>
									</div>
									<div class="text-right">
										<p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
											{formatCurrency(bonus.bonusAmount)}
										</p>
										<p class="text-[10px] text-muted-foreground">
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

<style>
	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(10px, -10px);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-in-down {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-float) {
		animation: float 8s ease-in-out infinite;
	}

	:global(.animate-fade-in) {
		animation: fade-in 0.5s ease-out;
	}

	:global(.animate-fade-in-down) {
		animation: fade-in-down 0.5s ease-out;
	}
</style>