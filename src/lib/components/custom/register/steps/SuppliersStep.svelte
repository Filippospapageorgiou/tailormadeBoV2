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
		payments = payments.filter((_, i) => i !== index);
	}

	let totalPayments = $derived(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));

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
			{#if payments.length > 0}
				<Badge variant="outline" class="text-sm">
					Σύνολο: €{totalPayments.toFixed(2)}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-5">
		{#if payments.length > 0}
			{#each payments as payment, index}
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
							<Label class="text-sm text-neutral-600">Όνομα Προμηθευτή *</Label>
							<Input
								type="text"
								bind:value={payment.supplier_name}
								placeholder="π.χ. Καφές Λουμίδης"
								required
							/>
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
							<Select.Trigger class="w-full sm:w-[260px]">
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

		<!-- Total Summary -->
		{#if payments.length > 0}
			<div class="mt-4 rounded-lg bg-[#8B6B4A]/5 p-4">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold text-neutral-700">Σύνολο Πληρωμών:</span>
					<span class="text-xl font-bold text-[#8B6B4A]">€{totalPayments.toFixed(2)}</span>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>