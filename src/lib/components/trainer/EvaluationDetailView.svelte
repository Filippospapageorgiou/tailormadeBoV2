<script lang="ts">
	import {
		CheckCircle2,
		XCircle,
		Calendar,
		User,
		Users,
		Coffee,
		Wrench,
		Camera,
		FileText,
		AlertTriangle,
		ClipboardList,
		Star,
		MapPin,
		ChevronDown,
		ChevronUp,
		GraduationCap
	} from 'lucide-svelte';
	import { SECTION_META } from '$lib/models/evalution_section_const.types';
	import { PHOTO_CATEGORY_LABELS } from '$lib/models/trainers.types';
	import EvalRadarStatic from './EvalRadarStatic.svelte';
	import ImagePreviewModal from '../custom/ImagePreviewModal.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';

	let {
		evaluation,
		staffProfiles,
		photoItemsWithUrls
	}: {
		evaluation: any;
		staffProfiles: { id: string; full_name: string; image_url: string | null }[];
		photoItemsWithUrls: {
			category: string;
			url: string;
			description: string | null;
			storage_path: string;
		}[];
	} = $props();

	// ─── Derived ───────────────────────────────────────────────────────────────
	const org = $derived(evaluation?.core_organizations ?? null);
	const trainer = $derived(evaluation?.trainer ?? null);
	const sectionItems = $derived(evaluation?.evaluation_section_items ?? []);
	const baristaTraining = $derived((evaluation?.evaluation_barista_training ?? [])[0] ?? null);
	const equipmentEvals = $derived(evaluation?.equipment_evaluations ?? []);
	const summary = $derived((evaluation?.evaluation_summary_actions ?? [])[0] ?? null);
	const overallScore = $derived(summary?.score ?? evaluation?.overall_rating ?? null);

	// ─── Helpers ───────────────────────────────────────────────────────────────
	function getStaffName(id: string): string {
		return staffProfiles.find((p) => p.id === id)?.full_name ?? id;
	}

	function getStaffImage(id: string): string | null {
		return staffProfiles.find((p) => p.id === id)?.image_url ?? null;
	}

	function getInitials(name: string): string {
		return (
			name
				?.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2) ?? '?'
		);
	}

	function scoreColor(score: number | null): string {
		if (score === null || score === undefined) return 'text-muted-foreground';
		if (score >= 80) return 'text-emerald-500';
		if (score >= 60) return 'text-amber-500';
		return 'text-red-500';
	}

	function scoreBgBorder(score: number | null): string {
		if (score === null || score === undefined) return 'bg-muted/40 border-border/60';
		if (score >= 80)
			return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50';
		if (score >= 60)
			return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50';
		return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50';
	}

	const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
		draft: { label: 'Πρόχειρο', cls: 'bg-muted text-muted-foreground border border-border/50' },
		submitted: {
			label: 'Υποβλήθηκε',
			cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
		},
		reviewed: {
			label: 'Αξιολογήθηκε',
			cls: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
		},
		reopened: {
			label: 'Επαναλήφθηκε',
			cls: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
		}
	};

	function getSectionItems(section: string) {
		return sectionItems.filter((i: any) => i.section === section);
	}

	function getSectionScore(section: string): number {
		const items = getSectionItems(section).filter((i: any) => i.checked && i.score !== null);
		if (!items.length) return 0;
		const total = items.reduce((acc: number, i: any) => acc + (i.score ?? 0), 0);
		return Math.round((total / (items.length * 5)) * 100);
	}

	function formatDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('el-GR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	const statusCfg = $derived(STATUS_CONFIG[evaluation?.submit] ?? STATUS_CONFIG.draft);

	// ─── Radar chart data ─────────────────────────────────────────────────────
	const radarData = $derived.by(() => {
		function sectionScore(section: string): number {
			const items = sectionItems.filter(
				(i: any) => i.section === section && i.checked && i.score !== null
			);
			if (!items.length) return 0;
			const total = items.reduce((acc: number, i: any) => acc + (i.score ?? 0), 0);
			return Math.round((total / (items.length * 5)) * 100);
		}
		const eqScores = equipmentEvals
			.map((e: any) => e.score)
			.filter((s: any) => s !== null && s !== undefined) as number[];
		const eqAvg =
			eqScores.length > 0
				? Math.round(
						(eqScores.reduce((a: number, b: number) => a + b, 0) / eqScores.length / 5) * 100
					)
				: 0;
		return [
			{ category: 'Καθαριότητα', score: sectionScore('cleanliness') },
			{ category: 'Γνώσεις', score: sectionScore('knowledge') },
			{ category: 'Εκπαίδευση', score: sectionScore('training') },
			{ category: 'Εξοπλισμός', score: eqAvg },
			{ category: 'Τελικό', score: overallScore ?? 0 }
		];
	});

	// Equipment expand state
	let expandedEquipment = $state<Record<number, boolean>>({});
	function toggleEquipment(id: number) {
		expandedEquipment = { ...expandedEquipment, [id]: !expandedEquipment[id] };
	}

	let open = $state(false);
</script>

<!-- ─── Outer wrapper — callers can set max-width / padding ─────────────────── -->
<div class="space-y-4">
	<!-- ══════════════════════════════════════════════════════
	     HEADER CARD
	══════════════════════════════════════════════════════ -->
	<div class="rounded-xl border border-border/60 bg-card p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="space-y-1">
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusCfg.cls}"
					>
						{statusCfg.label}
					</span>
					{#if evaluation?.submitted_at}
						<span class="text-xs text-muted-foreground">
							Υποβολή: {formatDate(evaluation.submitted_at)}
						</span>
					{/if}
				</div>
				<h2 class="font-mono text-2xl tracking-wider md:text-3xl">
					{org?.store_name ?? '—'}
				</h2>
				{#if org?.location}
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<MapPin class="h-3.5 w-3.5" />
						{org.location}
					</div>
				{/if}
			</div>

			<!-- Overall score circle -->
			{#if overallScore !== null}
				<div class="flex shrink-0 flex-col items-center gap-1">
					<div class="relative flex h-20 w-20 items-center justify-center">
						<svg class="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
							<circle
								cx="18"
								cy="18"
								r="15.9"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="text-muted/20"
							/>
							<circle
								cx="18"
								cy="18"
								r="15.9"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-dasharray="{overallScore} {100 - overallScore}"
								stroke-linecap="round"
								class={scoreColor(overallScore)}
							/>
						</svg>
						<span class="font-mono text-xl font-bold {scoreColor(overallScore)}">
							{overallScore}
						</span>
					</div>
					<span class="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
						Συνολική
					</span>
				</div>
			{/if}
		</div>

		<!-- Meta row -->
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/40 pt-4">
			<div class="flex items-center gap-2 text-sm">
				<Calendar class="h-4 w-4 text-muted-foreground" />
				<span class="text-muted-foreground">Επίσκεψη:</span>
				<span class="font-medium">{formatDate(evaluation?.visit_date)}</span>
			</div>
			{#if trainer}
				<div class="flex items-center gap-2 text-sm">
					<User class="h-4 w-4 text-muted-foreground" />
					<span class="text-muted-foreground">Trainer:</span>
					<span class="font-medium">{trainer.full_name ?? trainer.username ?? '—'}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- ══════════════════════════════════════════════════════
	     2-COLUMN GRID
	══════════════════════════════════════════════════════ -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- ── LEFT COLUMN ─────────────────────────────────── -->
		<div class="space-y-4">
			<!-- ─ Staff Card ──────────────────────────────── -->
			<div class="rounded-xl border border-border/60 bg-card">
				<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3">
					<Users class="h-4 w-4 text-muted-foreground" />
					<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
						Παρόντες κατά την αξιολόγηση
					</span>
				</div>
				<div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
					<!-- Managers -->
					<div>
						<p class="mb-2 text-xs font-medium text-muted-foreground">Υπεύθυνος</p>
						{#if evaluation?.store_managers?.length > 0}
							<div class="space-y-2">
								{#each evaluation.store_managers as id}
									<div class="flex items-center gap-2">
										<div
											class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold"
										>
											{#if getStaffImage(id)}
												<img src={getStaffImage(id)} alt="" class="h-7 w-7 object-cover" />
											{:else}
												{getInitials(getStaffName(id))}
											{/if}
										</div>
										<span class="text-sm">{getStaffName(id)}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">—</p>
						{/if}
					</div>
					<!-- Baristas -->
					<div>
						<p class="mb-2 text-xs font-medium text-muted-foreground">Barista</p>
						{#if evaluation?.baristas_on_duty?.length > 0}
							<div class="space-y-2">
								{#each evaluation.baristas_on_duty as id}
									<div class="flex items-center gap-2">
										<div
											class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold"
										>
											{#if getStaffImage(id)}
												<img src={getStaffImage(id)} alt="" class="h-7 w-7 object-cover" />
											{:else}
												{getInitials(getStaffName(id))}
											{/if}
										</div>
										<span class="text-sm">{getStaffName(id)}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">—</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- ─ Checklist Sections (cleanliness / knowledge / training) ── -->
			{#each ['cleanliness', 'knowledge', 'training'] as section}
				{@const meta = SECTION_META[section as keyof typeof SECTION_META]}
				{@const items = getSectionItems(section)}
				{@const sectionScore = getSectionScore(section)}
				{#if items.length > 0}
					<div class="rounded-xl border border-border/60 bg-card">
						<div class="flex items-center justify-between border-b border-border/40 px-4 py-3">
							<div class="flex items-center gap-2">
								<ClipboardList class="h-4 w-4 text-muted-foreground" />
								<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
									{meta.label}
								</span>
							</div>
							{#if sectionScore > 0}
								<span
									class="rounded-full px-2 py-0.5 font-mono text-xs font-medium {scoreBgBorder(
										sectionScore
									)} border"
								>
									{sectionScore}%
								</span>
							{/if}
						</div>
						<div class="divide-y divide-border/30 px-4">
							{#each items as item}
								<div class="flex items-start gap-3 py-2.5 {!item.checked ? 'opacity-40' : ''}">
									{#if item.checked}
										<CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
									{:else}
										<XCircle class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
									{/if}
									<div class="min-w-0 flex-1">
										<span
											class="text-sm {!item.checked ? 'text-muted-foreground line-through' : ''}"
										>
											{item.item_label}
										</span>
										{#if item.notes}
											<p class="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>
										{/if}
									</div>
									{#if item.score !== null && item.checked}
										<span
											class="shrink-0 font-mono text-xs font-medium {scoreColor(
												(item.score / 5) * 100
											)}"
										>
											{item.score}/5
										</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}

			<!-- ─ Barista Training Card ───────────────────── -->
			{#if baristaTraining}
				<div class="rounded-xl border border-border/60 bg-card">
					<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3">
						<GraduationCap class="h-4 w-4 text-muted-foreground" />
						<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
							Εκπαίδευση Barista
						</span>
					</div>
					<div class="space-y-3 p-4">
						{#if baristaTraining.barista_name}
							<div class="flex items-center gap-2 text-sm">
								<Coffee class="h-4 w-4 text-muted-foreground" />
								<span class="text-muted-foreground">Barista:</span>
								<span class="font-medium">{baristaTraining.barista_name}</span>
							</div>
						{/if}
						{#if baristaTraining.score !== null}
							<div class="flex items-center gap-2 text-sm">
								<Star class="h-4 w-4 text-muted-foreground" />
								<span class="text-muted-foreground">Βαθμός:</span>
								<span class="font-mono font-medium {scoreColor((baristaTraining.score / 5) * 100)}">
									{baristaTraining.score}/5
								</span>
							</div>
						{/if}
						<div class="flex items-center gap-2 text-sm">
							<span class="text-muted-foreground">Follow-up:</span>
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium
								{baristaTraining.needs_followup
									? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
									: 'bg-muted text-muted-foreground'}"
							>
								{baristaTraining.needs_followup ? 'Απαιτείται' : 'Δεν απαιτείται'}
							</span>
						</div>
						{#if baristaTraining.needs_followup && baristaTraining.followup_date}
							<div class="text-sm">
								<span class="text-muted-foreground">Ημ/νία follow-up: </span>
								<span class="font-medium">{formatDate(baristaTraining.followup_date)}</span>
							</div>
						{/if}
						{#if baristaTraining.other_training}
							<div class="rounded-lg bg-muted/40 p-3 text-sm">
								<p class="mb-1 text-xs font-medium text-muted-foreground">Άλλη εκπαίδευση</p>
								<p>{baristaTraining.other_training}</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
			{#if photoItemsWithUrls.length > 0}
				<Collapsible.Root class="rounded-xl border border-border/60 bg-card">
					<Collapsible.Trigger
						class="flex w-full items-center justify-between border-b border-border/40 px-4 py-3 transition-colors hover:bg-muted/30 data-[state=closed]:border-b-0"
					>
						<div class="flex items-center gap-2">
							<Camera class="h-4 w-4 text-muted-foreground" />
							<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
								Φωτογραφίες
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
							>
								{photoItemsWithUrls.length}
							</span>
							<ChevronDown
								class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180"
							/>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
							{#each photoItemsWithUrls as photo}
								<a
									href={photo.url}
									target="_blank"
									rel="noopener noreferrer"
									class="group relative overflow-hidden rounded-lg border border-border/40 bg-muted/30"
								>
									<div class="aspect-square">
										<img
											src={photo.url}
											alt={PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category}
											class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
											loading="lazy"
										/>
									</div>
									<div
										class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2"
									>
										<p class="truncate text-[10px] font-medium text-white">
											{PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category}
										</p>
										{#if photo.description}
											<p class="truncate text-[9px] text-white/70">{photo.description}</p>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}
		</div>

		<!-- ── RIGHT COLUMN ────────────────────────────────── -->
		<div class="space-y-4">
			<!-- ─ Radar Chart ─────────────────────────────── -->
			<EvalRadarStatic chartData={radarData} finalScore={overallScore} />

			<!-- ─ Equipment Cards ─────────────────────────── -->
			{#if equipmentEvals.length > 0}
				<div class="rounded-xl border border-border/60 bg-card">
					<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3">
						<Wrench class="h-4 w-4 text-muted-foreground" />
						<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
							Αξιολόγηση Εξοπλισμού
						</span>
					</div>
					<div class="divide-y divide-border/30">
						{#each equipmentEvals as eq}
							{@const checkItems = eq.equipment_check_items ?? []}
							{@const equipScore = eq.score !== null ? Math.round((eq.score / 5) * 100) : null}
							<div>
								<!-- Equipment header row -->
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									onclick={() => toggleEquipment(eq.id)}
									class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
								>
									<!-- Equipment image thumbnail -->
									{#if eq.equipment?.image_url}
										<ImagePreviewModal bind:open imageUrl={eq.equipment.image_url} />
										<button
											type="button"
											onclick={() => (open = true)}
											class="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted/30"
										>
											<img
												src={eq.equipment.image_url}
												alt={eq.equipment.name}
												class="h-full w-full object-cover"
												loading="lazy"
											/>
										</button>
									{:else}
										<div
											class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/30"
										>
											<Wrench class="h-4 w-4 text-muted-foreground/50" />
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">
												{eq.equipment?.name ?? `Εξοπλισμός #${eq.equipment_id ?? eq.id}`}
											</span>
											{#if eq.equipment?.model}
												<span class="text-xs text-muted-foreground">({eq.equipment.model})</span>
											{/if}
										</div>
									</div>
									{#if equipScore !== null}
										<span
											class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-xs font-medium {scoreBgBorder(
												equipScore
											)}"
										>
											{equipScore}%
										</span>
									{/if}
									{#if checkItems.length > 0}
										{#if expandedEquipment[eq.id]}
											<ChevronUp class="h-4 w-4 shrink-0 text-muted-foreground" />
										{:else}
											<ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
										{/if}
									{/if}
								</div>

								<!-- Check items (expandable) -->
								{#if expandedEquipment[eq.id] && checkItems.length > 0}
									<div class="border-t border-border/30 bg-muted/20 px-4 pt-2 pb-3">
										{#if eq.notes}
											<p class="mb-2 text-xs text-muted-foreground italic">{eq.notes}</p>
										{/if}
										<div class="space-y-1.5">
											{#each checkItems as ci}
												<div class="flex items-start gap-2.5">
													{#if ci.passed === true}
														<CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
													{:else if ci.passed === false}
														<XCircle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
													{:else}
														<div
															class="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-border/60"
														></div>
													{/if}
													<div class="min-w-0 flex-1">
														<span class="text-xs">{ci.check_name}</span>
														{#if ci.value_numeric !== null}
															<span class="ml-1 font-mono text-xs text-muted-foreground"
																>({ci.value_numeric})</span
															>
														{/if}
														{#if ci.notes}
															<p class="text-xs text-muted-foreground">{ci.notes}</p>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- ─ Final Summary ───────────────────────────── -->
			{#if summary}
				<div class="rounded-xl border border-border/60 bg-card">
					<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3">
						<FileText class="h-4 w-4 text-muted-foreground" />
						<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
							Τελική Αξιολόγηση
						</span>
					</div>
					<div class="space-y-4 p-4">
						<!-- Score -->
						<div class="flex items-center gap-4">
							<div class="relative flex h-16 w-16 shrink-0 items-center justify-center">
								<svg class="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
									<circle
										cx="18"
										cy="18"
										r="15.9"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										class="text-muted/20"
									/>
									<circle
										cx="18"
										cy="18"
										r="15.9"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-dasharray="{summary.score} {100 - summary.score}"
										stroke-linecap="round"
										class={scoreColor(summary.score)}
									/>
								</svg>
								<span class="font-mono text-lg font-bold {scoreColor(summary.score)}">
									{summary.score}
								</span>
							</div>
							{#if summary.comments}
								<p class="text-sm leading-relaxed text-muted-foreground">{summary.comments}</p>
							{/if}
						</div>

						<!-- Action points -->
						{#if summary.sections?.length > 0}
							<div>
								<p
									class="mb-2 flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground uppercase"
								>
									<AlertTriangle class="h-3.5 w-3.5" />
									Σημεία Δράσης
								</p>
								<div class="space-y-2">
									{#each [...summary.sections].sort((a: any, b: any) => a.priority - b.priority) as action, i}
										<div class="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
											<span
												class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary"
											>
												{action.priority ?? i + 1}
											</span>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium">{action.label}</p>
												{#if action.description}
													<p class="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
