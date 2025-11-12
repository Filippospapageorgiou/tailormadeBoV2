<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Banknote from '@lucide/svelte/icons/banknote';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Zap from '@lucide/svelte/icons/zap';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Alert from '$lib/components/ui/alert';
	import * as Table from '$lib/components/ui/table';
	import { formatCurrency, formatDate } from '$lib/utils';

	let { data }: PageProps = $props();

	const { closing, closedByProfile, supplierPayments, expenses } = data;

	// Calculated values
	let cashDifference = $derived(closing.cash_diffrence || 0);
	let hasCashDiscrepancy = $derived(Math.abs(cashDifference) > 5); // Alert if > 5 EUR
	let cashStatus = $derived(
		Math.abs(cashDifference) < 0.5
			? 'Accurate'
			: Math.abs(cashDifference) < 5
				? 'Minor Difference'
				: 'Significant Discrepancy'
	);

	let statusBadgeColor = $derived.by(() => {
		switch (closing.status) {
			case 'draft':
				return 'bg-amber-100 text-amber-800 border-amber-300';
			case 'submitted':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case 'reviewed':
				return 'bg-green-100 text-green-800 border-green-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	});

	let statusLabel = $derived.by(() => {
		switch (closing.status) {
			case 'draft':
				return 'Draft';
			case 'submitted':
				return 'Submitted';
			case 'reviewed':
				return 'Reviewed';
			default:
				return 'Unknown';
		}
	});

	// Payment methods breakdown
	let paymentMethods = $derived.by(() => {
		return [
			{ method: 'Cash Sales', amount: closing.excepted_cash || 0 },
			{ method: 'Card Sales', amount: closing.card_sales || 0 },
			{ method: 'Wolt', amount: closing.wolt_sales || 0 },
			{ method: 'eFood', amount: closing.efood_sales || 0 },
			{ method: 'Other Digital', amount: closing.other_digital_sales || 0 },
		];
	});

	// Expense categories breakdown
	let expensesByCategory = $derived.by(() => {
		const map = new Map<string | null, number>();
		expenses.forEach((exp) => {
			const category = exp.expense_category || 'Uncategorized';
			map.set(category, (map.get(category) || 0) + exp.amount);
		});
		return Array.from(map, ([category, total]) => ({ category, total }));
	});

	// Total expenses
	let totalExpenses = $derived(expenses.reduce((sum, exp) => sum + exp.amount, 0));
	let totalSupplierPayments = $derived(
		supplierPayments.reduce((sum, payment) => sum + payment.amount, 0)
	);

	function handleBack() {
		goto('/app/settings/register_settings');
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-6xl px-4 py-6 md:px-6">
		<!-- Header with Back Button -->
		<div class="mb-8 flex items-center gap-4">
			<Button
				variant="outline"
				size="icon"
				onclick={handleBack}
				class="rounded-lg border border-border hover:bg-muted"
			>
				<ArrowLeftIcon class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-semibold tracking-tight text-foreground">
					Register Closing Details
				</h1>
				<p class="text-sm text-muted-foreground">
					{formatDate(closing.closing_date)}
				</p>
			</div>
		</div>

		<!-- Status and Quick Info -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
			<!-- Status Card -->
			<Card.Root class="border border-border">
				<Card.Content class="pt-6">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Status</p>
						<div
							class={`inline-block rounded-full border px-4 py-1 text-sm font-medium ${statusBadgeColor}`}
						>
							{statusLabel}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Cash Status Card -->
			<Card.Root
				class={`border ${
					hasCashDiscrepancy ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
				}`}
			>
				<Card.Content class="pt-6">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Cash Status</p>
						<div class="flex items-center gap-2">
							{#if hasCashDiscrepancy}
								<AlertCircleIcon class="h-5 w-5 text-red-600" />
								<span class="font-semibold text-red-700">{cashStatus}</span>
							{:else}
								<CheckCircleIcon class="h-5 w-5 text-green-600" />
								<span class="font-semibold text-green-700">{cashStatus}</span>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground">
							Difference: <span
								class={hasCashDiscrepancy ? 'font-semibold text-red-600' : 'text-green-600'}
							>
								{formatCurrency(Math.abs(cashDifference))}
							</span>
						</p>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Closed By Card -->
			<Card.Root class="border border-border">
				<Card.Content class="pt-6">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Closed By</p>
						<div class="flex items-center gap-2">
							<User class="h-4 w-4 text-muted-foreground" />
							<span class="font-medium text-foreground">
								{closedByProfile?.username || 'Unknown'}
							</span>
						</div>
						<p class="text-xs text-muted-foreground">
							{closedByProfile?.email || 'N/A'}
						</p>
					</div>
				</Card.Content>
			</Card.Root>
			
		</div>

		<!-- Main Content Tabs -->
		<Tabs.Root value="sales" class="space-y-6">
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="sales">Sales & Cash</Tabs.Trigger>
				<Tabs.Trigger value="suppliers">Supplier Payments</Tabs.Trigger>
				<Tabs.Trigger value="expenses">Expenses</Tabs.Trigger>
			</Tabs.List>

			<!-- Sales & Cash Tab -->
			<Tabs.Content value="sales" class="space-y-6">
				<!-- Sales Summary Section -->
				<Card.Root class="border border-border">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<TrendingUp class="h-5 w-5 text-primary" />
							Sales Summary
						</Card.Title>
						<Card.Description>Revenue breakdown by payment method</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							{#each paymentMethods as { method, amount }}
								<div class="flex items-center justify-between border-b border-border pb-3 last:border-0">
									<div class="flex items-center gap-3">
										{#if method === 'Cash Sales'}
											<Banknote class="h-4 w-4 text-muted-foreground" />
										{:else if method === 'Card Sales'}
											<CreditCard class="h-4 w-4 text-muted-foreground" />
										{:else}
											<Zap class="h-4 w-4 text-muted-foreground" />
										{/if}
										<span class="text-sm font-medium text-foreground">{method}</span>
									</div>
									<span class="font-semibold text-foreground">{formatCurrency(amount)}</span>
								</div>
							{/each}
							<div class="mt-4 border-t-2 border-border pt-4">
								<div class="flex items-center justify-between">
									<span class="text-base font-semibold text-foreground">Total Sales</span>
									<span class="text-lg font-bold text-primary">
										{formatCurrency(closing.total_sales || 0)}
									</span>
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Cash Handling Section -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Expected vs Actual -->
					<Card.Root class="border border-border">
						<Card.Header>
							<Card.Title class="text-base">Cash Count</Card.Title>
							<Card.Description>Opening float and actual cash</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="space-y-3">
								<div class="flex justify-between">
									<span class="text-sm text-muted-foreground">Opening Float</span>
									<span class="font-semibold text-foreground">
										{formatCurrency(closing.opening_float || 0)}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-muted-foreground">Expected Cash</span>
									<span class="font-semibold text-foreground">
										{formatCurrency(closing.final_cash_balance || 0)}
									</span>
								</div>
								<div class="border-t border-border pt-3">
									<div class="flex justify-between">
										<span class="text-sm font-medium text-foreground">Actual Cash Counted</span>
										<span class="font-bold text-primary">
											{formatCurrency(closing.actual_cash_counted || 0)}
										</span>
									</div>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Cash Difference Analysis -->
					<Card.Root class={`border ${hasCashDiscrepancy ? 'border-red-200' : 'border-green-200'}`}>
						<Card.Header>
							<Card.Title class="text-base">Difference Analysis</Card.Title>
							<Card.Description>Cash variance and deposit</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="space-y-3">
								<div class="flex justify-between">
									<span class="text-sm text-muted-foreground">Cash Difference</span>
									<span
										class={`font-bold ${
											cashDifference >= 0 ? 'text-green-600' : 'text-red-600'
										}`}
									>
										{cashDifference >= 0 ? '+' : ''}{formatCurrency(cashDifference)}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-muted-foreground">Deposit</span>
									<span class="font-semibold text-foreground">
										{formatCurrency(closing.cash_deposit || 0)}
									</span>
								</div>
								<div class="border-t border-border pt-3">
									<div class="flex justify-between">
										<span class="text-sm font-medium text-foreground">Tomorrow's Opening Float</span>
										<span class="font-bold text-primary">
											{formatCurrency(closing.tomorrow_opening_float || 0)}
										</span>
									</div>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Notes Section -->
				{#if closing.notes}
					<Card.Root class="border border-border">
						<Card.Header>
							<Card.Title class="text-base">Notes</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-foreground whitespace-pre-wrap">{closing.notes}</p>
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>

			<!-- Supplier Payments Tab -->
			<Tabs.Content value="suppliers" class="space-y-6">
				<Card.Root class="border border-border">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<ShoppingCart class="h-5 w-5 text-primary" />
							Supplier Payments
						</Card.Title>
						<Card.Description>
							{supplierPayments.length} payment(s) • Total: {formatCurrency(totalSupplierPayments)}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if supplierPayments.length > 0}
							<div class="overflow-hidden rounded-lg border border-border">
								<Table.Root>
									<Table.Header>
										<Table.Row class="border-b border-border hover:bg-transparent">
											<Table.Head class="bg-muted/50 font-semibold">Supplier</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Amount</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Method</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Invoice</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Notes</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each supplierPayments as payment (payment.id)}
											<Table.Row class="border-b border-border hover:bg-muted/30">
												<Table.Cell class="text-sm font-medium">
													{payment.supplier_name || 'N/A'}
												</Table.Cell>
												<Table.Cell class="font-semibold text-primary">
													{formatCurrency(payment.amount)}
												</Table.Cell>
												<Table.Cell class="text-sm text-muted-foreground">
													{payment.payment_method
														? payment.payment_method.replace('_', ' ').toUpperCase()
														: 'N/A'}
												</Table.Cell>
												<Table.Cell class="text-sm text-muted-foreground">
													{payment.invoice_number || '—'}
												</Table.Cell>
												<Table.Cell class="max-w-xs truncate text-sm text-muted-foreground">
													{payment.notes || '—'}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{:else}
							<div class="flex items-center justify-center py-8">
								<p class="text-sm text-muted-foreground">No supplier payments recorded</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<!-- Expenses Tab -->
			<Tabs.Content value="expenses" class="space-y-6">
				<Card.Root class="border border-border">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Zap class="h-5 w-5 text-primary" />
							Expenses
						</Card.Title>
						<Card.Description>
							{expenses.length} expense(s) • Total: {formatCurrency(totalExpenses)}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if expensesByCategory.length > 0}
							<div class="space-y-6">
								<!-- Category Summary -->
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									{#each expensesByCategory as { category, total }}
										<Card.Root class="border border-border bg-muted/30">
											<Card.Content class="pt-6">
												<div class="space-y-2">
													<p class="text-sm font-medium text-muted-foreground">{category}</p>
													<p class="text-2xl font-bold text-primary">
														{formatCurrency(total)}
													</p>
												</div>
											</Card.Content>
										</Card.Root>
									{/each}
								</div>

								<!-- Detailed Table -->
								<div class="overflow-hidden rounded-lg border border-border">
									<Table.Root>
										<Table.Header>
											<Table.Row class="border-b border-border hover:bg-transparent">
												<Table.Head class="bg-muted/50 font-semibold">Category</Table.Head>
												<Table.Head class="bg-muted/50 font-semibold">Description</Table.Head>
												<Table.Head class="bg-muted/50 font-semibold">Amount</Table.Head>
												<Table.Head class="bg-muted/50 font-semibold">Date</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each expenses as expense (expense.id)}
												<Table.Row class="border-b border-border hover:bg-muted/30">
													<Table.Cell class="text-sm font-medium">
														{expense.expense_category || 'Uncategorized'}
													</Table.Cell>
													<Table.Cell class="max-w-xs text-sm text-muted-foreground">
														{expense.description || '—'}
													</Table.Cell>
													<Table.Cell class="font-semibold text-primary">
														{formatCurrency(expense.amount)}
													</Table.Cell>
													<Table.Cell class="text-sm text-muted-foreground">
														{formatDate(expense.created_at)}
													</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-center py-8">
								<p class="text-sm text-muted-foreground">No expenses recorded</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>

		<!-- Financial Summary Footer -->
		<Card.Root class="border border-border bg-muted/50">
			<Card.Header>
				<Card.Title class="text-base">Financial Summary</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Total Sales</p>
						<p class="text-2xl font-bold text-foreground">
							{formatCurrency(closing.total_sales || 0)}
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Total Payments & Expenses</p>
						<p class="text-2xl font-bold text-foreground">
							{formatCurrency(totalSupplierPayments + totalExpenses)}
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Net Balance</p>
						<p class="text-2xl font-bold text-primary">
							{formatCurrency((closing.total_sales || 0) - totalSupplierPayments - totalExpenses)}
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</main>
</div>