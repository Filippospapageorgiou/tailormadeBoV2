<script lang="ts">
	import { getEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Plus, X, ChevronDown, ChevronUp, BookOpen, User, CalendarDays } from 'lucide-svelte';

	const store = getEvaluationSectionsContext();

	let expanded = $state(false);
	let newItemLabel = $state('');
	let addingNew = $state(false);

	const section = $derived(store.groupedSections.find((g) => g.section === 'training')!);
	const training = $derived(store.baristaTraining);

	function handleAddItem() {
		if (!newItemLabel.trim()) return;
		store.addItem('training', newItemLabel.trim());
		newItemLabel = '';
		addingNew = false;
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<BookOpen class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">Εκπαίδευση που έγινε</h4>
				<p class="text-xs text-muted-foreground">
					{section.checkedCount}/{section.items.length} θέματα · score {section.totalScore}
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

			<!-- Training checklist items -->
			<div class="flex flex-col gap-1 overflow-hidden rounded-xl border border-border/60 bg-card/80">
				{#each section.items as item (item.id)}
					<div
						class="group/item flex items-start gap-3 border-b border-border/30 px-3 py-2.5 last:border-0 transition-colors hover:bg-muted/30"
					>
						<div class="pt-0.5">
							<Checkbox
								checked={item.checked}
								onCheckedChange={() => store.toggleChecked(item.id)}
							/>
						</div>

						<div class="flex min-w-0 flex-1 flex-col gap-1.5">
							<input
								class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
								value={item.item_label}
								disabled={!item.checked}
								oninput={(e) =>
									store.updateItem(item.id, { item_label: e.currentTarget.value })}
							/>

							{#if item.checked}
								<div class="flex items-center gap-2">
									<Slider
										class="flex-1"
										type="single"
										bind:value={
											() => item.score ?? 0,
											(v) => store.updateItem(item.id, { score: v })
										}
										max={5}
										step={1}
									/>
									<span class="w-4 text-center text-xs font-medium tabular-nums">
										{item.score ?? 0}
									</span>
								</div>

								<InputGroup.Root>
									<InputGroup.Input
										placeholder="Σημειώσεις..."
										value={item.notes ?? ''}
										oninput={(e) =>
											store.updateItem(item.id, { notes: e.currentTarget.value })}
										class="text-xs"
									/>
								</InputGroup.Root>
							{/if}
						</div>

						<button
							onclick={() => store.removeItem(item.id)}
							class="pt-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-destructive"
						>
							<X class="h-4 w-4" />
						</button>
					</div>
				{/each}

				<!-- Add new item -->
				<div class="px-3 py-2">
					{#if addingNew}
						<div class="flex items-center gap-2">
							<InputGroup.Root class="flex-1">
								<InputGroup.Input
									placeholder="Νέο θέμα εκπαίδευσης..."
									bind:value={newItemLabel}
									onkeydown={(e) => {
										if (e.key === 'Enter') handleAddItem();
										if (e.key === 'Escape') { addingNew = false; newItemLabel = ''; }
									}}
								/>
							</InputGroup.Root>
							<Button size="sm" onclick={handleAddItem} disabled={!newItemLabel.trim()}>
								Προσθήκη
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onclick={() => { addingNew = false; newItemLabel = ''; }}
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					{:else}
						<Button
							variant="ghost"
							size="sm"
							class="h-7 gap-1 text-xs"
							onclick={() => (addingNew = true)}
						>
							<Plus class="h-3.5 w-3.5" />
							Νέο θέμα
						</Button>
					{/if}
				</div>
			</div>

			<!-- Barista info card -->
			{#if training}
				<div class="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-3">
					<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Στοιχεία Barista
					</p>

					<!-- Barista name -->
					<InputGroup.Root>
						<InputGroup.Addon>
							<User class="h-3.5 w-3.5" />
						</InputGroup.Addon>
						<InputGroup.Input
							placeholder="Όνομα barista που εκπαιδεύτηκε..."
							value={training.barista_name ?? ''}
							oninput={(e) =>
								store.updateBaristaTraining({ barista_name: e.currentTarget.value })}
						/>
					</InputGroup.Root>

					<!-- Overall training score -->
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-28 shrink-0">Συνολικό Score</span>
						<Slider
							class="flex-1"
							type="single"
							bind:value={
								() => training.score ?? 0,
								(v) => store.updateBaristaTraining({ score: v })
							}
							max={5}
							step={1}
						/>
						<span class="w-4 text-center text-xs font-medium tabular-nums">
							{training.score ?? 0}
						</span>
					</div>

					<!-- Other training free text -->
					<InputGroup.Root>
						<InputGroup.Input
							placeholder="Άλλο θέμα εκπαίδευσης..."
							value={training.other_training ?? ''}
							oninput={(e) =>
								store.updateBaristaTraining({ other_training: e.currentTarget.value })}
							class="text-xs"
						/>
					</InputGroup.Root>

					<!-- Follow-up -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Checkbox
								checked={training.needs_followup}
								onCheckedChange={() => store.toggleFollowup()}
							/>
							<span class="text-sm">Χρειάζεται follow-up εκπαίδευση</span>
						</div>
					</div>

					<!-- Follow-up date — only visible when needs_followup is true -->
					{#if training.needs_followup}
						<InputGroup.Root>
							<InputGroup.Addon>
								<CalendarDays class="h-3.5 w-3.5" />
							</InputGroup.Addon>
							<InputGroup.Input
								type="date"
								value={training.followup_date ?? ''}
								oninput={(e) =>
									store.updateBaristaTraining({ followup_date: e.currentTarget.value })}
							/>
						</InputGroup.Root>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>