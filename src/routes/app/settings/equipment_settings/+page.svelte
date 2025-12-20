<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { authenticatedAccess, getAllEquipments } from './data.remote';
	import { addEquipment } from './data.remote';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Plus, RefreshCw } from 'lucide-svelte';
	import * as Modal from '$lib/components/ui/modal';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import EquipmentCard from './components/equipmentCard.svelte';
	import { Cloud } from 'lucide-svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';

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

	let name = $state('');
	let model = $state('');
	let serialNumber = $state('');
	let files: FileList | undefined = $state();
	let previewUrl: string | null = $state(null);

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			previewUrl = null;
		}
	}

	let valueStatus = $state('');
	let lastServiceDate = $state('');
	let nextServiceDate = $state('');
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
			{#if query?.loading}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(6) as _, i}
						<div
							class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
							style="animation-delay: {i * 100}ms;"
						>
							<!-- Top Bar with Action Buttons -->
							<div class="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
								<div class="flex gap-1">
									<Skeleton class="h-7 w-7 rounded-md" />
									<Skeleton class="h-7 w-7 rounded-md" />
								</div>
								<Skeleton class="h-6 w-20 rounded-full" />
							</div>

							<!-- Hero Image Section -->
							<Skeleton class="h-40 w-full" />

							<!-- Content Section -->
							<div class="space-y-4 p-4">
								<!-- Equipment Name & ID -->
								<div class="space-y-2">
									<Skeleton class="h-6 w-3/4" />
									<Skeleton class="h-4 w-24" />
									<Skeleton class="h-3 w-32" />
								</div>

								<!-- Status Badge -->
								<Skeleton class="h-6 w-28 rounded-full" />

								<!-- Service Status Section -->
								<div class="space-y-2 rounded-lg bg-gray-50 p-3">
									<Skeleton class="h-3 w-24" />

									<!-- Service Bars -->
									<div class="flex items-center gap-2">
										<div class="flex h-3 items-center gap-0.5">
											{#each { length: 9 } as _}
												<Skeleton class="h-full w-1 rounded-full" />
											{/each}
										</div>
										<Skeleton class="h-4 w-16" />
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
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
	<Modal.Content class="h-[85dvh] sm:h-auto max-h-[95dvh] flex flex-col">
		<Modal.Header>
			<Modal.Title>Πρόσθεσε νέο εξοπλισμό</Modal.Title>
			<Modal.Description>
				Προσθέσε της απαραιτήτες πληροφορίες και εικονές για τον νέο εξοπλισμό
			</Modal.Description>
		</Modal.Header>
		<form
			class="flex flex-col gap-2 space-y-2 px-2 py-2"
			enctype="multipart/form-data"
			{...addEquipment.enhance(async ({ form, data, submit }) => {
				isUpdating = true;
				await submit();
				if (addEquipment.result?.success) {
					toast.success(addEquipment.result.message);
				} else {
					toast.error(addEquipment.result?.message || 'Αποτυχία προσθήκης προσπάθησε πάλι');
				}
				form.reset();
				isUpdating = false;
				addEquipmentModal = false;
			})}
		>
			<ScrollArea class="h-[50dvh] max-h-[90dvh] w-full md:h-auto md:max-h-[80vh]">
				<div class="w-full space-y-2">
					<Label class="gap-1">
						Όνομα εξοπλισμού <span class="text-destructive">*</span>
					</Label>
					<Input type="text" name="name" placeholder="La marzoco machine" required />
					<Label class="gap-1">
						Μοντέλο εξοπλισμού <span class="text-destructive">*</span>
					</Label>
					<Input type="text" name="model" placeholder="2-Group AV" required />
					<Label class="gap-1">Σειριακός αριθμός εξοπλισμού</Label>
					<Input type="text" name="serial_number" placeholder="LM-1234-5678" />

					<input
						id="image-upload"
						name="image_url"
						type="file"
						accept="image/*"
						class="hidden"
						bind:files
						onchange={handleFileChange}
					/>

					{#if previewUrl}
						<button
							type="button"
							onclick={() => document.getElementById('image-upload')?.click()}
							class="w-full"
						>
							<Empty.Root class="cursor-pointer transition-colors hover:bg-muted/50">
								<Empty.Header>
									<Empty.Description>
										<img
											src={previewUrl}
											alt="Preview"
											class="mx-auto max-h-48 rounded-md object-cover"
										/>
									</Empty.Description>
								</Empty.Header>
								<Empty.Content>
									<p class="text-xs text-muted-foreground">Κλικ για αλλαγή εικόνας</p>
								</Empty.Content>
							</Empty.Root>
						</button>
					{:else}
						<button
							type="button"
							onclick={() => document.getElementById('image-upload')?.click()}
							class="w-full"
						>
							<Empty.Root
								class="cursor-pointer border border-dashed transition-colors hover:bg-muted/50"
							>
								<Empty.Header>
									<Empty.Media variant="icon">
										<Cloud />
									</Empty.Media>
									<Empty.Title>Ανέβασε εικόνα</Empty.Title>
									<Empty.Description>
										Κάνε κλικ για να ανεβάσεις εικόνα του εξοπλισμού
									</Empty.Description>
								</Empty.Header>
							</Empty.Root>
						</button>
					{/if}

					<Label class="gap-1">Manual url</Label>
					<Input
						name="manual_url"
						type="text"
						placeholder="https://lamarzoccousa.com/commercial-products/espresso-machines/kb90/"
					/>
					<Label>Κατάσταση εξοπλισμού<span class="text-destructive">*</span></Label>
					<Select.Root type="single" name="status" bind:value={valueStatus} required>
						<Select.Trigger class="w-full">
							{equipmentStatus.find((c) => c.value === valueStatus)?.label ?? 'Διαλέξε κατάσταση'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Κατάσταση</Select.Label>
								{#each equipmentStatus as status (status.value)}
									<Select.Item value={status.value} label={status.label}>
										{status.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>

					<Label>Τελευταίο servise εξοπλισμού<span class="text-destructive">*</span></Label>
					<InputCalendar id="last_service_date" bind:value={lastServiceDate} required />
					<input type="hidden" name="last_service_date" value={lastServiceDate} />
					<Label>Έπομενο servise εξοπλισμού<span class="text-destructive">*</span></Label>
					<InputCalendar id="next_service_date" bind:value={nextServiceDate} required />
					<input type="hidden" name="next_service_date" value={nextServiceDate} />
				</div>
			</ScrollArea>
			<Modal.Footer class="py-2">
				<Button type="submit" disabled={isUpdating}>
					{#if isUpdating}
						<Spinner /> Προσθήκη εξοπλισμού
					{:else}
						Προσθήκη εξοπλισμού
					{/if}
				</Button>
				<Button
					variant="outline"
					onclick={() => {
						addEquipmentModal = false;
					}}
				>
					Κλείσιμο
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>
