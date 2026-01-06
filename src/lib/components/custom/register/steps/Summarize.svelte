<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { getSalesRegister } from '$lib/stores/register.svelte';
	import { Pen, Check, X, Euro, TrendingUp, TrendingDown } from 'lucide-svelte';

	let sales = getSalesRegister();

	let editOpen = $state(false);
	let tempOpeningFloat = $state(0);

	function toggleEdit() {
		if (editOpen) {
			sales.openingFloat = parseFloat(tempOpeningFloat.toString());
		} else {
			tempOpeningFloat = sales.openingFloat;
		}
		editOpen = !editOpen;
	}

	function cancelEdit() {
		editOpen = false;
		tempOpeningFloat = sales.openingFloat;
	}

	function formatCurrency(value: any): string {
		const num = Number(value);
		if (isNaN(num) || value === null || value === undefined) {
			return '0.00';
		}
		return num.toFixed(2);
	}

	// Calculate discrepancy (if actual vs expected differs)
	let discrepancy = $derived(sales.getActualCashCounted() - sales.expectedFinal);
	let hasDiscrepancy = $derived(Math.abs(discrepancy) > 0.01);
</script>

<Card.Root class="rounded-2xl shadow-sm">
	<Card.Header class="pb-3">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="text-xl text-foreground">Συνοψή Ταμείου</Card.Title>
				<Card.Description class="text-xs text-muted-foreground">
					Συγκεντρωτική εικόνα ημέρας
				</Card.Description>
			</div>
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
				<Euro class="h-5 w-5 text-muted-foreground" />
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Sales Section -->
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Πωλήσεις</p>

			<div class="flex items-center justify-between rounded-lg bg-muted p-3">
				<span class="text-sm text-muted-foreground">Συνολικό Τάμειο</span>
				<span class="font-mono text-base font-semibold text-foreground">
					€{formatCurrency(sales.totalSales)}
				</span>
			</div>

			<div class="flex items-center justify-between pl-3">
				<span class="text-xs text-muted-foreground">Ηλεκτρονικά (Κάρτες, Wolt, efood)</span>
				<span class="font-mono text-sm text-foreground">
					€{formatCurrency(sales.digital)}
				</span>
			</div>
		</div>

		<Separator />

		<!-- Expenses Section -->
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Εξερχόμενα</p>

			<div class="space-y-1.5">
				<div class="flex items-center justify-between pl-3">
					<span class="text-xs text-muted-foreground">Πληρωμές Προμηθευτών</span>
					<span class="font-mono text-sm text-foreground">
						-€{formatCurrency(sales.totalSupplierPayments)}
					</span>
				</div>

				<div class="flex items-center justify-between pl-3">
					<span class="text-xs text-muted-foreground">Γενικά Έξοδα</span>
					<span class="font-mono text-sm text-foreground">
						-€{formatCurrency(sales.totalExpenses)}
					</span>
				</div>
			</div>
		</div>

		<Separator />

		<!-- Cash Calculation Section -->
		<div class="space-y-3">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
				Υπολογισμός Μετρητών
			</p>

			<div class="flex items-center justify-between rounded-lg bg-muted p-3">
				<span class="text-sm font-medium text-foreground">Αναμενόμενα Μετρητά</span>
				<span class="font-mono text-base font-semibold text-foreground">
					€{formatCurrency(sales.expectedCash)}
				</span>
			</div>

			<!-- Opening Float with Edit -->
			<div
				class="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors {editOpen
					? 'border-foreground/40 bg-muted'
					: ''}"
			>
				<span class="text-sm text-muted-foreground">Πάγιο Ταμείου</span>

				<div class="flex items-center gap-2">
					{#if editOpen}
						<Input
							type="number"
							step="0.01"
							class="h-8 w-24 text-right font-mono text-sm"
							bind:value={tempOpeningFloat}
						/>
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background transition hover:bg-foreground/90"
							onclick={toggleEdit}
							title="Αποθήκευση"
						>
							<Check class="h-4 w-4" />
						</button>
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition hover:bg-muted/80"
							onclick={cancelEdit}
							title="Ακύρωση"
						>
							<X class="h-4 w-4" />
						</button>
					{:else}
						<span class="font-mono text-sm font-semibold text-foreground">
							€{formatCurrency(sales.openingFloat)}
						</span>
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-muted"
							onclick={toggleEdit}
							title="Επεξεργασία"
						>
							<Pen class="h-4 w-4 text-muted-foreground" />
						</button>
					{/if}
				</div>
			</div>

			<div class="flex items-center justify-between rounded-lg bg-muted p-3">
				<span class="text-sm font-medium text-foreground">Αναμενόμενο Σύνολο</span>
				<span class="font-mono text-lg font-bold text-foreground">
					€{formatCurrency(sales.expectedFinal)}
				</span>
			</div>
		</div>

		<Separator class="my-4" />

		<!-- Actual Cash Count Section -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Καταμέτρηση</p>
				{#if hasDiscrepancy && sales.getActualCashCounted() > 0}
					<Badge variant="secondary" class="bg-muted text-xs text-foreground">
						{#if discrepancy > 0}
							<TrendingUp class="mr-1 h-3 w-3 text-green-500" />
						{:else}
							<TrendingDown class="mr-1 h-3 w-3 text-red-500" />
						{/if}
						€{formatCurrency(Math.abs(discrepancy))}
					</Badge>
				{/if}
			</div>

			<div
				class="flex items-center justify-between rounded-lg border-2 border-border bg-muted p-3"
			>
				<span class="text-sm font-medium text-foreground"> Πραγματικά Μετρητά </span>
				<span class="font-mono text-lg font-bold text-foreground">
					€{formatCurrency(sales.getActualCashCounted())}
				</span>
			</div>

			{#if hasDiscrepancy && sales.getActualCashCounted() > 0}
				<div class="rounded-md bg-muted p-2 text-xs text-foreground">
					<p class="font-medium">
						{discrepancy > 0 ? 'Πλεόνασμα' : 'Έλλειμμα'}
						€{formatCurrency(Math.abs(discrepancy))}
					</p>
					<p class="mt-1 text-muted-foreground">
						{discrepancy > 0
							? 'Βρέθηκαν περισσότερα μετρητά από το αναμενόμενο'
							: 'Βρέθηκαν λιγότερα μετρητά από το αναμενόμενο'}
					</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>