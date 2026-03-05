<script lang="ts">
	import type { Beverage } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, ImageOff, Film } from 'lucide-svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import IngredientsList from './IngredientsList.svelte';
	import EditBeverageDialog from './EditBeverageDialog.svelte';
	import DeleteBeverageDialog from './DeleteBeverageDialog.svelte';
	import { tooglebeverage } from '../data.remote';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { toast } from 'svelte-sonner';
	import BeveragedVideo from './BeveragedVideo.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let {
		beverage,
		onUpdate
	}: {
		beverage: Beverage;
		onUpdate: () => Promise<void>;
	} = $props();

	let editingBeverage = $state(false);
	let deletingBeverage = $state(false);
	let accordionValue = $state<string[]>([]);
	let beveragePublic = $derived(beverage?.public ?? false);

	let videoCount = $derived((beverage.video_urls ?? []).length);

	let managingVideos = $state(false);

	function openEditDialog() {
		editingBeverage = true;
	}

	function openDeleteDialog() {
		deletingBeverage = true;
	}

	async function handleToggle(checked: boolean) {
		const result = await tooglebeverage({ id: beverage.id, public: checked });
		try {
			if (result?.success) {
				toast.success(result.message);
				await onUpdate();
			} else {
				toast.error(result?.message || 'Σφάλμα κάτα την ενημέρωση');
				beveragePublic = beverage?.public ?? false;
			}
		} catch (err) {
			toast.error('Σφάλμα κάτα την ενημέρωση');
			beveragePublic = beverage?.public ?? false;
		}
	}
</script>

<div
	class="group rounded-xl border border-border/50 bg-card shadow-sm
		   transition-all duration-300 hover:border-primary/30
		   hover:shadow-md dark:border-white/10"
>
	<!-- Card Header: ID, Name, Actions -->
	<div class="border-b border-border/50 p-4 dark:border-white/10">
		<div class="flex items-start justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<span class="flex-shrink-0 text-xs font-medium text-primary">#{beverage.id}</span>
				<h3 class="truncate text-base font-semibold text-foreground sm:text-lg">
					{beverage.name}
				</h3>
			</div>

			<div class="flex flex-shrink-0 items-center justify-center gap-1">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Switch checked={beveragePublic} onCheckedChange={handleToggle} />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Ενήμερωσε ορατότητα</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>

				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
								onclick={openEditDialog}
							>
								<Pencil class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Ενήμερωσε ρόφημα</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>

				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 cursor-pointer hover:bg-red-500/10 hover:text-red-500"
								onclick={openDeleteDialog}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Δίεγραψε ρόφημα</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
								onclick={() => (managingVideos = true)}
							>
								<Film class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Διαχείριση βίντεο</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
		</div>
	</div>

	<!-- Card Body: Image & Description -->
	<div class="p-4">
		<!-- Beverage Image -->
		{#if beverage.image_url}
			<div class="mb-3 overflow-hidden rounded-xl bg-muted">
				<img
					src={beverage.image_url}
					alt={beverage.name}
					class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			</div>
		{:else}
			<div
				class="mb-3 flex h-48 items-center justify-center rounded-xl
					   bg-muted text-muted-foreground"
			>
				<div class="flex flex-col items-center gap-2">
					<ImageOff class="h-8 w-8" />
					<span class="text-xs">No image</span>
				</div>
			</div>
		{/if}

		<!-- Description -->
		{#if beverage.description}
			<p class="mb-3 line-clamp-2 text-sm text-muted-foreground">
				{beverage.description}
			</p>
		{:else}
			<p class="mb-3 text-sm text-muted-foreground/60 italic">No description available</p>
		{/if}

		<!-- Execution Preview -->
		{#if beverage.execution}
			<div class="mb-3 rounded-lg bg-muted/50 p-3 dark:bg-muted/30">
				<p class="mb-1 text-xs font-medium text-foreground">Execution:</p>
				<p class="line-clamp-2 text-xs text-muted-foreground">
					{beverage.execution}
				</p>
			</div>
		{/if}

		<!-- Video Count Badge -->
		{#if videoCount > 0}
			<div class="mb-1 flex items-center gap-1.5">
				<div class="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary">
					<Film class="h-3 w-3" />
					<span class="text-[11px] font-medium">
						{videoCount} βίντεο
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Accordion: Ingredients -->
	<Accordion.Root
		type="multiple"
		bind:value={accordionValue}
		class="border-t border-border/50 dark:border-white/10"
	>
		<Accordion.Item value="ingredients" class="border-b-0">
			<Accordion.Trigger
				class="flex w-full items-center justify-between px-4 py-3 
					   text-sm font-medium text-foreground 
					   transition-colors hover:bg-muted/50"
			>
				<span>Υλικά</span>
			</Accordion.Trigger>
			<Accordion.Content class="px-4 pb-4">
				<IngredientsList beverageId={beverage.id} />
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

<Dialog.Root bind:open={managingVideos}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Film class="h-5 w-5 text-primary" />
				Διαχείριση Βίντεο
			</Dialog.Title>
			<Dialog.Description>
				Προσθέστε, επεξεργαστείτε ή διαγράψτε βίντεο για το ρόφημα.
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-2">
			<BeveragedVideo
				beverageId={beverage.id}
				videos={beverage.video_urls ?? []}
				{onUpdate}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>
<EditBeverageDialog bind:open={editingBeverage} {beverage} {onUpdate} />
<DeleteBeverageDialog bind:open={deletingBeverage} {beverage} {onUpdate} />