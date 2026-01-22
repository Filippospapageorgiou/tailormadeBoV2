<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Calculator, Trash, Eye, EyeOff, RefreshCw, Pen } from 'lucide-svelte';
	import {
		deleteBonusPeriod,
		recalculateBonuses,
		publishBonusPeriod,
		unpublishBonusPeriod
	} from '$lib/api/bonus_managment/data.remote';
	import { toast } from 'svelte-sonner';
	import DeleteConfirmDialog from '$lib/components/Reusable/DeleteConfirmDialog.svelte';
	import type { BonusPeriod } from '$lib/models/bonus_organization.types';
	import { goto } from '$app/navigation';

	let {
		bonusPeriod,
		onRefresh
	}: {
		bonusPeriod: BonusPeriod;
		onRefresh?: () => Promise<void>;
	} = $props();

	// Loading states
	let isRecalculating = $state(false);
	let isToggling = $state(false);
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	// Derived values
	const isPublished = $derived(bonusPeriod.status === 'published');
	const periodLabel = $derived(`Q${bonusPeriod.quarter} ${bonusPeriod.year}`);

	// Handle recalculate
	async function handleRecalculate() {
		if (isRecalculating) return;

		isRecalculating = true;
		try {
			const result = await recalculateBonuses({ periodId: bonusPeriod.id });
			if (result.success) {
				toast.success(result.message, {
					description: result.summary
						? `${result.summary.successfulOrgs}/${result.summary.totalOrgs} οργανισμοί επιτυχώς`
						: undefined
				});
				await onRefresh?.();
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά τον επανυπολογισμό', {
				description: error?.message || 'Παρακαλώ δοκιμάστε ξανά'
			});
		} finally {
			isRecalculating = false;
		}
	}

	// Handle publish/unpublish toggle
	async function handleTogglePublish() {
		if (isToggling) return;

		const newStatus = isPublished ? 'draft' : 'published';
		isToggling = true;

		try {
			const result =
				newStatus === 'published'
					? await publishBonusPeriod({ periodId: bonusPeriod.id })
					: await unpublishBonusPeriod({ periodId: bonusPeriod.id });

			if (result.success) {
				toast.success(result.message);
				await onRefresh?.();
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά την αλλαγή κατάστασης', {
				description: error?.message || 'Παρακαλώ δοκιμάστε ξανά'
			});
		} finally {
			isToggling = false;
		}
	}

	// Delete handlers
	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	async function handleDeleteSubmit() {
		isDeleting = true;
		try {
			const result = await deleteBonusPeriod({ periodId: bonusPeriod.id });
			if (result.success) {
				toast.success(result.message);
				deleteDialogOpen = false;
				await onRefresh?.();
			} else {
				toast.error(result.message);
			}
		} catch (error: any) {
			toast.error('Σφάλμα κατά τη διαγραφή', {
				description: error?.message || 'Παρακαλώ δοκιμάστε ξανά'
			});
		} finally {
			isDeleting = false;
		}
	}

	function cancelDelete() {
		deleteDialogOpen = false;
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="relative size-8 p-0 text-muted-foreground hover:text-foreground"
			>
				<span class="sr-only">Open menu</span>
				<EllipsisIcon class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-52">
		<DropdownMenu.Group>
			<DropdownMenu.Label class="text-xs text-muted-foreground">
				{periodLabel}
			</DropdownMenu.Label>
		</DropdownMenu.Group>

		<DropdownMenu.Separator />
		<!-- Publish/Unpublish Toggle -->
		<DropdownMenu.Item
			onclick={()=>{goto(`bonus_managment/${bonusPeriod.id}`)}}
			class="flex cursor-pointer items-center gap-2"
		>
			<Pen class="size-4" />
			<span>View</span>
		</DropdownMenu.Item>

		<!-- Publish/Unpublish Toggle -->
		<DropdownMenu.Item
			onclick={handleTogglePublish}
			disabled={isToggling}
			class="flex cursor-pointer items-center gap-2"
		>
			{#if isToggling}
				<RefreshCw class="size-4 animate-spin-clockwise text-muted-foreground repeat-infinite" />
				<span class="text-muted-foreground">Αλλαγή...</span>
			{:else if isPublished}
				<EyeOff class="size-4" />
				<span>Απόσυρση (Draft)</span>
			{:else}
				<Eye class="size-4" />
				<span>Δημοσίευση</span>
			{/if}
		</DropdownMenu.Item>

		<!-- Recalculate -->
		<DropdownMenu.Item
			onclick={handleRecalculate}
			disabled={isRecalculating}
			class="flex cursor-pointer items-center gap-2"
		>
			{#if isRecalculating}
				<RefreshCw class="size-4 animate-spin-clockwise text-muted-foreground repeat-infinite" />
				<span class="text-muted-foreground">Υπολογισμός...</span>
			{:else}
				<Calculator class="size-4" />
				<span>Επανυπολογισμός</span>
			{/if}
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<!-- Delete -->
		<DropdownMenu.Item
			onclick={handleDeleteClick}
			disabled={isPublished}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
		>
			<Trash class="h-4 w-4 text-destructive" />
			<span class="text-destructive">Διαγραφή</span>
		</DropdownMenu.Item>

		{#if isPublished}
			<div class="px-2 py-1.5 text-xs text-muted-foreground">Αποσύρετε πρώτα για διαγραφή</div>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteConfirmDialog
	bind:open={deleteDialogOpen}
	title="Διαγραφή Περιόδου Bonus"
	description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την περίοδο;"
	warningText="Αυτή η ενέργεια δεν μπορεί να αναιρεθεί"
	itemName={periodLabel}
	{isDeleting}
	onConfirm={handleDeleteSubmit}
	onCancel={cancelDelete}
>
	{#snippet children()}
		<div class="space-y-2">
			<p>
				Είστε σίγουροι ότι θέλετε να διαγράψετε την περίοδο bonus
				<span class="font-semibold text-foreground">{periodLabel}</span>;
			</p>
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				<p class="font-medium">Θα διαγραφούν επίσης:</p>
				<ul class="mt-1 list-inside list-disc space-y-0.5 text-xs">
					<li>Όλα τα δεδομένα οργανισμών</li>
					<li>Όλα τα employee payouts</li>
					<li>Το leaderboard cache</li>
				</ul>
			</div>
		</div>
	{/snippet}
</DeleteConfirmDialog>
