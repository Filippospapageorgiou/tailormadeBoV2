<script lang="ts">
	import { getEvaluationSectionsContext } from '$lib/stores/evaluationSections.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Plus, X, ChevronDown, ChevronUp, GraduationCap } from 'lucide-svelte';

	const store = getEvaluationSectionsContext();

	let expanded = $state(false);
	let newItemLabel = $state('');
	let addingNew = $state(false);

	const section = $derived(store.groupedSections.find((g) => g.section === 'knowledge')!);

	function handleAddItem() {
		if (!newItemLabel.trim()) return;
		store.addItem('knowledge', newItemLabel.trim());
		newItemLabel = '';
		addingNew = false;
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<!-- Section Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-primary/10 p-2">
				<GraduationCap class="h-4 w-4 text-primary" />
			</div>
			<div>
				<h4 class="text-lg font-semibold tracking-tight">Έλεγχος Γνώσεων Barista</h4>
				<p class="text-xs text-muted-foreground">
					{section.checkedCount}/{section.items.length} έλεγχοι · score {section.totalScore}
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
		<div class="flex flex-col gap-1 overflow-hidden rounded-xl border border-border/60 bg-card/80">
			{#each section.items as item (item.id)}
				<div
					class="group/item flex items-start gap-3 border-b border-border/30 px-3 py-2.5 last:border-0 transition-colors hover:bg-muted/30"
				>
					<!-- Checkbox -->
					<div class="pt-0.5">
						<Checkbox
							checked={item.checked}
							onCheckedChange={() => store.toggleChecked(item.id)}
						/>
					</div>

					<!-- Label + controls -->
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

					<!-- Remove -->
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
								placeholder="Νέος έλεγχος γνώσεων..."
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
						Νέος έλεγχος
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>