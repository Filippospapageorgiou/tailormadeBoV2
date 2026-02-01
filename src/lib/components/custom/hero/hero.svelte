<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Clock, MapPin, RefreshCw, CloudOff } from 'lucide-svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { getWeatherContext } from '$lib/stores/weather.svelte';
	import InsightCard from './InsightCard.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		TrendingUp,
		TrendingDown,
		TrendingUpDown,
		Users,
		FolderKanban,
		CheckCircle2,
		Zap
	} from 'lucide-svelte';
	import { getAllStatsForCards } from '$lib/api/stats/data.remote';
	import { toast } from 'svelte-sonner';

	let profile = getProfileContext();
	let weather = getWeatherContext();

	let stats = getAllStatsForCards();

	$effect(() => {
		if (!stats.current?.success) {
			toast.error(stats.current?.message || 'Σφάλμα κάτα την ανάκτηση δεδομένων');
		}
	});

	let statsData = $derived(stats.current?.data);
	let currentTime = $state(new Date());
	let timeInterval: ReturnType<typeof setInterval>;
	let weatherInterval: ReturnType<typeof setInterval>;

	// Greek formatting
	const dateFormatter = new Intl.DateTimeFormat('el-GR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	const timeFormatter = new Intl.DateTimeFormat('el-GR', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	// Derived values
	let timeString = $derived(timeFormatter.format(currentTime));
	let currentDate = $derived(dateFormatter.format(currentTime));
	let hour = $derived(currentTime.getHours());

	// Weather state from store
	let weatherData = $derived(weather.state.data);
	let weatherLoading = $derived(weather.state.loading);
	let weatherError = $derived(weather.state.error);

	// Greek greetings based on time
	let greeting = $derived(
		hour < 12 ? 'Καλημέρα' : hour < 17 ? 'Καλό απόγευμα' : hour < 21 ? 'Καλησπέρα' : 'Καληνύχτα'
	);

	let message = $derived(
		hour < 12
			? 'Έτοιμος για μια παραγωγική μέρα! 🚀'
			: hour < 17
				? 'Συνέχισε τη δυναμική! ⚡'
				: hour < 21
					? 'Ολοκληρώνεις μια υπέροχη μέρα! ✨'
					: 'Ακόμα στο πόστο σου! 🌙'
	);

	// Weather icon component based on weather code
	function getWeatherIconClass(code: number): string {
		// Return appropriate styling based on weather code
		if (code === 0 || code === 1)
			return 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]';
		if (code === 2 || code === 3) return 'text-gray-400';
		if (code >= 45 && code <= 48) return 'text-gray-500';
		if (code >= 51 && code <= 67) return 'text-blue-400';
		if (code >= 71 && code <= 77) return 'text-blue-200';
		if (code >= 80 && code <= 82) return 'text-blue-500';
		if (code >= 85 && code <= 86) return 'text-blue-300';
		if (code >= 95) return 'text-purple-500';
		return 'text-yellow-500';
	}

	async function refreshWeather() {
		await weather.refresh();
	}

	onMount(() => {
		// Start clock
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		// Fetch initial weather
		weather.getWeather();

		// Refresh weather every 15 minutes
		weatherInterval = setInterval(
			() => {
				weather.getWeather();
			},
			15 * 60 * 1000
		);
	});

	onDestroy(() => {
		clearInterval(timeInterval);
		clearInterval(weatherInterval);
	});
</script>

<div
	style="animation-delay: 200ms; animation-fill-mode: backwards;"
	class="col-span-full animate-fade-in-down space-y-6"
