<script lang="ts">
	import { Package, Plus, Trash2, FileText } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { CreateSupplierPaymentInput } from '$lib/models/register.types';

	interface Props {
		payments?: CreateSupplierPaymentInput[];
	}

	let { payments = $bindable([]) }: Props = $props();

	// Initialize with one empty payment if none exist
	$effect(() => {
		if (payments.length === 0) {
			payments = [createEmptyPayment()];
		}
	});

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
		payments = [...payments, createEmptyPayment()];
	}

	function removePayment(index: number) {
		if (payments.length > 1) {
			payments = payments.filter((_, i) => i !== index);
		}
	}

	let totalPayments = $derived(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));

	const paymentMethods = [
		{ value: 'cash', label: 'Μετρητά' },
		{ value: 'bank_transfer', label: 'Τραπεζική Μεταφορά' },
		{ value: 'check', label: 'Επιταγή' }
	];
</script>

<Card.Root class="border-neutral-200 shadow-sm">
	<Card.Header>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-full bg-[#8B6B4A]/10 p-2">
					<Package class="h-5 w-5 text-[#8B6B4A]" />
				</div>
				<div>
					<Card.Title class="text-xl text-neutral-800">Πληρωμές Προμηθευτών</Card.Title>
					<Card.Description>Καταχωρήστε τις πληρωμές προς προμηθευτές</Card.Description>
				</div>
			</div>
			<Badge variant="outline" class="text-sm">
				Σύνολο: €{totalPayments.toFixed(2)}
			</Badge>
		</div>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#each payments as payment, index}
			<div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
				<div class="mb-3 flex items-center justify-between">
					<h4 class="text-sm font-semibold text-neutral-700">Πληρωμή #{index + 1}</h4>
					{#if payments.length > 1}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removePayment(index)}
							class="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<!-- Supplier Name -->
					<div class="space-y-2">
						<Label for="supplier_name_{index}" class="text-sm text-neutral-600"
							>Όνομα Προμηθευτή *</Label
						>
						<Input
							id="supplier_name_{index}"
							type="text"
							bind:value={payment.supplier_name}
							placeholder="π.χ. Καφές Λουμίδης"
							required
						/>
					</div>

					<!-- Amount -->
					<div class="space-y-2">
						<Label for="amount_{index}" class="text-sm text-neutral-600">Ποσό *</Label>
						<Input
							id="amount_{index}"
							type="number"
							bind:value={payment.amount}
							placeholder="0.00"
							min="0"
							step="0.01"
							required
						/>
					</div>

					<!-- Payment Method -->
					<div class="space-y-2">
						<Label for="payment_method_{index}" class="text-sm text-neutral-600"
							>Τρόπος Πληρωμής</Label
						>
						<Select.Root
							selected={{
								value: payment.payment_method || 'cash',
								label:
									paymentMethods.find((m) => m.value === payment.payment_method)?.label || 'Μετρητά'
							}}
							onSelectedChange={(v) => {
								if (v) payment.payment_method = v.value as any;
							}}
						>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Επιλέξτε τρόπο" />
							</Select.Trigger>
							<Select.Content>
								{#each paymentMethods as method}
									<Select.Item value={method.value}>{method.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Invoice Number -->
					<div class="space-y-2">
						<Label for="invoice_number_{index}" class="text-sm text-neutral-600"
							>Αριθμός Παραστατικού</Label
						>
						<div class="relative">
							<FileText class="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
							<Input
								id="invoice_number_{index}"
								type="text"
								bind:value={payment.invoice_number}
								placeholder="π.χ. INV-2024-001"
								class="pl-10"
							/>
						</div>
					</div>

					<!-- Notes (full width) -->
					<div class="space-y-2 md:col-span-2">
						<Label for="notes_{index}" class="text-sm text-neutral-600">Σημειώσεις</Label>
						<Input
							id="notes_{index}"
							type="text"
							bind:value={payment.notes}
							placeholder="Προαιρετικές σημειώσεις..."
						/>
					</div>
				</div>
			</div>
		{/each}

		<!-- Add Payment Button -->
		<Button
			onclick={addPayment}
			variant="outline"
			class="w-full border-dashed border-[#8B6B4A] text-[#8B6B4A] hover:bg-[#8B6B4A]/5"
		>
			<Plus class="mr-2 h-4 w-4" />
			Προσθήκη Πληρωμής
		</Button>

		<!-- Total Summary -->
		<div class="mt-4 rounded-lg bg-[#8B6B4A]/5 p-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-neutral-700">Σύνολο Πληρωμών Προμηθευτών:</span>
				<span class="text-xl font-bold text-[#8B6B4A]">€{totalPayments.toFixed(2)}</span>
			</div>
		</div>
	</Card.Content>
</Card.Root>
