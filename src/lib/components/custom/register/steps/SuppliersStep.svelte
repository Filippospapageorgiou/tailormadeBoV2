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

	$effect(() => {
		sales.supplierPayments.forEach((payment) => {
			if (payment.supplier_name) {
				const supplier = suppliers.find((s) => s.name === payment.supplier_name);
				if (supplier && payment.supplier_id !== supplier.id) {
					payment.supplier_id = supplier.id;
				}
			}
		});
		$inspect(sales.supplierPayments);
	});



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

<Card.Root class="rounded-xl border-border/60 shadow-sm">
	<Card.Header class="pb-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Package class="h-5 w-5 text-primary" />
				</div>
				<div>
					<Card.Title class="text-lg font-semibold text-foreground">Πληρωμές Προμηθευτών</Card.Title>
					<Card.Description class="text-sm">
						Καταχωρήστε τις πληρωμές προς προμηθευτές
					</Card.Description>
				</div>
			</div>
			{#if sales.supplierPayments.length > 0}
				<Badge variant="secondary" class="tabular-nums">
					Σύνολο: €{sales.totalSupplierPayments.toFixed(2)}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if sales.supplierPayments.length > 0}
			{#each sales.supplierPayments as payment, index}
				<div class="rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50 sm:p-5">
					<div class="mb-4 flex items-center justify-between">
						<span class="text-sm font-medium text-foreground">Πληρωμή #{index + 1}</span>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removePayment(index)}
							class="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<!-- Supplier Name -->
						<div class="space-y-1.5">
							<Label class="text-sm text-muted-foreground">Όνομα Προμηθευτή *</Label>
							{#if suppliersLoading}
								<Skeleton class="h-10 w-full rounded-md" />
							{:else}
							<div class="flex flex-row gap-2">
								<Select.Root type="single" name="supplierName" bind:value={payment.supplier_name}>
									<Select.Trigger class="w-full">
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
												variant="outline"
												size="icon"
												class="h-9 w-9 shrink-0"
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
						<div class="space-y-1.5">
							<Label class="text-sm text-muted-foreground">Ποσό *</Label>
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
						<div class="space-y-1.5">
							<Label class="text-sm text-muted-foreground">Τρόπος Πληρωμής</Label>
							<Select.Root type="single" name="paymentMethods" bind:value={payment.payment_method}>
							<Select.Trigger class="w-full">
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
						<div class="space-y-1.5">
							<Label class="text-sm text-muted-foreground">Αριθμός Παραστατικού</Label>
							<div class="relative">
								<FileText class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									type="text"
									bind:value={payment.invoice_number}
									placeholder="π.χ. INV-2024-001"
									class="pl-10"
								/>
							</div>
						</div>

						<!-- Notes (full width) -->
						<div class="space-y-1.5 sm:col-span-2">
							<Label class="text-sm text-muted-foreground">Σημειώσεις</Label>
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
			class="w-full border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
		>
			<Plus class="mr-2 h-4 w-4" />
			Προσθήκη Πληρωμής
		</Button>
	</Card.Content>
</Card.Root>

<AddSupplierDialog bind:open={addSupplierDialogOpen} {onSuccess} />
