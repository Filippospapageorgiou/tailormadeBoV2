<script lang="ts">
	import { getReadsAnalytics } from '$lib/api/reads_analytics/data.remote';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import {
		ArrowLeft,
		Coffee,
		Newspaper,
		BookOpen,
		TrendingUp,
		TrendingDown,
		Crown,
		Medal,
		Award,
		Users,
		Building2,
		Sparkles,
		Clock,
		Flame,
		MoonStar
	} from 'lucide-svelte';

	type Cat = 'beverages' | 'blog' | 'manual';

	const TABS: { key: Cat; label: string; icon: any; accent: string; accentHex: string }[] = [
		{ key: 'beverages', label: 'Ροφήματα', icon: Coffee, accent: 'amber', accentHex: '#f59e0b' },
		{ key: 'blog', label: 'Blog', icon: Newspaper, accent: 'sky', accentHex: '#0ea5e9' },
		{ key: 'manual', label: 'Εγχειρίδια', icon: BookOpen, accent: 'emerald', accentHex: '#10b981' }
	];

	const urlTab = (page.url.searchParams.get('tab') as Cat) || 'beverages';
	let activeTab = $state<Cat>(
		TABS.some((t) => t.key === urlTab) ? urlTab : 'beverages'
	);

	let dataQuery = $derived(getReadsAnalytics({ category: activeTab }));
	let payload = $derived(dataQuery?.current);
	let loading = $derived(dataQuery?.loading);

	let currentTab = $derived(TABS.find((t) => t.key === activeTab)!);
	let accentColor = $derived(currentTab.accentHex);

	function changeTab(t: Cat) {
		activeTab = t;
		const u = new URL(page.url);
		u.searchParams.set('tab', t);
		goto(u.pathname + u.search, { replaceState: true, noScroll: true, keepFocus: true });
	}

	// ------ derived stats ------
	const totalReads = $derived(payload?.total_reads ?? 0);
	const activeReaders = $derived(payload?.active_readers ?? 0);
	const totalEmployees = $derived(payload?.total_employees ?? 0);
	const engagementPct = $derived(
		totalEmployees > 0 ? Math.round((activeReaders / totalEmployees) * 100) : 0
	);

	const byEmployee = $derived(payload?.by_employee ?? []);
	const byOrg = $derived(payload?.by_org ?? []);
	const silent = $derived(payload?.silent ?? []);
	const topContent = $derived(payload?.top_content ?? []);

	const top3 = $derived(byEmployee.slice(0, 3));
	const rest = $derived(byEmployee.slice(3));
	const maxOrgCount = $derived(byOrg[0]?.count ?? 1);

	// ------ helpers ------
	function initials(name: string) {
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('');
	}

	function relativeTime(iso: string) {
		const date = new Date(iso);
		if (isNaN(date.getTime())) return '—';
		const diffMs = Date.now() - date.getTime();
		const mins = Math.floor(diffMs / 60000);
		if (mins < 1) return 'μόλις τώρα';
		if (mins < 60) return `πριν ${mins} λεπτά`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `πριν ${hours} ώρες`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `πριν ${days} ημέρες`;
		return date.toLocaleDateString('el-GR');
	}

	function sparklinePath(values: number[], width = 80, height = 24) {
		if (!values.length) return '';
		const max = Math.max(...values, 1);
		const step = width / (values.length - 1 || 1);
		return values
			.map((v, i) => {
				const x = i * step;
				const y = height - (v / max) * height;
				return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}
</script>

<svelte:head>
	<title>Ανάλυση αναγνώσεων</title>
</svelte:head>

<div class="reading-room min-h-screen">
	<!-- Atmospheric gradient backdrop -->
	<div
		class="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
		style="background:
			radial-gradient(ellipse 800px 400px at 15% -5%, {accentColor}22, transparent 60%),
			radial-gradient(ellipse 600px 500px at 95% 20%, {accentColor}1a, transparent 65%),
			radial-gradient(ellipse 900px 400px at 50% 100%, {accentColor}14, transparent 70%);
			transition: background 600ms ease;"
	></div>

	<main class="container mx-auto max-w-6xl px-4 pt-6 pb-24 md:px-6">
		<!-- Back link -->
		<a
			href="/app/managment/organization_managment"
			class="group mb-8 inline-flex items-center gap-1.5 text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
		>
			<ArrowLeft class="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
			Πίσω στα στατιστικά
		</a>

		<!-- Masthead -->
		<header class="mb-12 grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
			<div>
				<p
					class="mb-2 text-[11px] tracking-[0.28em] text-muted-foreground uppercase"
					style="font-feature-settings: 'ss01';"
				>
					Reading Room · 7 ημέρες
				</p>
				<h1 class="reading-room-title text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]">
					<span class="italic">Ποιος</span> διαβάζει<br />
					<span class="reading-room-accent">πραγματικά</span><em
						class="ml-2 not-italic text-muted-foreground">;</em
					>
				</h1>
			</div>

			<!-- Engagement ring -->
			<div class="flex items-center gap-4 md:justify-end">
				<div class="relative h-24 w-24">
					<svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
						<circle
							cx="50"
							cy="50"
							r="44"
							fill="none"
							stroke="currentColor"
							stroke-opacity="0.1"
							stroke-width="5"
						/>
						<circle
							cx="50"
							cy="50"
							r="44"
							fill="none"
							stroke={accentColor}
							stroke-width="5"
							stroke-linecap="round"
							stroke-dasharray={`${(engagementPct / 100) * 276.46} 276.46`}
							class="transition-all duration-1000 ease-out"
						/>
					</svg>
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<span class="font-serif text-2xl leading-none tabular-nums">{engagementPct}%</span>
						<span class="mt-0.5 text-[9px] tracking-widest text-muted-foreground uppercase"
							>ενεργοί</span
						>
					</div>
				</div>
				<div class="text-xs leading-snug text-muted-foreground">
					<p class="font-medium text-foreground tabular-nums">
						{activeReaders}<span class="text-muted-foreground">/{totalEmployees}</span>
					</p>
					<p>εργαζόμενοι<br />διάβασαν<br />αυτή την εβδομάδα</p>
				</div>
			</div>
		</header>

		<!-- Category tabs -->
		<nav class="mb-10 border-b border-border/60">
			<ul class="flex items-end gap-0">
				{#each TABS as tab (tab.key)}
					{@const active = activeTab === tab.key}
					<li>
						<button
							onclick={() => changeTab(tab.key)}
							class="group relative -mb-px flex items-center gap-2 px-5 py-3 text-sm transition-colors"
							class:text-foreground={active}
							class:text-muted-foreground={!active}
						>
							<tab.icon class="h-4 w-4" />
							<span class="font-serif italic" class:font-medium={active}>{tab.label}</span>
							{#if active}
								<span
									class="absolute right-0 -bottom-px left-0 h-[2px]"
									style="background:{tab.accentHex};"
								></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</nav>

		{#if loading && !payload}
			<div class="animate-pulse space-y-8">
				<div class="h-40 rounded-2xl bg-muted/40"></div>
				<div class="h-64 rounded-2xl bg-muted/40"></div>
			</div>
		{:else}
			<!-- Hero numbers -->
			<section
				class="mb-16 grid grid-cols-1 items-end gap-8 md:grid-cols-[2fr_1fr_1fr] md:gap-12"
			>
				<div class="relative">
					<span
						class="font-serif text-[clamp(5rem,16vw,11rem)] leading-[0.85] font-light tabular-nums"
						style="color:{accentColor}; text-shadow: 0 2px 40px {accentColor}33;"
					>
						{totalReads.toLocaleString('el-GR')}
					</span>
					<p class="mt-2 font-serif text-lg italic text-muted-foreground">
						αναγνώσεις συνολικά
					</p>
				</div>
				<div class="space-y-1 border-l border-border/60 pl-6">
					<p class="text-[10px] tracking-widest text-muted-foreground uppercase">Μ.Ο. / ημέρα</p>
					<p class="font-serif text-4xl tabular-nums">{Math.round(totalReads / 7)}</p>
				</div>
				<div class="space-y-1 border-l border-border/60 pl-6">
					<p class="text-[10px] tracking-widest text-muted-foreground uppercase">Μ.Ο. / αναγνώστη</p>
					<p class="font-serif text-4xl tabular-nums">
						{activeReaders > 0 ? (totalReads / activeReaders).toFixed(1) : '0'}
					</p>
				</div>
			</section>

			<!-- PODIUM -->
			{#if top3.length > 0}
				<section class="mb-20">
					<header class="mb-10 flex items-baseline justify-between">
						<h2 class="font-serif text-3xl">
							<span class="italic">Η</span> αφρόκρεμα
						</h2>
						<span class="text-xs tracking-wider text-muted-foreground uppercase"
							>Top 3 αναγνώστες</span
						>
					</header>

					<div class="grid grid-cols-3 items-end gap-3 md:gap-8">
						{#each [1, 0, 2] as rankIdx, i (rankIdx)}
							{@const reader = top3[rankIdx]}
							{@const rank = rankIdx + 1}
							{@const isFirst = rank === 1}
							{@const ringColor =
								rank === 1 ? accentColor : rank === 2 ? '#cbd5e1' : '#d97706'}
							{#if reader}
								<div
									class="flex flex-col items-center text-center"
									class:order-2={rank === 1}
									class:order-1={rank === 2}
									class:order-3={rank === 3}
									style="animation-delay: {i * 120}ms"
								>
									<div
										class="podium-stage relative"
										style="transform: {isFirst
											? 'rotate(-2deg) translateY(-8px)'
											: 'none'};"
									>
										<div class="absolute inset-0 scale-110 rounded-full opacity-40 blur-2xl" style="background:{ringColor};"></div>
										<div
											class="relative rounded-full p-[3px]"
											style="background: conic-gradient(from 180deg, {ringColor}, {ringColor}88, {ringColor});"
										>
											<div class="rounded-full bg-background p-1">
												<Avatar.Root
													class="h-20 w-20 border-2 border-background md:h-28 md:w-28"
												>
													{#if reader.image_url}
														<Avatar.Image src={reader.image_url} alt={reader.full_name} />
													{/if}
													<Avatar.Fallback class="font-serif text-xl">
														{initials(reader.full_name)}
													</Avatar.Fallback>
												</Avatar.Root>
											</div>
										</div>

										<!-- Rank badge -->
										<div
											class="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-lg"
											style="background:{ringColor};"
										>
											{#if rank === 1}
												<Crown class="h-4 w-4 text-white" />
											{:else if rank === 2}
												<Medal class="h-4 w-4 text-white" />
											{:else}
												<Award class="h-4 w-4 text-white" />
											{/if}
										</div>
									</div>

									<p
										class="mt-5 line-clamp-1 font-serif text-base md:text-lg"
										class:font-medium={isFirst}
									>
										{reader.full_name}
									</p>
									{#if reader.store_name}
										<p class="text-[11px] tracking-wide text-muted-foreground">
											{reader.store_name}
										</p>
									{/if}
									<p
										class="mt-2 font-serif text-3xl tabular-nums md:text-4xl"
										style="color:{isFirst ? accentColor : 'inherit'};"
									>
										{reader.count}
									</p>
									<p class="text-[10px] tracking-widest text-muted-foreground uppercase">
										αναγνώσεις
									</p>
								</div>
							{:else}
								<div class="order-{i} opacity-40">
									<div class="mx-auto h-20 w-20 rounded-full border border-dashed border-border md:h-28 md:w-28"></div>
									<p class="mt-5 text-center text-xs text-muted-foreground">—</p>
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}

			<!-- LEADERBOARD + STORES -->
			<section class="mb-20 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
				<!-- Full leaderboard -->
				<div>
					<header class="mb-6 flex items-baseline justify-between">
						<h2 class="font-serif text-2xl">
							<Users class="mr-2 inline h-5 w-5 text-muted-foreground" />
							Όλοι οι αναγνώστες
						</h2>
						<span class="text-xs text-muted-foreground tabular-nums">
							{byEmployee.length} άτομα
						</span>
					</header>

					{#if byEmployee.length === 0}
						<Card.Root class="border-dashed p-8 text-center text-sm text-muted-foreground">
							Κανείς δεν διάβασε αυτή την εβδομάδα.
						</Card.Root>
					{:else}
						<div class="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
							<table class="w-full text-sm">
								<thead
									class="sticky top-0 border-b border-border/60 bg-muted/30 text-[10px] tracking-wider text-muted-foreground uppercase"
								>
									<tr>
										<th class="px-4 py-3 text-left w-10">#</th>
										<th class="px-4 py-3 text-left">Υπάλληλος</th>
										<th class="hidden px-4 py-3 text-left md:table-cell">Κατάστημα</th>
										<th class="px-4 py-3 text-right">Αναγν.</th>
										<th class="hidden px-4 py-3 text-left md:table-cell">Τελευταία</th>
										<th class="hidden px-4 py-3 text-right lg:table-cell">Τάση</th>
									</tr>
								</thead>
								<tbody>
									{#each byEmployee as r, i (r.user_id)}
										<tr
											class="group border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
										>
											<td class="px-4 py-3 font-serif text-muted-foreground tabular-nums">
												{i + 1}
											</td>
											<td class="px-4 py-3">
												<div class="flex items-center gap-3">
													<Avatar.Root class="h-8 w-8">
														{#if r.image_url}
															<Avatar.Image src={r.image_url} alt={r.full_name} />
														{/if}
														<Avatar.Fallback class="text-[10px]">
															{initials(r.full_name)}
														</Avatar.Fallback>
													</Avatar.Root>
													<span class="font-medium">{r.full_name}</span>
												</div>
											</td>
											<td class="hidden px-4 py-3 md:table-cell">
												{#if r.store_name}
													<Badge variant="outline" class="font-normal">
														{r.store_name}
													</Badge>
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</td>
											<td class="px-4 py-3 text-right">
												<span
													class="font-serif text-lg tabular-nums transition-colors group-hover:text-foreground"
													style="color:{accentColor};"
												>
													{r.count}
												</span>
											</td>
											<td
												class="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell"
											>
												<span class="inline-flex items-center gap-1">
													<Clock class="h-3 w-3" />
													{relativeTime(r.last_read)}
												</span>
											</td>
											<td class="hidden px-4 py-3 text-right lg:table-cell">
												<svg
													viewBox="0 0 80 24"
													class="inline-block h-6 w-20 overflow-visible opacity-60 transition-opacity group-hover:opacity-100"
												>
													<path
														d={sparklinePath(r.daily)}
														fill="none"
														stroke={accentColor}
														stroke-width="1.5"
														stroke-linecap="round"
														stroke-linejoin="round"
													/>
												</svg>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

				<!-- Store standings -->
				<div>
					<header class="mb-6 flex items-baseline justify-between">
						<h2 class="font-serif text-2xl">
							<Building2 class="mr-2 inline h-5 w-5 text-muted-foreground" />
							Κατατάξεις καταστημάτων
						</h2>
					</header>

					{#if byOrg.length === 0}
						<Card.Root class="border-dashed p-6 text-center text-sm text-muted-foreground">
							Χωρίς δεδομένα καταστημάτων.
						</Card.Root>
					{:else}
						<ul class="space-y-4">
							{#each byOrg as org, i (org.org_id)}
								{@const pct = (org.count / maxOrgCount) * 100}
								<li class="group" style="animation-delay: {i * 60}ms">
									<div class="mb-1.5 flex items-baseline justify-between gap-2">
										<span
											class="flex items-center gap-2 truncate text-sm"
										>
											<span class="font-serif text-muted-foreground tabular-nums">
												{String(i + 1).padStart(2, '0')}
											</span>
											<span class="truncate font-medium">{org.store_name}</span>
										</span>
										<span
											class="font-serif text-lg tabular-nums"
											style="color:{accentColor};"
										>
											{org.count}
										</span>
									</div>
									<div class="relative h-1.5 overflow-hidden rounded-full bg-muted/50">
										<div
											class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
											style="width:{pct}%; background:linear-gradient(90deg, {accentColor}, {accentColor}cc);"
										></div>
									</div>
									<p class="mt-1 text-[10px] text-muted-foreground tabular-nums">
										{org.reader_count} αναγνώστ{org.reader_count === 1 ? 'ης' : 'ες'}
									</p>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>

			<!-- TOP CONTENT -->
			{#if topContent.length > 0}
				<section class="mb-20">
					<header class="mb-6 flex items-baseline justify-between">
						<h2 class="font-serif text-2xl">
							<Flame class="mr-2 inline h-5 w-5 text-muted-foreground" />
							<span class="italic">Τι</span> διαβάζουν περισσότερο
						</h2>
						<span class="text-xs tracking-wider text-muted-foreground uppercase"
							>Top {topContent.length}</span
						>
					</header>

					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						{#each topContent as item, i (item.id)}
							<div
								class="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
							>
								<div class="relative aspect-[4/3] overflow-hidden bg-muted">
									{#if item.image_url}
										<img
											src={item.image_url}
											alt={item.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center text-muted-foreground">
											<Sparkles class="h-6 w-6" />
										</div>
									{/if}
									<div
										class="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 font-serif text-xs tabular-nums backdrop-blur-sm"
									>
										#{i + 1}
									</div>
									<div
										class="absolute right-2 bottom-2 rounded-md px-2 py-1 font-serif text-lg font-medium tabular-nums text-white shadow-md"
										style="background:{accentColor}ee;"
									>
										{item.count}
									</div>
								</div>
								<div class="space-y-1 p-3">
									<p class="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
									<p class="text-[10px] tracking-wide text-muted-foreground">
										{item.unique_readers} μοναδικ{item.unique_readers === 1 ? 'ός' : 'οί'}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- SILENT EMPLOYEES -->
			{#if silent.length > 0}
				<section class="mb-20">
					<header class="mb-6 flex items-baseline justify-between">
						<h2 class="font-serif text-2xl text-muted-foreground">
							<MoonStar class="mr-2 inline h-5 w-5" />
							<span class="italic">Όσοι</span> δεν διάβασαν
						</h2>
						<span class="text-xs text-muted-foreground tabular-nums">
							{silent.length} άτομα
						</span>
					</header>

					<div
						class="rounded-xl border border-dashed border-border/60 bg-card/30 p-5 backdrop-blur-sm"
					>
						<div class="flex flex-wrap gap-3">
							{#each silent as s (s.user_id)}
								<div
									class="group flex items-center gap-2 rounded-full bg-muted/40 py-1 pr-3 pl-1 transition-colors hover:bg-muted"
								>
									<Avatar.Root class="h-7 w-7 opacity-70 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
										{#if s.image_url}
											<Avatar.Image src={s.image_url} alt={s.full_name} />
										{/if}
										<Avatar.Fallback class="text-[10px]">{initials(s.full_name)}</Avatar.Fallback>
									</Avatar.Root>
									<span class="text-xs font-medium">{s.full_name}</span>
									{#if s.store_name}
										<span class="text-[10px] text-muted-foreground">· {s.store_name}</span>
									{/if}
								</div>
							{/each}
						</div>
						<p class="mt-4 font-serif text-sm italic text-muted-foreground">
							Μια φιλική υπενθύμιση μπορεί να κάνει θαύματα.
						</p>
					</div>
				</section>
			{/if}
		{/if}
	</main>
</div>

<style>
	.reading-room {
		background:
			linear-gradient(180deg, transparent, var(--background));
	}

	.reading-room-title {
		font-family: 'Fraunces', 'Sansation', serif;
		font-weight: 300;
		letter-spacing: -0.02em;
		font-variation-settings: 'SOFT' 30, 'WONK' 1, 'opsz' 144;
	}

	.reading-room-accent {
		font-style: italic;
		font-weight: 500;
		background: linear-gradient(
			100deg,
			var(--foreground) 0%,
			var(--foreground) 60%,
			var(--muted-foreground) 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	:global(.reading-room .font-serif) {
		font-family: 'Fraunces', 'Sansation', serif;
		font-variation-settings: 'opsz' 48;
	}

	.podium-stage {
		animation: rise 700ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(24px);
		}
		to {
			opacity: 1;
		}
	}
</style>
