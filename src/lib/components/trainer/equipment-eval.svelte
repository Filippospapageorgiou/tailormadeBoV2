<script lang="ts">
	import type { Equipment } from '$lib/models/equipment.types';
	import { getEquipmentEvalContext } from '$lib/stores/equipment-eval.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		Plus,
		X,
		Trash2,
		ChevronDown,
		ChevronUp,
		Search,
		Package,
		StickyNote,
		Hash
	} from 'lucide-svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let { equipments }: { equipments: Equipment[] } = $props();

	const store = getEquipmentEvalContext();

	// Sheet / UI state
	let sheetOpen = $state(false);
	let searchQuery = $state('');
	let expandedIds = $state(new Set<number>());

	// Equipment not yet added to the evaluation
	const availableEquipment = $derived(
		equipments
			.filter((eq) => !store.equipments.some((e) => e.equipment_id === eq.id))
			.filter((eq) =>
				searchQuery
					? eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						eq.model?.toLowerCase().includes(searchQuery.toLowerCase())
					: true
			)
	);

	// ─── Handlers ────────────────────────────────────────────────────────────

	function toggleExpanded(id: number) {
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}
		// Trigger reactivity
		expandedIds = new Set(expandedIds);
	}

	function handleAddEquipment(eq: Equipment) {
		// Create a temporary local ID (negative) until saved to DB
		const tempId = -Date.now();
		store.addEvaluation({
			id: tempId,
			evaluation_id: 0, // set by parent when submitting
			equipment_id: eq.id,
			score: null,
			notes: null,
			created_at: null
		});
		expandedIds = new Set([...expandedIds, tempId]);
		sheetOpen = false;
		searchQuery = '';
	}

	function handleAddCheckItem(evalId: number) {
		const tempId = -Date.now();
		store.addCheckItem(evalId, {
			id: tempId,
			equipment_eval_id: evalId,
			check_name: '',
			value_text: null,
			value_numeric: null,
			passed: null,
			notes: null,
			created_at: null
		});
	}

	function handleRemoveCheckItem(evalId: number, itemId: number) {
		store.removeCheckItem(evalId, itemId);
	}

	function handleRemoveEvaluation(evalId: number) {
		store.removeEvaluation(evalId);
		expandedIds.delete(evalId);
		expandedIds = new Set(expandedIds);
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<Package class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">Αξιολόγηση Εξοπλισμού</h4>
				<p class="text-xs text-muted-foreground">
					{store.totalEquipments} εξοπλισμοί · μέσο score {store.averageScore.toFixed(1)}
				</p>
			</div>
		</div>
		<Button variant="outline" size="sm" class="gap-1.5" onclick={() => (sheetOpen = true)}>
			<Plus class="h-4 w-4" />
			Προσθήκη
		</Button>
	</div>

	<!-- Equipment Blocks -->
	{#if store.equipments.length === 0}
		<Spinner />
	{:else}
		<div class="flex flex-col gap-3">
			{#each store.equipments as evaluation (evaluation.id)}
				{@const eq = equipments.find((e) => e.id === evaluation.equipment_id)}
				{@const isExpanded = expandedIds.has(evaluation.id)}
				{@const checkItems = evaluation.equipment_check_items}

				<div
					class="overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm transition-all"
				>
					<!-- Block Header -->
					<button
						onclick={() => toggleExpanded(evaluation.id)}
						class="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
					>
						<!-- Equipment Image -->
						{#if eq?.image_url}
							<img
								src={eq.image_url}
								alt={eq.name}
								class="h-10 w-10 rounded-lg border border-border/40 object-cover"
							/>
						{:else}
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted"
							>
								<Package class="h-5 w-5 text-muted-foreground" />
							</div>
						{/if}

						<!-- Equipment Info -->
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-semibold">{eq?.name ?? 'Άγνωστος'}</p>
							<p class="truncate text-xs text-muted-foreground">{eq?.model ?? ''}</p>
						</div>

						<!-- Stats -->
						<div class="flex items-center gap-2">
							{#if checkItems.length > 0}
								{@const passedCount = checkItems.filter((i) => i.passed === true).length}
								<Badge
									variant={passedCount === checkItems.length ? 'default' : 'secondary'}
									class="text-xs"
								>
									{passedCount}/{checkItems.length}
								</Badge>
							{/if}
							{#if evaluation.score !== null}
								<Badge variant="outline" class="text-xs">{evaluation.score}/5</Badge>
							{/if}
							{#if isExpanded}
								<ChevronUp class="h-4 w-4 text-muted-foreground" />
							{:else}
								<ChevronDown class="h-4 w-4 text-muted-foreground" />
							{/if}
						</div>
					</button>

					<!-- Expanded Content -->
					{#if isExpanded}
						<div class="border-t border-border/40">
							<!-- Overall Score for this equipment -->
							<div class="flex items-center gap-3 px-3 pt-3">
								<span class="w-24 shrink-0 text-xs text-muted-foreground">Συνολικό Score</span>
								<Slider
									class="flex-1"
									type="single"
									bind:value={
										() => store.getScore(evaluation.id), (v) => store.setScore(evaluation.id, v)
									}
									max={5}
									step={1}
								/>
								<span class="w-4 text-center text-xs font-medium">{evaluation.score ?? 0}</span>
							</div>

							<!-- Overall Notes -->
							<div class="px-3 pt-2 pb-1">
								<InputGroup.Root>
									<InputGroup.Input
										placeholder="Γενικές σημειώσεις εξοπλισμού..."
										value={evaluation.notes ?? ''}
										oninput={(e) =>
											store.updateEvaluation(evaluation.id, {
												notes: e.currentTarget.value
											})}
										class="text-xs"
									/>
									<InputGroup.Addon>
										<StickyNote class="h-3.5 w-3.5" />
									</InputGroup.Addon>
								</InputGroup.Root>
							</div>

							<!-- Check Items -->
							<div class="flex flex-col gap-0.5 p-2">
								{#each checkItems as item (item.id)}
									<div
										class="group/item flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40"
									>
										<div class="flex min-w-0 flex-1 flex-col gap-1.5">
											<!-- check_name + value_numeric -->
											<div class="flex gap-2">
												<InputGroup.Root class="flex-1">
													<InputGroup.Input
														placeholder="Τι ελέγχεις..."
														value={item.check_name}
														oninput={(e) =>
															store.updateCheckItem(evaluation.id, item.id, {
																check_name: e.currentTarget.value
															})}
													/>
													<InputGroup.Addon>
														<StickyNote class="h-3.5 w-3.5" />
													</InputGroup.Addon>
												</InputGroup.Root>

												<InputGroup.Root class="w-28">
													<InputGroup.Input
														type="number"
														placeholder="Τιμή"
														value={item.value_numeric ?? ''}
														oninput={(e) =>
															store.updateCheckItem(evaluation.id, item.id, {
																value_numeric: e.currentTarget.value
																	? Number(e.currentTarget.value)
																	: null
															})}
													/>
													<InputGroup.Addon>
														<Hash class="h-3.5 w-3.5" />
													</InputGroup.Addon>
												</InputGroup.Root>
											</div>

											<!-- Notes -->
											<InputGroup.Root>
												<InputGroup.Input
													placeholder="Σημειώσεις..."
													value={item.notes ?? ''}
													oninput={(e) =>
														store.updateCheckItem(evaluation.id, item.id, {
															notes: e.currentTarget.value
														})}
													class="text-xs"
												/>
											</InputGroup.Root>

											<!-- Passed toggle -->
											<div class="flex items-center gap-2">
												<button
													onclick={() => store.toggleCheckItem(evaluation.id, item.id)}
													class="rounded-full border px-2 py-0.5 text-xs transition-colors {item.passed ===
													true
														? 'border-green-500/40 bg-green-500/10 text-green-600'
														: item.passed === false
															? 'border-red-500/40 bg-red-500/10 text-red-600'
															: 'border-border/50 text-muted-foreground'}"
												>
													{item.passed === true
														? '✓ Πέρασε'
														: item.passed === false
															? '✗ Απέτυχε'
															: '— Εκκρεμεί'}
												</button>
											</div>
										</div>

										<!-- Delete item -->
										<button
											onclick={() => handleRemoveCheckItem(evaluation.id, item.id)}
											class="pt-1.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-destructive"
										>
											<X class="h-4 w-4" />
										</button>
									</div>
								{/each}
							</div>

							<!-- Block Footer -->
							<div class="flex items-center justify-between border-t border-border/40 px-3 py-2">
								<Button
									variant="ghost"
									size="sm"
									class="h-7 gap-1 text-xs"
									onclick={() => handleAddCheckItem(evaluation.id)}
								>
									<Plus class="h-3.5 w-3.5" />
									Νέος έλεγχος
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
									onclick={() => handleRemoveEvaluation(evaluation.id)}
								>
									<Trash2 class="h-3.5 w-3.5" />
									Αφαίρεση
								</Button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Equipment Picker Sheet -->
<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="left" class="flex w-full flex-col sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title>Επιλογή Εξοπλισμού</Sheet.Title>
			<Sheet.Description>
				Διάλεξε εξοπλισμό για αξιολόγηση ({availableEquipment.length} διαθέσιμα)
			</Sheet.Description>
		</Sheet.Header>

		<!-- Search -->
		<div class="px-1 pt-2">
			<InputGroup.Root>
				<InputGroup.Input placeholder="Αναζήτηση εξοπλισμού..." bind:value={searchQuery} />
				<InputGroup.Addon>
					<Search class="h-4 w-4" />
				</InputGroup.Addon>
			</InputGroup.Root>
		</div>

		<!-- Equipment List -->
		<div class="flex-1 overflow-y-auto py-3">
			{#if availableEquipment.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
					<Package class="h-8 w-8" />
					<p class="text-sm">
						{searchQuery ? 'Δεν βρέθηκε εξοπλισμός' : 'Όλος ο εξοπλισμός έχει προστεθεί'}
					</p>
				</div>
			{:else}
				<div class="flex flex-col gap-2 px-1">
					{#each availableEquipment as eq (eq.id)}
						<button
							onclick={() => handleAddEquipment(eq)}
							class="group flex items-center gap-3 rounded-xl border border-border/50 p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
						>
							{#if eq.image_url}
								<img
									src={eq.image_url}
									alt={eq.name}
									class="h-14 w-14 rounded-lg border border-border/40 object-cover transition-transform group-hover:scale-105"
								/>
							{:else}
								<div
									class="flex h-14 w-14 items-center justify-center rounded-lg border border-border/40 bg-muted"
								>
									<Package class="h-6 w-6 text-muted-foreground" />
								</div>
							{/if}

							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold">{eq.name}</p>
								{#if eq.model}
									<p class="truncate text-xs text-muted-foreground">{eq.model}</p>
								{/if}
								<div class="mt-1 flex items-center gap-1.5">
									<span
										class="inline-block h-1.5 w-1.5 rounded-full {eq.status === 'operational'
											? 'bg-green-500'
											: eq.status === 'maintenance'
												? 'bg-yellow-500'
												: 'bg-red-500'}"
									></span>
									<span class="text-[10px] text-muted-foreground capitalize">{eq.status}</span>
								</div>
							</div>

							<div
								class="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground"
							>
								<Plus class="h-4 w-4" />
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
