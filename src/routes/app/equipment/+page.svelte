<script lang="ts">
	import EquipmentCard from '$lib/components/custom/equipments/EquipmentCard.svelte';
	import { addDays, subDays } from 'date-fns';
	import type { Equipment, EquipmentStatus } from '$lib/models/equipment.types';
	import { getAllEquipments } from './data.remote';
	import * as Select from '$lib/components/ui/select';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { RefreshCw } from 'lucide-svelte';

	let query = getAllEquipments();

	let equipmentStatus = ['operational', 'broken', 'maintenance'];

	let equipmentList = $derived(query?.current?.equipments || []);
	let total = $derived(query?.current?.total);

	let value = $state('');
	const triggerContent = $derived(equipmentStatus.find((c) => c === value) ?? 'select a category');

	let searchQuery = $state('');

	let filterEquipments = $derived.by(() => {
		let equipments = equipmentList;
		if (value) {
			equipments = equipments.filter((i) => i.status === value);
		}

		if (searchQuery) {
			equipments = equipments.filter(
				(equipments) =>
					equipments.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
					(equipments.model &&
						equipments.model.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
			);
		}

		return equipments;
	});

	let refreshAction = $state(false);
	async function refresh() {
		refreshAction = true;
		await query.refresh();
		refreshAction = false;
	}
</script>

<div class="min-h-screen bg-white">
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<div class="mb-4">
			<h1 class="font-mono text-4xl tracking-wider text-neutral-800">Κατάσταση εξοπλισμού</h1>
			<p class="text-sm text-[#8B6B4A]">
				Επισκόπηση των μηχανημάτων του καταστήματος και των προγραμμάτων συντήρησης.
			</p>
			<div class="flex items-center gap-2">
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Διαθέσιμα εξοπλισμοί: <span class="font-semibold">{equipmentList?.length ?? 0}</span>
					/ {total}
				</p>
			</div>
		</div>
		<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<!-- Category Select -->
			<Select.Root type="single" name="filterCategory" bind:value>
				<Select.Trigger class="w-full sm:w-[180px]">
					{triggerContent}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Categories</Select.Label>
						{#each equipmentStatus as status}
							<Select.Item value={status ?? ''}>
								{status}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
			<div class="gpa-2 flex flex-row items-center space-x-2">
				<!-- Search Input -->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger
							><Button
								variant="secondary"
								size="sm"
								onclick={refresh}
								disabled={refreshAction}
								class="h-6 cursor-pointer px-2 text-xs"
							>
								<RefreshCw
									class={`mr-2 h-4 w-4 ${refreshAction ? 'animate-spin-clockwise repeat-infinite' : ''}`}
								/>
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Refresh Equipments</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Input
					bind:value={searchQuery}
					class="w-full py-1 pr-8 sm:w-72"
					placeholder="Filter Equipment..."
				/>
			</div>
		</div>
		{#if query?.loading}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(10) as _}
					<div class="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
						<Skeleton class="aspect-video w-full" />

						<div class="flex flex-grow flex-col p-4">
							<Skeleton class="mb-2 h-5 w-4/5" />

							<div class="space-y-2">
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-2/3" />
							</div>

							<div class="mt-auto pt-4">
								<div class="flex items-center">
									<Skeleton class="mr-3 h-8 w-8 shrink-0 rounded-full" />
									<div class="w-full space-y-1">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-3 w-32" />
									</div>
								</div>

								<div class="mt-4 flex flex-wrap gap-2">
									<Skeleton class="h-6 w-16 rounded-md" />
									<Skeleton class="h-6 w-20 rounded-md" />
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each filterEquipments as equipment (equipment.id)}
					<EquipmentCard {equipment} />
				{/each}
			</div>
		{/if}
	</main>
</div>
