<script lang="ts">
	import { Receipt, Plus, Trash2 } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { CreateExpenseInput } from '$lib/models/register.types';

	interface Props {
		expenses?: CreateExpenseInput[];
	}

	let { expenses = $bindable([]) }: Props = $props();

	function createEmptyExpense(): CreateExpenseInput {
		return {
			expense_category: '',
			description: '',
			amount: 0
		};
	}

	function addExpense() {
		expenses = [...expenses, createEmptyExpense()];
	}

	function removeExpense(index: number) {
		expenses = expenses.filter((_, i) => i !== index);
	}

	let totalExpenses = $derived(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));

	const expenseCategories = [
		{ value: 'personall', label: 'προσωπική' },
		{ value: 'cleaning', label: 'Καθαριότητα' },
		{ value: 'maintenance', label: 'Συντήρηση' },
		{ value: 'supplies', label: 'Αναλώσιμα' },
		{ value: 'transportation', label: 'Μεταφορά' },
		{ value: 'other', label: 'Άλλα' }
	];
</script>

<Card.Root class="border-neutral-200 shadow-sm">
	<Card.Header>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-full bg-[#8B6B4A]/10 p-2">
					<Receipt class="h-5 w-5 text-[#8B6B4A]" />
				</div>
				<div>
					<Card.Title class="text-xl text-neutral-800">Έξοδα Ημέρας</Card.Title>
					<Card.Description>Καταχωρήστε τα έξοδα της ημέρας</Card.Description>
				</div>
			</div>
			<Badge variant="outline" class="text-sm">
				Σύνολο: €{totalExpenses.toFixed(2)}
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if expenses.length > 0}
			{#each expenses as expense, index}
				<div class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between">
						<h4 class="text-sm font-semibold text-neutral-700">Έξοδο #{index + 1}</h4>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removeExpense(index)}
							class="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<!-- Category -->
						<div class="space-y-2">
							<Label for="category_{index}" class="text-sm text-neutral-600">Κατηγορία *</Label>
							<Select.Root
								type="single"
								name="paymentMethods"
								bind:value={expense.expense_category}
							>
								<Select.Trigger class="w-full sm:w-[260px]">
									{expenseCategories.find((f) => f.value === expense.expense_category)?.label ??
										'Διάλεξε κατηγορία'}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>Κατηγορία εξόδων</Select.Label>
										{#each expenseCategories as method (method.value)}
											<Select.Item value={method.value} label={method.label}>
												{method.label}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>

						<!-- Amount -->
						<div class="space-y-2">
							<Label for="expense_amount_{index}" class="text-sm text-neutral-600">Ποσό *</Label>
							<Input
								id="expense_amount_{index}"
								type="number"
								bind:value={expense.amount}
								placeholder="0.00"
								min="0"
								step="0.01"
								required
							/>
						</div>

						<!-- Description (full width) -->
						<div class="space-y-2 md:col-span-2">
							<Label for="description_{index}" class="text-sm text-neutral-600">Περιγραφή *</Label>
							<Input
								id="description_{index}"
								type="text"
								bind:value={expense.description}
								placeholder="π.χ. Αγορά απορρυπαντικών"
								required
							/>
						</div>
					</div>
				</div>
			{/each}
		{/if}

		<!-- Add Expense Button -->
		<Button
			onclick={addExpense}
			variant="outline"
			class="w-full border-dashed border-[#8B6B4A] text-[#8B6B4A] hover:bg-[#8B6B4A]/5"
		>
			<Plus class="mr-2 h-4 w-4" />
			Προσθήκη Εξόδου
		</Button>

		<!-- Total Summary -->
		{#if expenses.length > 0}
			<div class="mt-4 rounded-lg bg-[#8B6B4A]/5 p-4">
				<div class="flex items-center justify-between">
					<span class="text-sm font-semibold text-neutral-700">Σύνολο Εξόδων:</span>
					<span class="text-xl font-bold text-[#8B6B4A]">€{totalExpenses.toFixed(2)}</span>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
