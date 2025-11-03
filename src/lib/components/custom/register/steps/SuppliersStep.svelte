<script lang="ts">
	import { Package, Plus, Trash2, FileText } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { CreateSupplierPaymentInput,Supplier } from '$lib/models/register.types';
	import AddSupplierDialog from '../../../../../routes/app/register/components/AddSupplierDialog.svelte';
	import { getSalesRegister } from '$lib/stores/register.svelte';

	let sales = getSalesRegister();
	interface Props {
		suppliers?:Supplier[];
		suppliersLoading?:boolean;
		onSuccess: () => Promise<void>;
	}

	let { suppliers = [], suppliersLoading, onSuccess }: Props = $props();

	let addSupplierDialogOpen = $state(false);

	function createEmptyPayment(): CreateSupplierPaymentInput {
		return {
			supplier_name: '',
			amount: 0,
			payment_method: 'cash',
			invoice_number: '',
			notes: ''
		};
	}

	function addPayment() {
		sales.supplierPayments = [...sales.supplierPayments, createEmptyPayment()];
	}

	function removePayment(index: number) {
		sales.supplierPayments = sales.supplierPayments.filter((_, i) => i !== index);
	}
	const paymentMethods = [
		{ value: 'cash', label: 'Μετρητά' },
		{ value: 'bank_transfer', label: 'Τραπεζική Μεταφορά' },
		{ value: 'check', label: 'Επιταγή' }
	];
</script>

<Card.Root class="border-neutral-200 px-4 shadow-sm sm:px-6 lg:px-8">
	<Card.Header>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-full bg-[#8B6B4A]/10 p-2">
					<Package class="h-5 w-5 text-[#8B6B4A]" />
				</div>
				<div>
					<Card.Title class="text-lg text-neutral-800 sm:text-xl">Πληρωμές Προμηθευτών</Card.Title>
					<Card.Description class="text-sm sm:text-base">
						Καταχωρήστε τις πληρωμές προς προμηθευτές
					</Card.Description>
				</div>
			</div>
			{#if sales.supplierPayments.length > 0}
				<Badge variant="outline" class="text-sm">
					Σύνολο: €{sales.totalSupplierPayments.toFixed(2)}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-5">
		{#if sales.supplierPayments.length > 0}
			{#each sales.supplierPayments as payment, index}
				<div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
					<div class="mb-3 flex items-center justify-between">
						<h4 class="text-sm font-semibold text-neutral-700">Πληρωμή #{index + 1}</h4>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removePayment(index)}
							class="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<!-- Responsive grid -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<!-- Supplier Name -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label class="text-sm text-neutral-600">Όνομα Προμηθευτή *</Label>
							</div>
							{#if suppliersLoading}
								<Skeleton class="h-10 w-full rounded-md" />
							{:else}
							<div class="flex flex-row gap-2">
								<Select.Root type="single" name="supplierName" bind:value={payment.supplier_name}>
									<Select.Trigger class="w-full sm:w-[360px]">
										{suppliers.find((s) => s.name === payment.supplier_name)?.name ??
											'Διάλεξε προμηθευτή'}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Προμηθευτές</Select.Label>
											{#each suppliers as supplier (supplier.id)}
												<Select.Item value={supplier.name} label={supplier.name}>
													{supplier.name}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>

								<Tooltip.Provider>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												variant="ghost"
												size="sm"
												class="h-6 w-6 p-0 text-[#8B6B4A] hover:bg-[#8B6B4A]/10 hover:text-[#8B6B4A]"
												onclick={() => (addSupplierDialogOpen = true)}
											>
												<Plus class="h-4 w-4" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>Προσθήκη νέου προμηθευτή</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</div>
							{/if}
						</div>

						<!-- Amount -->
						<div class="space-y-2">
							<Label class="text-sm text-neutral-600">Ποσό *</Label>
							<Input
								type="number"
								bind:value={payment.amount}
								placeholder="0.00"
								min="0"
								step="0.01"
								required
							/>
						</div>

						<!-- Payment Method -->
						<div class="space-y-2 sm:col-span-2 md:col-span-1">
							<Label class="text-sm text-neutral-600">Τρόπος Πληρωμής</Label>
							<Select.Root type="single" name="paymentMethods" bind:value={payment.payment_method}>
							<Select.Trigger class="w-[240px]">
								{paymentMethods.find((f) => f.value === payment.payment_method)?.label ??
									'Διάλεξε μέθοδο πληρωμής'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Μέθοδο πληρωμής</Select.Label>
									{#each paymentMethods as method (method.value)}
										<Select.Item value={method.value} label={method.label}>
											{method.label}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
						</div>

						<!-- Invoice Number -->
						<div class="space-y-2">
							<Label class="text-sm text-neutral-600">Αριθμός Παραστατικού</Label>
							<div class="relative">
								<FileText class="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
								<Input
									type="text"
									bind:value={payment.invoice_number}
									placeholder="π.χ. INV-2024-001"
									class="pl-10"
								/>
							</div>
						</div>

						<!-- Notes (full width) -->
						<div class="space-y-2 sm:col-span-2">
							<Label class="text-sm text-neutral-600">Σημειώσεις</Label>
							<Input
								type="text"
								bind:value={payment.notes}
								placeholder="Προαιρετικές σημειώσεις..."
							/>
						</div>
					</div>
				</div>
			{/each}
		{/if}

		<!-- Add Payment Button -->
		<Button
			onclick={addPayment}
			variant="outline"
			class="w-full border-dashed border-[#8B6B4A] text-[#8B6B4A] hover:bg-[#8B6B4A]/10"
		>
			<Plus class="mr-2 h-4 w-4" />
			Προσθήκη Πληρωμής
		</Button>
	</Card.Content>
</Card.Root>

<AddSupplierDialog bind:open={addSupplierDialogOpen} {onSuccess} />