<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Plus,
		X,
		ChevronDown,
		ChevronUp,
		ClipboardList,
		GripVertical,
		AlertTriangle,
		ArrowUp,
		Minus
	} from 'lucide-svelte';
	import type { EvaluationSummaryActions, SectionItem } from '$lib/models/trainers.types';

	let {
		evalFinal = $bindable()
	}: {
		evalFinal: EvaluationSummaryActions | undefined;
	} = $props();

	let expanded = $state(true);
	let addingNew = $state(false);
	let newItem = $state<Partial<SectionItem>>({ label: '', description: '', priority: 2 });

	const priorityConfig = {
		1: { label: 'Υψηλή', icon: ArrowUp, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
		2: { label: 'Μέση', icon: Minus, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
		3: { label: 'Χαμηλή', icon: ChevronDown, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' }
	} as const;

	function ensureState() {
		if (!evalFinal) {
			evalFinal = {
				id: 0,
				evalution_id: 0,
				score: 0,
				comments: '',
				sections: [],
				created_at: '',
				updated_at: ''
			};
		}
	}

	function updateField<K extends keyof EvaluationSummaryActions>(
		key: K,
		value: EvaluationSummaryActions[K]
	) {
		ensureState();
		evalFinal = { ...evalFinal!, [key]: value };
	}

	function addSection() {
		if (!newItem.label?.trim()) return;
		ensureState();
		const section: SectionItem = {
			label: newItem.label.trim(),
			description: newItem.description?.trim() ?? '',
			priority: newItem.priority ?? 2
		};
		evalFinal = { ...evalFinal!, sections: [...(evalFinal?.sections ?? []), section] };
		newItem = { label: '', description: '', priority: 2 };
		addingNew = false;
	}

	function removeSection(index: number) {
		if (!evalFinal) return;
		evalFinal = {
			...evalFinal,
			sections: evalFinal.sections.filter((_, i) => i !== index)
		};
	}

	function updateSection(index: number, patch: Partial<SectionItem>) {
		if (!evalFinal) return;
		evalFinal = {
			...evalFinal,
			sections: evalFinal.sections.map((s, i) => (i === index ? { ...s, ...patch } : s))
		};
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<ClipboardList class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">Σύνοψη & Ενέργειες</h4>
				<p class="text-xs text-muted-foreground">
					Συνολικό score · {evalFinal?.sections?.length ?? 0} σημεία δράσης
				</p>
			</div>
		</div>
		<button
			onclick={() => (expanded = !expanded)}
			class="text-muted-foreground transition-colors hover:text-foreground"
		>
			{#if expanded}
				<ChevronUp class="h-4 w-4" />
			{:else}
				<ChevronDown class="h-4 w-4" />
			{/if}
		</button>
	</div>

	{#if expanded}
		<div class="flex flex-col gap-3">

			<!-- Score + Comments card -->
			<div class="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-3">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Αξιολόγηση
				</p>

				<!-- Overall score -->
				<div class="flex items-center gap-3">
					<span class="w-28 shrink-0 text-xs text-muted-foreground">Συνολικό Score</span>
					<Slider
						class="flex-1"
						type="single"
						bind:value={
							() => evalFinal?.score ?? 0,
							(v) => updateField('score', v)
						}
						max={100}
						step={1}
					/>
					<span class="w-8 text-center text-sm font-semibold tabular-nums text-primary">
						{evalFinal?.score ?? 0}
					</span>
				</div>

				<!-- Score visual bar -->
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-300 {(evalFinal?.score ?? 0) >= 80
							? 'bg-emerald-500'
							: (evalFinal?.score ?? 0) >= 60
								? 'bg-amber-500'
								: 'bg-red-500'}"
						style="width: {evalFinal?.score ?? 0}%"
					></div>
				</div>

				<!-- Comments -->
				<div class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Σχόλια / Παρατηρήσεις</span>
					<Textarea
						placeholder="Γενικά σχόλια για την αξιολόγηση..."
						value={evalFinal?.comments ?? ''}
						oninput={(e) => updateField('comments', e.currentTarget.value)}
						class="min-h-[80px] resize-none text-sm"
					/>
				</div>
			</div>

			<!-- Action sections -->
			<div class="flex flex-col gap-1 overflow-hidden rounded-xl border border-border/60 bg-card/80">
				<div class="flex items-center justify-between border-b border-border/40 px-3 py-2">
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Σημεία Δράσης
					</p>
					{#if (evalFinal?.sections?.length ?? 0) > 0}
						<Badge variant="secondary" class="text-xs">
							{evalFinal?.sections?.length}
						</Badge>
					{/if}
				</div>

				{#if !evalFinal?.sections?.length && !addingNew}
					<button
						onclick={() => (addingNew = true)}
						class="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground transition-colors hover:text-primary"
					>
						<AlertTriangle class="h-5 w-5" />
						<p class="text-xs">Δεν υπάρχουν σημεία δράσης</p>
						<p class="text-xs text-muted-foreground/60">Πάτα για προσθήκη</p>
					</button>
				{:else}
					{#each evalFinal?.sections ?? [] as section, i (i)}
						{@const pCfg = priorityConfig[section.priority as 1 | 2 | 3] ?? priorityConfig[2]}
						<div
							class="group/item flex items-start gap-2 border-b border-border/30 px-3 py-2.5 last:border-0 transition-colors hover:bg-muted/30"
						>
							<GripVertical class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />

							<div class="flex min-w-0 flex-1 flex-col gap-1.5">
								<!-- Label row -->
								<div class="flex items-center gap-2">
									<input
										class="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
										value={section.label}
										placeholder="Τίτλος ενέργειας..."
										oninput={(e) => updateSection(i, { label: e.currentTarget.value })}
									/>
									<!-- Priority picker -->
									<div class="flex items-center gap-1">
										{#each [1, 2, 3] as p}
											{@const cfg = priorityConfig[p as 1 | 2 | 3]}
											<button
												onclick={() => updateSection(i, { priority: p })}
												class="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors {section.priority === p
													? cfg.bg + ' ' + cfg.color
													: 'border-border/40 text-muted-foreground hover:border-border'}"
											>
												{cfg.label}
											</button>
										{/each}
									</div>
								</div>

								<!-- Description -->
								<input
									class="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60"
									value={section.description}
									placeholder="Περιγραφή / λεπτομέρειες..."
									oninput={(e) => updateSection(i, { description: e.currentTarget.value })}
								/>
							</div>

							<button
								onclick={() => removeSection(i)}
								class="mt-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-destructive"
							>
								<X class="h-4 w-4" />
							</button>
						</div>
					{/each}
				{/if}

				<!-- Add new section row -->
				<div class="px-3 py-2">
					{#if addingNew}
						<div class="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
							<InputGroup.Root>
								<InputGroup.Input
									placeholder="Τίτλος ενέργειας..."
									bind:value={newItem.label}
									onkeydown={(e) => {
										if (e.key === 'Enter') addSection();
										if (e.key === 'Escape') { addingNew = false; newItem = { label: '', description: '', priority: 2 }; }
									}}
								/>
							</InputGroup.Root>

							<InputGroup.Root>
								<InputGroup.Input
									placeholder="Περιγραφή (προαιρετικό)..."
									bind:value={newItem.description}
									class="text-xs"
								/>
							</InputGroup.Root>

							<!-- Priority select -->
							<div class="flex items-center gap-1.5">
								<span class="text-xs text-muted-foreground">Προτεραιότητα:</span>
								{#each [1, 2, 3] as p}
									{@const cfg = priorityConfig[p as 1 | 2 | 3]}
									<button
										onclick={() => (newItem.priority = p)}
										class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors {newItem.priority === p
											? cfg.bg + ' ' + cfg.color
											: 'border-border/40 text-muted-foreground hover:border-border'}"
									>
										{cfg.label}
									</button>
								{/each}
							</div>

							<div class="flex items-center gap-2">
								<Button size="sm" onclick={addSection} disabled={!newItem.label?.trim()} class="flex-1">
									Προσθήκη
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => { addingNew = false; newItem = { label: '', description: '', priority: 2 }; }}
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						</div>
					{:else}
						<Button
							variant="ghost"
							size="sm"
							class="h-7 gap-1 text-xs"
							onclick={() => (addingNew = true)}
						>
							<Plus class="h-3.5 w-3.5" />
							Νέο σημείο δράσης
						</Button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>