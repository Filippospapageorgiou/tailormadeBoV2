<script lang="ts">
	import { Receipt, Plus, Trash2 } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { CreateExpenseInput } from '$lib/models/register.types';

	import { getSalesRegister } from '$lib/stores/register.svelte';

	let sales = getSalesRegister();

	function createEmptyExpense(): CreateExpenseInput {
		return {
			expense_category: '',
			description: '',
			amount: 0
		};
	}

	function addExpense() {
		sales.expenses = [...sales.expenses, createEmptyExpense()];
	}

	function removeExpense(index: number) {
		sales.expenses = sales.expenses.filter((_, i) => i !== index);
	}


	const expenseCategories = [
		{ value: 'personall', label: 'προσωπική' },
		{ value: 'cleaning', label: 'Καθαριότητα' },
		{ value: 'maintenance', label: 'Συντήρηση' },
		{ value: 'supplies', label: 'Αναλώσιμα' },
		{ value: 'transportation', label: 'Μεταφορά' },
		{ value: 'other', label: 'Άλλα' }
	];
</script>

<Card.Root class="rounded-xl border-border/60 shadow-sm">
	<Card.Header class="pb-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Receipt class="h-5 w-5 text-primary" />
				</div>
				<div>
					<Card.Title class="text-lg font-semibold text-foreground">Έξοδα Ημέρας</Card.Title>
					<Card.Description class="text-sm">Καταχωρήστε τα έξοδα της ημέρας</Card.Description>
				</div>
			</div>
			{#if sales.expenses.length > 0}
				<Badge variant="secondary" class="tabular-nums">
					Σύνολο: €{sales.totalExpenses.toFixed(2)}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if sales.expenses.length > 0}
			{#each sales.expenses as expense, index}
				<div class="rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
					<div class="mb-4 flex items-center justify-between">
						<span class="text-sm font-medium text-foreground">Έξοδο #{index + 1}</span>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removeExpense(index)}
							class="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<!-- Category -->
						<div class="space-y-1.5">
							<Label for="category_{index}" class="text-sm text-muted-foreground">Κατηγορία *</Label>
							<Select.Root
								type="single"
								name="paymentMethods"
								bind:value={expense.expense_category}
							>
								<Select.Trigger class="w-full">
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
						<div class="space-y-1.5">
							<Label for="expense_amount_{index}" class="text-sm text-muted-foreground">Ποσό *</Label>
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
						<div class="space-y-1.5 sm:col-span-2">
							<Label for="description_{index}" class="text-sm text-muted-foreground">Περιγραφή *</Label>
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
			class="w-full border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
		>
			<Plus class="mr-2 h-4 w-4" />
			Προσθήκη Εξόδου
		</Button>
	</Card.Content>
</Card.Root>