>
	<!-- Responsive Grid: 1 col mobile, 2 cols tablet, 5 cols desktop -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
		<!-- Hero Card: Full width mobile/tablet, 3 cols desktop, spans 2 rows -->
		<div class="col-span-1 order-1 md:col-span-2 lg:col-span-3 lg:row-span-2">
			<Card.Root
				class="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-card/50 to-background"
			>
				<!-- Ambient glow effects -->
				<div
					class="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 animate-float rounded-full bg-blue-500/10 blur-3xl"
				></div>
				<div
					class="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 animate-float rounded-full bg-primary/10 blur-3xl"
					style="animation-delay: 3s;"
				></div>

				<div
					class="relative flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8"
				>
					<!-- Left: Greeting & Time -->
					<div class="space-y-4">
						<div class="space-y-1">
							<h2
								class="animate-fade-in text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
								style="animation-delay: 100ms; animation-fill-mode: backwards;"
							>
								{greeting},
								<span class="text-primary">{profile.full_name?.split(' ')[0] || 'Χρήστη'}</span> 👋
							</h2>
							<p
								class="animate-fade-in text-base text-muted-foreground sm:text-lg"
								style="animation-delay: 200ms; animation-fill-mode: backwards;"
							>
								{message}
							</p>
						</div>

						<!-- Time Display -->
						<div
							class="flex animate-fade-in items-center gap-3 pt-2"
							style="animation-delay: 300ms; animation-fill-mode: backwards;"
						>
							<div class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10">
								<Clock class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
							</div>
							<div>
								<time
									class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground tabular-nums"
								>
									{timeString}
								</time>
							</div>
						</div>
					</div>

					<!-- Right: Weather Widget -->
					<div
						class="flex animate-fade-in flex-col items-start gap-4 sm:items-end sm:text-right"
						style="animation-delay: 400ms; animation-fill-mode: backwards;"
					>
						{#if weatherLoading && !weatherData}
							<!-- Loading state -->
							<div class="space-y-2 w-full sm:text-right">
								<div class="flex items-center justify-start sm:justify-end gap-2">
									<div class="h-10 w-24 animate-pulse rounded-lg bg-muted"></div>
								</div>
								<div class="h-4 w-20 animate-pulse rounded bg-muted sm:ml-auto"></div>
								<div class="h-3 w-28 animate-pulse rounded bg-muted sm:ml-auto"></div>
							</div>
						{:else if weatherError && !weatherData}
							<!-- Error state -->
							<div class="space-y-1 w-full sm:text-right">
								<div class="flex items-center justify-start sm:justify-end gap-2">
									<CloudOff class="h-8 w-8 text-muted-foreground" />
									<span class="text-lg text-muted-foreground">--°C</span>
								</div>
								<p class="text-xs text-muted-foreground">Δεν ήταν δυνατή η φόρτωση</p>
								<button
									onclick={refreshWeather}
									class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
								>
									<RefreshCw class="h-3 w-3" />
									Επανάληψη
								</button>
							</div>
						{:else if weatherData}
							<!-- Weather data -->
							<div class="space-y-1 w-full">
								<div class="flex items-center justify-start sm:justify-end gap-2 sm:flex-col sm:items-end sm:gap-0">
									<div class="flex items-center gap-2 text-2xl sm:text-3xl md:text-5xl font-bold">
										<span
											class={`text-3xl sm:text-4xl ${getWeatherIconClass(weatherData.weatherCode)}`}
										>
											{weatherData.icon}
										</span>
										<span>{weatherData.temperature}°C</span>
									</div>
									<p class="text-sm font-medium text-muted-foreground">
										{weatherData.description}
									</p>
								</div>

								<div class="flex items-center justify-start sm:justify-end gap-1.5 text-xs text-muted-foreground">
									<MapPin class="h-3 w-3" />
									<span>{weatherData.location?.city || 'Τοποθεσία'}</span>
								</div>

								<div
									class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground/70 justify-start sm:justify-end"
								>
									<span>Αίσθηση: {weatherData.feelsLike}°C</span>
									<span class="hidden sm:inline">•</span>
									<span>Υγρασία: {weatherData.humidity}%</span>
								</div>

								<p class="text-xs text-muted-foreground/80 capitalize text-left sm:text-right">{currentDate}</p>

								{#if weatherData.cached}
									<p class="text-[10px] text-muted-foreground/50 text-left sm:text-right">
										Cache: {weatherData.cacheAge}s ago
									</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</Card.Root>
		</div>
		
		<!-- InsightCard: Full width mobile/tablet, 2 cols desktop right side, spans 3 rows -->
		<div class="col-span-1 order-2 md:col-span-2 lg:col-span-2 lg:col-start-4 lg:row-span-3">
			<InsightCard />
		</div>
		
		<!-- Card 1: Shifts - Full width mobile, auto tablet, specific pos desktop -->
		<div class="col-span-1 order-3 lg:row-start-3">
			<Card.Root
				class="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-background via-card/50 to-background h-full"
			>
				<!-- Ambient glow -->
				<div
					class="pointer-events-none absolute -top-10 -right-10 h-32 w-32 animate-float rounded-full bg-emerald-500/10 blur-2xl"
					style="animation-delay: 0s;"
				></div>
				<div
					class="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 animate-float rounded-full bg-primary/10 blur-2xl"
					style="animation-delay: 2s;"
				></div>

				<Card.Header class="relative pb-2">
					<div class="flex items-center justify-between">
						<Card.Title class="text-sm font-medium text-muted-foreground"
							>Βάρδιες Εβδομάδας</Card.Title
						>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
							<CheckCircle2 class="h-4 w-4 text-emerald-500" />
						</div>
					</div>
					<Card.Description class="text-xs">Τελευταίες 7 ημέρες</Card.Description>
				</Card.Header>
				<Card.Content class="relative space-y-3">
					{#if !statsData}
						<div class="space-y-2">
							<div class="h-8 w-24 animate-pulse repeat-infinite rounded-lg bg-muted"></div>
							<div class="h-3 w-20 animate-pulse repeat-infinite rounded bg-muted"></div>
							<div class="h-1.5 w-full rounded-full bg-muted"></div>
						</div>
					{:else}
						<div class="flex items-baseline gap-2 flex-wrap">
							<span class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								{statsData.userShifts.totalHours}
							</span>
							<span class="text-sm font-medium text-muted-foreground">ώρες</span>
							{#if statsData.userShifts.totalHours > 35}
								<span
									class="ml-auto flex items-center gap-0.5 text-xs font-medium text-emerald-500"
								>
									<TrendingUp class="h-3 w-3" />
									{((statsData.userShifts.totalHours / 40) * 100).toFixed(0)}%
								</span>
							{:else if statsData.userShifts.totalHours < 20}
								<span class="ml-auto flex items-center gap-0.5 text-xs font-medium text-orange-500">
									<TrendingDown class="h-3 w-3" />
									Χαμηλά
								</span>
							{:else}
								<span class="ml-auto flex items-center gap-0.5 text-xs font-medium text-blue-500">
									<TrendingUpDown class="h-3 w-3" />
									Κανονικά
								</span>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground">
							{statsData.userShifts.totalShifts} βάρδιες • ~{statsData.userShifts.shifts.length > 0
								? (statsData.userShifts.totalHours / statsData.userShifts.totalShifts).toFixed(1)
								: '0'} ώρες/βάρδια
						</p>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
								style="width: {Math.min((statsData.userShifts.totalHours / 40) * 100, 100)}%"
							></div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Card 2: Employees -->
		<div class="col-span-1 order-4 lg:row-start-3">
			<Card.Root
				class="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-background via-card/50 to-background h-full"
			>
				<!-- Ambient glow -->
				<div
					class="pointer-events-none absolute -top-10 -right-10 h-32 w-32 animate-float rounded-full bg-blue-500/10 blur-2xl"
					style="animation-delay: 1s;"
				></div>
				<div
					class="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 animate-float rounded-full bg-primary/10 blur-2xl"
					style="animation-delay: 3s;"
				></div>

				<Card.Header class="relative pb-2">
					<div class="flex items-center justify-between">
						<Card.Title class="text-sm font-medium text-muted-foreground">Προσωπικό</Card.Title>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
							<Users class="h-4 w-4 text-blue-500" />
						</div>
					</div>
					<Card.Description class="text-xs">Μέλη ομάδας</Card.Description>
				</Card.Header>
				<Card.Content class="relative space-y-3">
					{#if !statsData}
						<div class="space-y-2">
							<div class="h-8 w-20 animate-pulse repeat-infinite rounded-lg bg-muted"></div>
							<div class="h-6 w-32 animate-pulse repeat-infinite rounded bg-muted"></div>
						</div>
					{:else}
						<div class="flex items-baseline gap-2">
							<span class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								{statsData.employees.total}
							</span>
						</div>

						<div class="flex -space-x-2 pt-1 overflow-hidden">
							{#each statsData.employees.list.slice(0, 4) as employee (employee.id)}
								{#if employee.image_url}
									<img
										src={employee.image_url}
										alt={employee.full_name}
										class="h-7 w-7 rounded-full object-cover ring-2 ring-background dark:bg-white"
										title="{employee.full_name} • {employee.role}"
									/>
								{:else}
									<div
										class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium ring-2 ring-background"
										title="{employee.full_name} • {employee.role}"
									>
										{employee.full_name
											.split(' ')
											.map((n) => n[0])
											.join('')
											.substring(0, 2)
											.toUpperCase()}
									</div>
								{/if}
							{/each}
							{#if statsData.employees.total > 4}
								<div
									class="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background"
								>
									+{statsData.employees.total - 4}
								</div>
							{/if}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Card 3: Equipment -->
		<div class="col-span-1 order-5 lg:row-start-3">
			<Card.Root
				class="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-background via-card/50 to-background h-full"
			>
				<!-- Ambient glow -->
				<div
					class="pointer-events-none absolute -top-10 -right-10 h-32 w-32 animate-float rounded-full bg-orange-500/10 blur-2xl"
					style="animation-delay: 2s;"
				></div>
				<div
					class="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 animate-float rounded-full bg-primary/10 blur-2xl"
					style="animation-delay: 4s;"
				></div>

				<Card.Header class="relative pb-2">
					<div class="flex items-center justify-between">
						<Card.Title class="text-sm font-medium text-muted-foreground">Εξοπλισμός</Card.Title>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
							<Zap class="h-4 w-4 text-orange-500" />
						</div>
					</div>
					<Card.Description class="text-xs">Κατάσταση μηχανημάτων</Card.Description>
				</Card.Header>
				<Card.Content class="relative space-y-3">
					{#if !statsData}
						<div class="space-y-2">
							<div class="h-8 w-24 animate-pulse repeat-infinite  rounded-lg bg-muted"></div>
							<div class="h-3 w-32 animate-pulse repeat-infinite  rounded bg-muted"></div>
							<div class="grid grid-cols-4 gap-1">
								{#each [1, 2, 3, 4] as _}
									<div class="h-1.5 animate-pulse repeat-infinite  rounded-full bg-muted"></div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="flex items-baseline gap-2 flex-wrap">
							<span class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								{statsData.equipment.operational}
							</span>
							<span class="text-sm font-medium text-muted-foreground"
								>/ {statsData.equipment.total}</span
							>
							<span
								class="ml-auto text-xs font-medium {statsData.equipment.broken > 0
									? 'text-red-500'
									: 'text-emerald-500'}"
							>
								{statsData.equipment.broken > 0
									? `${statsData.equipment.broken} χαλασμένα`
									: 'Όλα καλά'}
							</span>
						</div>

						<div class="grid grid-cols-4 gap-1 pt-1">
							{#each Array(4) as _, i}
								{@const percentage =
									statsData.equipment.total > 0
										? statsData.equipment.operational / statsData.equipment.total
										: 0}
								<div
									class="h-1.5 rounded-full transition-all duration-500 {i <
									Math.ceil(percentage * 4)
										? 'bg-emerald-500'
										: 'bg-muted'}"
								></div>
							{/each}
						</div>

						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span>{statsData.equipment.maintenance} σε συντήρηση</span>
							<span>{statsData.equipment.broken} εκτός λειτουργίας</span>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
