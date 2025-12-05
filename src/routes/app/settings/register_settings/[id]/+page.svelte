<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { CheckIcon, Euro, MoveDown } from 'lucide-svelte';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Zap from '@lucide/svelte/icons/zap';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import { formatCurrency, formatDate } from '$lib/utils';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let { data }: PageProps = $props();

	const { closing, closedByProfile, supplierPayments, expenses } = data;

	// Helper to sum arrays for headers
	const totalPayments = supplierPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
	const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

	// Add this in your script section
	const totalDigital =
		closing.card_sales + closing.wolt_sales + closing.efood_sales + closing.other_digital_sales;
	const cashSales = closing.total_sales - totalDigital;

	function handleBack() {
		goto('/app/settings/register_settings');
	}
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto max-w-6xl px-4 py-6 md:px-6">
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

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="flex flex-row items-center justify-start space-x-3 p-4">
				<div class="relative">
					<Avatar.Root
						class="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-200 dark:border-slate-950 dark:ring-slate-800"
					>
						<Avatar.Image src={closedByProfile.image_url} alt={closedByProfile.username} />
						<Avatar.Fallback
							class="bg-slate-100 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							{closedByProfile.username?.charAt(0).toUpperCase()}
						</Avatar.Fallback>
					</Avatar.Root>
				</div>
				<div class="flex flex-col">
					<span class="text-xs text-slate-500">Κλείσιμο από</span>
					<p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
						{closedByProfile.username}
					</p>
					<p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
						{closedByProfile.email}
					</p>
				</div>
			</div>

			<div class="flex flex-col items-start justify-center p-4">
				<span class="text-xs text-slate-500">Ημερομηνία & Κατάσταση</span>
				<div class="flex items-center gap-2">
					<p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{formatDate(closing.closing_date)}
					</p>
				</div>
			</div>

			<div class="flex flex-col items-start justify-center p-4">
				<h4 class="text-xs text-slate-500">Συνολίκο Τάμειο</h4>
				<p class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
					{formatCurrency(closing.total_sales)}
				</p>
			</div>
		</div>

		<Tabs.Root value="sales" class="space-y-6">
			<Tabs.List class="grid h-auto w-full grid-cols-1 gap-2 md:grid-cols-3">
				<Tabs.Trigger value="sales">Τάμειο & Πώλησεις</Tabs.Trigger>
				<Tabs.Trigger value="suppliers">Πλήρωμες Προμηθευτών</Tabs.Trigger>
				<Tabs.Trigger value="expenses">Έξοδα</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="sales" class="space-y-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Field.Group class="rounded-lg px-6 py-6 shadow-lg">
						<Field.Set>
							<Field.Legend>
								<TrendingUp class="h-5 w-5 text-primary" />
								Πώλησεις σύνοψη
							</Field.Legend>
							<Field.Description>Ανάλυση εσόδων ανά μέθοδο πληρωμής</Field.Description>
							<Field.Group>
								<Field.Label>Συνολίκες Πώλησεις: {formatCurrency(closing.total_sales)}</Field.Label>
								<Field.Label>Πώλησεις κάρτες/POS: {formatCurrency(closing.card_sales)}</Field.Label>
								<Field.Label>Πώλησεις Μέτρητων: {formatCurrency(cashSales)}</Field.Label>
								<Field.Label>EFOOD: {formatCurrency(closing.wolt_sales)}</Field.Label>
								<Field.Label>WOLT: {formatCurrency(closing.efood_sales)}</Field.Label>
								<Field.Label
									>Ηλεκτρωνικές Πωλήσεις: {formatCurrency(closing.other_digital_sales)}</Field.Label
								>
							</Field.Group>
						</Field.Set>
					</Field.Group>
					<Field.Group class="rounded-lg px-6 py-6 shadow-lg">
						<Field.Set>
							<Field.Legend>
								<Euro class="h-5 w-5 text-primary" />
								Εξόδα ημέρας σύνοψη
							</Field.Legend>
							<Field.Description
								>Ανάλυση εξόδων ημέρας πληρομές Προμηθευτών και σύνολο</Field.Description
							>
							<Field.Group>
								<Field.Label
									>Συνολίκες Πλήρωμες Προμηθευτών: {formatCurrency(
										closing.total_supplier_payments
									)}</Field.Label
								>
								<Field.Label
									>Συνολίκες Πλήρωμες εξόδων: {formatCurrency(closing.total_expenses)}</Field.Label
								>

								<Separator />
								<Field.Label>
									Μέτρητα μέτα τα έξοδα {formatCurrency(closing.excepted_cash)}
								</Field.Label>
								<Field.Label>
									Πάγιο Ημέρας {formatCurrency(closing.opening_float)}
								</Field.Label>
								<Separator />
								<Field.Label
									>Μέτρητα που πρέπει να βρεις στο τάμειο:
									{closing.final_cash_balance}
								</Field.Label>
							</Field.Group>
						</Field.Set>
					</Field.Group>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Field.Group class="rounded-lg px-6 py-6 shadow-lg">
						<Field.Set>
							<Field.Legend>Τέλικα Μέτρητα</Field.Legend>
							<Field.Description>τέλικα μέτρητα που βρήκες και πλεόναμσα/έλειμα</Field.Description>
							<Field.Group>
								<Field.Label
									>Μέτρητα που πρέπει να βρεις στο τάμειο:
									{closing.final_cash_balance}
								</Field.Label>
								<Field.Label>
									Μέτρητα που βρεθήκαν : {closing.actual_cash_counted}
								</Field.Label>
								<Separator />
								<Field.Label>
									{#if closing.cash_diffrence > 0}
										Πλεόναμσα
										<Badge variant="secondary" class="bg-green-500 text-white dark:bg-green-600">
											<CheckIcon />
											{closing.cash_diffrence}
										</Badge>
									{:else}
										Έλειμα
										<Badge variant="destructive">
											<MoveDown />
											{closing.cash_diffrence}
										</Badge>
									{/if}
								</Field.Label>
							</Field.Group>
						</Field.Set>
					</Field.Group>
					<Field.Group class="rounded-lg px-6 py-6 shadow-lg">
						<Field.Set>
							<Field.Legend>Τέλικες Καταμετρήσης</Field.Legend>
							<Field.Description>Κάταθεση μέτρητων και πάγειο επόμενης μέρας</Field.Description>
							<Field.Group>
								<Field.Label
									>Καταθέση μέτρητων:
									{closing.cash_deposit}
								</Field.Label>
								<Field.Label>
									Πάγειο έπομενης μέρας : {closing.tomorrow_opening_float}
								</Field.Label>
							</Field.Group>
						</Field.Set>
					</Field.Group>
				</div>
			</Tabs.Content>

			<Tabs.Content value="suppliers" class="space-y-6">
				<Card.Root class="border border-border">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<ShoppingCart class="h-5 w-5 text-primary" />
							Supplier Payments
						</Card.Title>
						<Card.Description>
							{supplierPayments.length} payment(s) • Total:
							<span class="font-medium text-foreground">{formatCurrency(totalPayments)}</span>
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if supplierPayments.length > 0}
							<div class="overflow-hidden rounded-lg border border-border">
								<Table.Root>
									<Table.Header>
										<Table.Row class="border-b border-border hover:bg-transparent">
											<Table.Head class="bg-muted/50 font-semibold">Supplier</Table.Head>
											<Table.Head class="bg-muted/50 text-right font-semibold">Amount</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Method</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Invoice</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Notes</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each supplierPayments as payment (payment.id)}
											<Table.Row class="hover:bg-muted/50">
												<Table.Cell class="font-medium">
													{payment.supplier_name || 'Unknown Supplier'}
												</Table.Cell>
												<Table.Cell class="text-right font-semibold tabular-nums">
													{formatCurrency(payment.amount)}
												</Table.Cell>
												<Table.Cell class="text-muted-foreground capitalize">
													{payment.payment_method?.replace('_', ' ')}
												</Table.Cell>
												<Table.Cell class="text-muted-foreground">
													{payment.invoice_number || '-'}
												</Table.Cell>
												<Table.Cell class="max-w-[200px] truncate text-muted-foreground">
													{payment.notes || '-'}
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

			<Tabs.Content value="expenses" class="space-y-6">
				<Card.Root class="border border-border">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Zap class="h-5 w-5 text-primary" />
							Expenses
						</Card.Title>
						<Card.Description>
							{expenses.length} expense(s) • Total:
							<span class="font-medium text-foreground">{formatCurrency(totalExpenses)}</span>
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if expenses.length > 0}
							<div class="overflow-hidden rounded-lg border border-border">
								<Table.Root>
									<Table.Header>
										<Table.Row class="border-b border-border hover:bg-transparent">
											<Table.Head class="bg-muted/50 font-semibold">Category</Table.Head>
											<Table.Head class="bg-muted/50 font-semibold">Description</Table.Head>
											<Table.Head class="bg-muted/50 text-right font-semibold">Amount</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each expenses as expense (expense.id)}
											<Table.Row class="hover:bg-muted/50">
												<Table.Cell class="font-medium capitalize">
													{expense.expense_category}
												</Table.Cell>
												<Table.Cell class="text-muted-foreground">
													{expense.description || '-'}
												</Table.Cell>
												<Table.Cell class="text-right font-semibold tabular-nums">
													{formatCurrency(expense.amount)}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
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
	</main>
</div>
