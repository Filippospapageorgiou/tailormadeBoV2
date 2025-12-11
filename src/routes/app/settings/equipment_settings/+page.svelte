<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import type { PageProps } from './$types';
	import { authenticatedAccess, getAllEquipments } from './data.remote';
	import { addEquipment, editEquipment, deleteEquipment } from './data.remote';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Plus, RefreshCw } from 'lucide-svelte';
	import * as Modal from '$lib/components/ui/modal';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import EquipmentCard from './components/equipmentCard.svelte';

	let auth = authenticatedAccess();
	let query = getAllEquipments();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let equipmentStatus = [
		{ value: 'operational', label: 'Σε λειτουργία' },
		{ value: 'maintenance', label: 'σε service' },
		{ value: 'broken', label: 'Βλάβη' }
	];

	let equipmentList = $derived(query?.current?.equipments || []);
	let total = $derived(query?.current?.total);

	let value = $state('');
	const triggerContent = $derived(
		equipmentStatus.find((c) => c.value === value)?.label ?? 'Διαλέξε κατάσταση'
	);

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

	let isUpdating = $state(false);
	let addEquipmentModal = $state(false);
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-white">
		<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
			<div class="mb-4">
				<h1 class="font-mono text-4xl tracking-wider text-neutral-800">Κατάσταση εξοπλισμού</h1>
				<p class="text-sm text-[#8B6B4A]">
					Επισκόπηση των μηχανημάτων του καταστήματος και των προγραμμάτων συντήρησης.
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Διαθέσιμα εξοπλισμοί: <span class="font-semibold">{filterEquipments?.length ?? 0}</span>
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
							<Select.Label>Κατάσταση</Select.Label>
							<Select.Item value={''}>όλα</Select.Item>
							{#each equipmentStatus as status}
								<Select.Item value={status.value ?? ''}>
									{status.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="gpa-2 flex flex-row items-center space-x-2">
					<!-- Search Input -->
					<!-- Add Button -->
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="default"
									size="sm"
									class="h-6 cursor-pointer gap-2 px-2"
									onclick={() => (addEquipmentModal = true)}
								>
									<Plus class="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Προσθέσε νέο εξοπλισμό</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
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
								<p>ανανεώση εξοπλισμού</p>
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
			{#if query?.loading}{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filterEquipments as equipment (equipment.id)}
						<EquipmentCard {equipment} />
					{/each}
				</div>
			{/if}
		</main>
	</div>
{/if}

<Modal.Root bind:open={addEquipmentModal}>
	<Modal.Content>
		<Modal.Header>
			<Modal.Title>Πρόσθεσε νέο εξοπλισμό</Modal.Title>
			<Modal.Description>
				Προσθέσε της απαραιτήτες πληροφορίες και εικονές για τον νέο εξοπλισμό
			</Modal.Description>
		</Modal.Header>
		<Modal.Footer>
			<Button type="submit" disabled={isUpdating}>
				{#if isUpdating}
					<Spinner /> Saving...
				{:else}
					Save Changes
				{/if}
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
