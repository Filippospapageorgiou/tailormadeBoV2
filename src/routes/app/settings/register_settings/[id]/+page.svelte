<script lang="ts">
	import type { PageProps } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import {
		CheckIcon,
		Euro,
		MoveDown,
		Pen,
		X,
		Save,
		CreditCard,
		Bike,
		UtensilsCrossed,
		Smartphone,
		Plus,
		Trash2,
		FileText
	} from 'lucide-svelte';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Zap from '@lucide/svelte/icons/zap';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { formatCurrency, formatDate } from '$lib/utils';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';

	let { data, form }: PageProps = $props();

	let closing = $derived(data.closing);
	let closedByProfile = $derived(data.closedByProfile);
	let supplierPayments = $derived(data.supplierPayments);
	let expenses = $derived(data.expenses);

	// Edit mode state
	let isEditing = $state(false);

	// Editable copies of data
	let editSales = $state({
		total_sales: 0,
		card_sales: 0,
		wolt_sales: 0,
		efood_sales: 0,
		other_digital_sales: 0,
		opening_float: 0,
		actual_cash_counted: 0,
		tomorrow_opening_float: 0,
		cash_deposit: 0
	});

	let editSupplierPayments = $state<any[]>([]);
	let editExpenses = $state<any[]>([]);

	function enterEditMode() {
		editSales = {
			total_sales: closing.total_sales,
			card_sales: closing.card_sales,
			wolt_sales: closing.wolt_sales,
			efood_sales: closing.efood_sales,
			other_digital_sales: closing.other_digital_sales,
			opening_float: closing.opening_float,
			actual_cash_counted: closing.actual_cash_counted,
			tomorrow_opening_float: closing.tomorrow_opening_float,
			cash_deposit: closing.cash_deposit
		};
		editSupplierPayments = supplierPayments.map((p) => ({ ...p }));
		editExpenses = expenses.map((e) => ({ ...e }));
		isEditing = true;
	}

	function cancelEdit() {
		isEditing = false;
	}

	// Edit mode computed values
	let editDigital = $derived(
		editSales.card_sales + editSales.wolt_sales + editSales.efood_sales + editSales.other_digital_sales
	);
	let editTotalSupplierPayments = $derived(
		editSupplierPayments
			.filter((p) => p.payment_method === 'cash')
			.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
	);
	let editTotalExpenses = $derived(
		editExpenses.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
	);
	let editExpectedCash = $derived(
		editSales.total_sales - editDigital - editTotalSupplierPayments - editTotalExpenses
	);
	let editExpectedFinal = $derived(editExpectedCash + editSales.opening_float);

	// Read-only computed values
	let totalDigital = $derived(
		closing.card_sales + closing.wolt_sales + closing.efood_sales + closing.other_digital_sales
	);
	let cashSales = $derived(closing.total_sales - totalDigital);
	let totalPayments = $derived(
		supplierPayments.reduce((acc, curr) => acc + Number(curr.amount), 0)
	);
	let totalExpenses = $derived(expenses.reduce((acc, curr) => acc + Number(curr.amount), 0));

	// Supplier payment helpers
	function addPayment() {
		editSupplierPayments = [
			...editSupplierPayments,
			{
				supplier_name: '',
				amount: 0,
				payment_method: 'cash',
				invoice_number: '',
				notes: ''
			}
		];
	}

	function removePayment(index: number) {
		editSupplierPayments = editSupplierPayments.filter((_, i) => i !== index);
	}

	// Expense helpers
	function addExpense() {
		editExpenses = [
			...editExpenses,
			{
				expense_category: '',
				description: '',
				amount: 0
			}
		];
	}

	function removeExpense(index: number) {
		editExpenses = editExpenses.filter((_, i) => i !== index);
	}

	const paymentMethods = [
		{ value: 'cash', label: 'Μετρητά' },
		{ value: 'bank_transfer', label: 'Τραπεζική Μεταφορά' },
		{ value: 'check', label: 'Επιταγή' }
	];

	const expenseCategories = [
		{ value: 'personall', label: 'Προσωπική' },
		{ value: 'cleaning', label: 'Καθαριότητα' },
		{ value: 'maintenance', label: 'Συντήρηση' },
		{ value: 'supplies', label: 'Αναλώσιμα' },
		{ value: 'transportation', label: 'Μεταφορά' },
		{ value: 'other', label: 'Άλλα' }
	];

	function prepareUpdateData() {
		return JSON.stringify({
			total_sales: editSales.total_sales,
			card_sales: editSales.card_sales,
			wolt_sales: editSales.wolt_sales,
			efood_sales: editSales.efood_sales,
			other_digital_sales: editSales.other_digital_sales,
			opening_float: editSales.opening_float,
			actual_cash_counted: editSales.actual_cash_counted,
			excepted_cash: editExpectedCash,
			total_supplier_payments: editTotalSupplierPayments,
			total_expenses: editTotalExpenses,
			tomorrow_opening_float: editSales.tomorrow_opening_float,
			cash_deposit: editSales.cash_deposit,
			supplierPayments: editSupplierPayments.map((p) => ({
				supplier_id: p.supplier_id || null,
				supplier_name: p.supplier_name || null,
				amount: Number(p.amount),
				payment_method: p.payment_method || 'cash',
				invoice_number: p.invoice_number || null,
				notes: p.notes || null
			})),
			expenses: editExpenses.map((e) => ({
				expense_category: e.expense_category || null,
				description: e.description || null,
				amount: Number(e.amount)
			}))
		});
	}

	let saving = $state(false);

	function handleBack() {
		goto('/app/settings/register_settings');
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-5xl px-4 py-6 md:px-6 lg:py-10">
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					onclick={handleBack}
					class="shrink-0 rounded-xl border-border"
				>
					<ArrowLeftIcon class="h-4 w-4" />
				</Button>
				<div>
					<h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
						Κλείσιμο Ταμείου
					</h1>
					<p class="mt-0.5 text-sm text-muted-foreground">
						{formatDate(closing.closing_date)}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if isEditing}
					<Button variant="outline" onclick={cancelEdit} class="gap-2">
						<X class="h-4 w-4" />
						Ακύρωση
					</Button>
				{:else}
					<Button variant="outline" onclick={enterEditMode} class="gap-2">
						<Pen class="h-4 w-4" />
						Επεξεργασία
					</Button>
				{/if}
			</div>
		</header>

		<!-- Closed By & Meta Info -->
		<div
			class="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex items-center gap-3">
				<Avatar.Root
					class="h-11 w-11 border-2 border-background shadow-sm ring-1 ring-border"
				>
					<Avatar.Image class="dark:bg-white" src={closedByProfile?.image_url} alt={closedByProfile?.username} />
					<Avatar.Fallback
						class="bg-muted font-medium text-muted-foreground"
					>
						{closedByProfile?.username?.charAt(0).toUpperCase() || '?'}
					</Avatar.Fallback>
				</Avatar.Root>
				<div>
					<p class="text-xs text-muted-foreground">Κλείσιμο από</p>
					<p class="text-sm font-semibold text-foreground">
						{closedByProfile?.username || 'Unknown'}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-6">
				<div>
					<p class="text-xs text-muted-foreground">Ημερομηνία</p>
					<p class="text-sm font-semibold text-foreground">
						{formatDate(closing.closing_date)}
					</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Κατάσταση</p>
					<Badge variant="secondary" class="mt-0.5 capitalize">{closing.status}</Badge>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Σύνολο Ταμείου</p>
					<p class="text-lg font-bold tabular-nums text-foreground">
						{formatCurrency(isEditing ? editSales.total_sales : closing.total_sales)}
					</p>
				</div>
			</div>
		</div>

		{#if isEditing}
			<!-- ==================== EDIT MODE ==================== -->
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						saving = false;
						if (result.type === 'success' && result.data?.success) {
							showSuccessToast('Επιτυχία', 'Το κλείσιμο ενημερώθηκε επιτυχώς');
							isEditing = false;
							await invalidateAll();
						} else {
							const message =
								result.type === 'failure'
									? result.data?.message
									: 'Σφάλμα κατά την ενημέρωση';
							showFailToast('Σφάλμα','Κάτι πήγε στραβά');
						}
					};
				}}
			>
				<input type="hidden" name="updateData" value={prepareUpdateData()} />

				<div class="space-y-8">
					<!-- SALES EDIT SECTION -->
					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
									<TrendingUp class="h-4 w-4 text-primary" />
								</div>
								<div>
									<Card.Title class="text-lg text-foreground">Πωλήσεις</Card.Title>
									<Card.Description>Επεξεργασία πωλήσεων ημέρας</Card.Description>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="space-y-5 p-6">
							<div class="space-y-2">
								<Label class="text-sm font-medium text-foreground">Συνολικές Πωλήσεις</Label>
								<div class="relative">
									<Euro class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										type="number"
										bind:value={editSales.total_sales}
										step="0.01"
										min="0"
										class="pl-10"
									/>
								</div>
							</div>

							<div class="rounded-xl border border-border bg-muted/20 p-4">
								<p class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
									<CreditCard class="h-4 w-4" />
									Ψηφιακές Πληρωμές
								</p>
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-1.5">
										<Label class="text-xs text-muted-foreground">Κάρτες (POS)</Label>
										<div class="relative">
											<CreditCard class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
											<Input type="number" bind:value={editSales.card_sales} step="0.01" min="0" class="pl-10" />
										</div>
									</div>
									<div class="space-y-1.5">
										<Label class="text-xs text-muted-foreground">Wolt</Label>
										<div class="relative">
											<Bike class="absolute left-3 top-3 h-4 w-4 text-blue-400" />
											<Input type="number" bind:value={editSales.wolt_sales} step="0.01" min="0" class="pl-10" />
										</div>
									</div>
									<div class="space-y-1.5">
										<Label class="text-xs text-muted-foreground">e-Food</Label>
										<div class="relative">
											<UtensilsCrossed class="absolute left-3 top-3 h-4 w-4 text-red-400" />
											<Input type="number" bind:value={editSales.efood_sales} step="0.01" min="0" class="pl-10" />
										</div>
									</div>
									<div class="space-y-1.5">
										<Label class="text-xs text-muted-foreground">Άλλες Ψηφιακές</Label>
										<div class="relative">
											<Smartphone class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
											<Input type="number" bind:value={editSales.other_digital_sales} step="0.01" min="0" class="pl-10" />
										</div>
									</div>
								</div>
							</div>

							<!-- Computed preview -->
							<div class="flex items-center justify-between rounded-xl bg-primary/5 p-4 dark:bg-primary/10">
								<span class="text-sm text-foreground">Αναμενόμενα Μετρητά</span>
								<span class="font-mono text-xl font-bold text-primary">{formatCurrency(editExpectedCash)}</span>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- SUPPLIER PAYMENTS EDIT SECTION -->
					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
										<ShoppingCart class="h-4 w-4 text-primary" />
									</div>
									<div>
										<Card.Title class="text-lg text-foreground">Πληρωμές Προμηθευτών</Card.Title>
										<Card.Description>
											{editSupplierPayments.length} πληρωμή(ές)
										</Card.Description>
									</div>
								</div>
								<Badge variant="outline" class="tabular-nums">
									{formatCurrency(editTotalSupplierPayments)}
								</Badge>
							</div>
						</Card.Header>
						<Card.Content class="space-y-4 p-6">
							{#each editSupplierPayments as payment, index}
								<div class="rounded-xl border border-border bg-card p-4">
									<div class="mb-3 flex items-center justify-between">
										<span class="text-sm font-medium text-foreground">Πληρωμή #{index + 1}</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removePayment(index)}
											class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
									<div class="grid gap-3 sm:grid-cols-2">
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Προμηθευτής</Label>
											<Input type="text" bind:value={payment.supplier_name} placeholder="Όνομα προμηθευτή" />
										</div>
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Ποσό</Label>
											<Input type="number" bind:value={payment.amount} step="0.01" min="0" />
										</div>
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Μέθοδος Πληρωμής</Label>
											<Select.Root type="single" bind:value={payment.payment_method}>
												<Select.Trigger class="w-full">
													{paymentMethods.find((m) => m.value === payment.payment_method)?.label || 'Επιλέξτε'}
												</Select.Trigger>
												<Select.Content>
													{#each paymentMethods as method}
														<Select.Item value={method.value} label={method.label}>{method.label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Αρ. Παραστατικού</Label>
											<div class="relative">
												<FileText class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
												<Input type="text" bind:value={payment.invoice_number} placeholder="INV-001" class="pl-10" />
											</div>
										</div>
										<div class="space-y-1.5 sm:col-span-2">
											<Label class="text-xs text-muted-foreground">Σημειώσεις</Label>
											<Input type="text" bind:value={payment.notes} placeholder="Σημειώσεις..." />
										</div>
									</div>
								</div>
							{/each}
							<Button
								type="button"
								variant="outline"
								onclick={addPayment}
								class="w-full border-dashed border-primary text-primary hover:bg-primary/5"
							>
								<Plus class="mr-2 h-4 w-4" />
								Προσθήκη Πληρωμής
							</Button>
						</Card.Content>
					</Card.Root>

					<!-- EXPENSES EDIT SECTION -->
					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
										<Zap class="h-4 w-4 text-primary" />
									</div>
									<div>
										<Card.Title class="text-lg text-foreground">Έξοδα</Card.Title>
										<Card.Description>
											{editExpenses.length} έξοδο(α)
										</Card.Description>
									</div>
								</div>
								<Badge variant="outline" class="tabular-nums">
									{formatCurrency(editTotalExpenses)}
								</Badge>
							</div>
						</Card.Header>
						<Card.Content class="space-y-4 p-6">
							{#each editExpenses as expense, index}
								<div class="rounded-xl border border-border bg-card p-4">
									<div class="mb-3 flex items-center justify-between">
										<span class="text-sm font-medium text-foreground">Έξοδο #{index + 1}</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removeExpense(index)}
											class="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
									<div class="grid gap-3 sm:grid-cols-2">
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Κατηγορία</Label>
											<Select.Root type="single" bind:value={expense.expense_category}>
												<Select.Trigger class="w-full">
													{expenseCategories.find((c) => c.value === expense.expense_category)?.label || 'Επιλέξτε'}
												</Select.Trigger>
												<Select.Content>
													{#each expenseCategories as cat}
														<Select.Item value={cat.value} label={cat.label}>{cat.label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>
										<div class="space-y-1.5">
											<Label class="text-xs text-muted-foreground">Ποσό</Label>
											<Input type="number" bind:value={expense.amount} step="0.01" min="0" />
										</div>
										<div class="space-y-1.5 sm:col-span-2">
											<Label class="text-xs text-muted-foreground">Περιγραφή</Label>
											<Input type="text" bind:value={expense.description} placeholder="Περιγραφή εξόδου..." />
										</div>
									</div>
								</div>
							{/each}
							<Button
								type="button"
								variant="outline"
								onclick={addExpense}
								class="w-full border-dashed border-primary text-primary hover:bg-primary/5"
							>
								<Plus class="mr-2 h-4 w-4" />
								Προσθήκη Εξόδου
							</Button>
						</Card.Content>
					</Card.Root>

					<!-- FINAL CASH EDIT SECTION -->
					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
									<Euro class="h-4 w-4 text-primary" />
								</div>
								<div>
									<Card.Title class="text-lg text-foreground">Τελικά Μετρητά</Card.Title>
									<Card.Description>Πραγματική καταμέτρηση & διαχείριση μετρητών</Card.Description>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="space-y-5 p-6">
							<!-- Summary row -->
							<div class="rounded-xl bg-muted/40 p-4 dark:bg-muted/20">
								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span class="text-muted-foreground">Αναμενόμενα Μετρητά (χωρίς πάγιο)</span>
										<span class="tabular-nums text-foreground">{formatCurrency(editExpectedCash)}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-muted-foreground">Πάγιο Ημέρας</span>
										<span class="tabular-nums text-foreground">{formatCurrency(editSales.opening_float)}</span>
									</div>
									<Separator />
									<div class="flex items-center justify-between">
										<span class="text-sm font-semibold text-foreground">Αναμενόμενο Σύνολο</span>
										<span class="font-mono text-lg font-bold text-primary">{formatCurrency(editExpectedFinal)}</span>
									</div>
								</div>
							</div>

							<div class="grid gap-4 sm:grid-cols-2">
								<div class="space-y-1.5">
									<Label class="text-sm font-medium text-foreground">Πάγιο Ημέρας</Label>
									<Input type="number" bind:value={editSales.opening_float} step="0.01" min="0" />
								</div>
								<div class="space-y-1.5">
									<Label class="text-sm font-medium text-foreground">Πραγματικά Μετρητά</Label>
									<Input type="number" bind:value={editSales.actual_cash_counted} step="0.01" min="0" />
								</div>
								<div class="space-y-1.5">
									<Label class="text-sm font-medium text-foreground">Πάγιο Αυριανής</Label>
									<Input type="number" bind:value={editSales.tomorrow_opening_float} step="0.01" min="0" />
								</div>
								<div class="space-y-1.5">
									<Label class="text-sm font-medium text-foreground">Κατάθεση Τράπεζας</Label>
									<Input type="number" bind:value={editSales.cash_deposit} step="0.01" min="0" />
								</div>
							</div>

							<!-- Difference indicator -->
							{@const editDiff = editSales.actual_cash_counted - editExpectedFinal}
							{#if editSales.actual_cash_counted > 0}
								<div
									class="flex items-center justify-between rounded-xl p-4 {editDiff >= 0
										? 'bg-green-50 dark:bg-green-950/30'
										: 'bg-red-50 dark:bg-red-950/30'}"
								>
									<span class="text-sm font-medium text-foreground">
										{editDiff >= 0 ? 'Πλεόνασμα' : 'Έλλειμμα'}
									</span>
									<Badge variant={editDiff >= 0 ? 'secondary' : 'destructive'} class="tabular-nums {editDiff >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}">
										{editDiff >= 0 ? '+' : ''}{formatCurrency(editDiff)}
									</Badge>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<!-- Save Actions -->
					<div class="flex items-center justify-end gap-3 pb-8">
						<Button type="button" variant="outline" onclick={cancelEdit}>
							Ακύρωση
						</Button>
						<Button type="submit" disabled={saving} class="gap-2">
							<Save class="h-4 w-4" />
							{saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
						</Button>
					</div>
				</div>
			</form>
		{:else}
			<!-- ==================== VIEW MODE ==================== -->
			<div class="space-y-6">
				<!-- SALES OVERVIEW -->
				<Card.Root class="overflow-hidden rounded-2xl border-border">
					<Card.Header class="border-b border-border bg-muted/30 pb-4">
						<div class="flex items-center gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
								<TrendingUp class="h-4 w-4 text-primary" />
							</div>
							<div>
								<Card.Title class="text-lg text-foreground">Πωλήσεις & Ταμείο</Card.Title>
								<Card.Description>Ανάλυση εσόδων ανά μέθοδο πληρωμής</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="p-0">
						<div class="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
							<!-- Left: Sales Breakdown -->
							<div class="space-y-1 p-6">
								<div class="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 dark:bg-muted/20">
									<span class="text-sm text-muted-foreground">Συνολικές Πωλήσεις</span>
									<span class="font-mono text-base font-bold tabular-nums text-foreground">{formatCurrency(closing.total_sales)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="flex items-center gap-2 text-sm text-muted-foreground">
										<CreditCard class="h-3.5 w-3.5" /> Κάρτες/POS
									</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.card_sales)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="flex items-center gap-2 text-sm text-muted-foreground">
										<Euro class="h-3.5 w-3.5" /> Μετρητά
									</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(cashSales)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="flex items-center gap-2 text-sm text-muted-foreground">
										<UtensilsCrossed class="h-3.5 w-3.5 text-red-400" /> e-Food
									</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.efood_sales)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="flex items-center gap-2 text-sm text-muted-foreground">
										<Bike class="h-3.5 w-3.5 text-blue-400" /> Wolt
									</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.wolt_sales)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="flex items-center gap-2 text-sm text-muted-foreground">
										<Smartphone class="h-3.5 w-3.5" /> Ψηφιακές
									</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.other_digital_sales)}</span>
								</div>
							</div>

							<!-- Right: Cash & Expenses Summary -->
							<div class="space-y-1 p-6">
								<div class="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 dark:bg-muted/20">
									<span class="text-sm text-muted-foreground">Εξερχόμενα Ημέρας</span>
									<span class="font-mono text-base font-bold tabular-nums text-foreground">
										{formatCurrency(closing.total_supplier_payments + closing.total_expenses)}
									</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="text-sm text-muted-foreground">Πληρωμές Προμηθευτών</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.total_supplier_payments)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="text-sm text-muted-foreground">Έξοδα</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.total_expenses)}</span>
								</div>

								<Separator class="my-2" />

								<div class="flex items-center justify-between px-3 py-2">
									<span class="text-sm text-muted-foreground">Μετρητά μετά τα έξοδα</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.excepted_cash)}</span>
								</div>
								<div class="flex items-center justify-between px-3 py-2">
									<span class="text-sm text-muted-foreground">Πάγιο Ημέρας</span>
									<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.opening_float)}</span>
								</div>

								<Separator class="my-2" />

								<div class="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2.5 dark:bg-primary/10">
									<span class="text-sm font-semibold text-foreground">Αναμενόμενα στο Ταμείο</span>
									<span class="font-mono text-base font-bold tabular-nums text-primary">{formatCurrency(closing.final_cash_balance)}</span>
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- FINAL CASH SECTION -->
				<div class="grid gap-6 sm:grid-cols-2">
					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<Card.Title class="text-base text-foreground">Τελικά Μετρητά</Card.Title>
							<Card.Description>Πραγματική καταμέτρηση & διαφορά</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-3 p-6">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Αναμενόμενα</span>
								<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.final_cash_balance)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Βρέθηκαν</span>
								<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.actual_cash_counted)}</span>
							</div>
							<Separator />
							<div class="flex items-center justify-between">
								<span class="text-sm font-semibold text-foreground">
									{closing.cash_diffrence >= 0 ? 'Πλεόνασμα' : 'Έλλειμμα'}
								</span>
								<Badge
									variant={closing.cash_diffrence >= 0 ? 'secondary' : 'destructive'}
									class="gap-1.5 tabular-nums {closing.cash_diffrence >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}"
								>
									{#if closing.cash_diffrence >= 0}
										<CheckIcon class="h-3 w-3" />
									{:else}
										<MoveDown class="h-3 w-3" />
									{/if}
									{formatCurrency(closing.cash_diffrence)}
								</Badge>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root class="overflow-hidden rounded-2xl border-border">
						<Card.Header class="border-b border-border bg-muted/30 pb-4">
							<Card.Title class="text-base text-foreground">Διαχείριση</Card.Title>
							<Card.Description>Κατάθεση & πάγιο επόμενης</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-3 p-6">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Κατάθεση Μετρητών</span>
								<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.cash_deposit)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Πάγιο Επόμενης</span>
								<span class="font-mono text-sm tabular-nums text-foreground">{formatCurrency(closing.tomorrow_opening_float)}</span>
							</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- SUPPLIER PAYMENTS TABLE -->
				<Card.Root class="overflow-hidden rounded-2xl border-border">
					<Card.Header class="border-b border-border bg-muted/30 pb-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
									<ShoppingCart class="h-4 w-4 text-primary" />
								</div>
								<div>
									<Card.Title class="text-lg text-foreground">Πληρωμές Προμηθευτών</Card.Title>
									<Card.Description>
										{supplierPayments.length} πληρωμή(ές)
									</Card.Description>
								</div>
							</div>
							<Badge variant="outline" class="tabular-nums">
								{formatCurrency(totalPayments)}
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="p-0">
						{#if supplierPayments.length > 0}
							<div class="overflow-x-auto">
								<Table.Root>
									<Table.Header>
										<Table.Row class="border-b border-border hover:bg-transparent">
											<Table.Head class="bg-muted/30 pl-6 font-medium">Προμηθευτής</Table.Head>
											<Table.Head class="bg-muted/30 text-right font-medium">Ποσό</Table.Head>
											<Table.Head class="bg-muted/30 font-medium">Μέθοδος</Table.Head>
											<Table.Head class="bg-muted/30 font-medium">Παραστατικό</Table.Head>
											<Table.Head class="bg-muted/30 pr-6 font-medium">Σημειώσεις</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each supplierPayments as payment (payment.id)}
											<Table.Row class="hover:bg-muted/30">
												<Table.Cell class="pl-6 font-medium text-foreground">
													{payment.supplier_name || '-'}
												</Table.Cell>
												<Table.Cell class="text-right font-mono font-semibold tabular-nums text-foreground">
													{formatCurrency(payment.amount)}
												</Table.Cell>
												<Table.Cell class="capitalize text-muted-foreground">
													{paymentMethods.find((m) => m.value === payment.payment_method)?.label || payment.payment_method?.replace('_', ' ')}
												</Table.Cell>
												<Table.Cell class="text-muted-foreground">
													{payment.invoice_number || '-'}
												</Table.Cell>
												<Table.Cell class="max-w-[200px] truncate pr-6 text-muted-foreground">
													{payment.notes || '-'}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{:else}
							<div class="flex items-center justify-center py-10">
								<p class="text-sm text-muted-foreground">Δεν υπάρχουν πληρωμές προμηθευτών</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- EXPENSES TABLE -->
				<Card.Root class="overflow-hidden rounded-2xl border-border">
					<Card.Header class="border-b border-border bg-muted/30 pb-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
									<Zap class="h-4 w-4 text-primary" />
								</div>
								<div>
									<Card.Title class="text-lg text-foreground">Έξοδα</Card.Title>
									<Card.Description>
										{expenses.length} έξοδο(α)
									</Card.Description>
								</div>
							</div>
							<Badge variant="outline" class="tabular-nums">
								{formatCurrency(totalExpenses)}
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="p-0">
						{#if expenses.length > 0}
							<div class="overflow-x-auto">
								<Table.Root>
									<Table.Header>
										<Table.Row class="border-b border-border hover:bg-transparent">
											<Table.Head class="bg-muted/30 pl-6 font-medium">Κατηγορία</Table.Head>
											<Table.Head class="bg-muted/30 font-medium">Περιγραφή</Table.Head>
											<Table.Head class="bg-muted/30 pr-6 text-right font-medium">Ποσό</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each expenses as expense (expense.id)}
											<Table.Row class="hover:bg-muted/30">
												<Table.Cell class="pl-6 font-medium capitalize text-foreground">
													{expenseCategories.find((c) => c.value === expense.expense_category)?.label || expense.expense_category || '-'}
												</Table.Cell>
												<Table.Cell class="text-muted-foreground">
													{expense.description || '-'}
												</Table.Cell>
												<Table.Cell class="pr-6 text-right font-mono font-semibold tabular-nums text-foreground">
													{formatCurrency(expense.amount)}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{:else}
							<div class="flex items-center justify-center py-10">
								<p class="text-sm text-muted-foreground">Δεν υπάρχουν έξοδα</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	</main>
</div>
