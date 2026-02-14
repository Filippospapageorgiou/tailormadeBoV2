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

<Card.Root class="rounded-xl border-border/60 shadow-sm lg:sticky lg:top-8">
	<Card.Header class="pb-3">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="text-lg font-semibold text-foreground">Συνοψή Ταμείου</Card.Title>
				<Card.Description class="text-xs text-muted-foreground">
					Συγκεντρωτική εικόνα ημέρας
				</Card.Description>
			</div>
			<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
				<Euro class="h-4.5 w-4.5 text-primary" />
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<!-- Sales Section -->
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Πωλήσεις</p>

			<div class="flex items-center justify-between rounded-lg bg-muted/60 p-3">
				<span class="text-sm text-muted-foreground">Συνολικό Τάμειο</span>
				<span class="font-mono text-sm font-semibold tabular-nums text-foreground">
					€{formatCurrency(sales.totalSales)}
				</span>
			</div>

			<div class="flex items-center justify-between px-3">
				<span class="text-xs text-muted-foreground">Ηλεκτρονικά (Κάρτες, Wolt, efood)</span>
				<span class="font-mono text-xs tabular-nums text-foreground">
					€{formatCurrency(sales.digital)}
				</span>
			</div>
		</div>

		<Separator />

		<!-- Expenses Section -->
		<div class="space-y-2">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Εξερχόμενα</p>

			<div class="space-y-1.5">
				<div class="flex items-center justify-between px-3">
					<span class="text-xs text-muted-foreground">Πληρωμές Προμηθευτών</span>
					<span class="font-mono text-xs tabular-nums text-foreground">
						-€{formatCurrency(sales.totalSupplierPayments)}
					</span>
				</div>

				<div class="flex items-center justify-between px-3">
					<span class="text-xs text-muted-foreground">Γενικά Έξοδα</span>
					<span class="font-mono text-xs tabular-nums text-foreground">
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

			<div class="flex items-center justify-between rounded-lg bg-muted/60 p-3">
				<span class="text-sm text-muted-foreground">Αναμενόμενα Μετρητά</span>
				<span class="font-mono text-sm font-semibold tabular-nums text-foreground">
					€{formatCurrency(sales.expectedCash)}
				</span>
			</div>

			<!-- Opening Float with Edit -->
			<div
				class="flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors
					{editOpen ? 'border-primary/40 bg-muted/40' : 'bg-card'}"
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
							class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onclick={toggleEdit}
							title="Αποθήκευση"
						>
							<Check class="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onclick={cancelEdit}
							title="Ακύρωση"
						>
							<X class="h-3.5 w-3.5" />
						</button>
					{:else}
						<span class="font-mono text-sm font-semibold tabular-nums text-foreground">
							€{formatCurrency(sales.openingFloat)}
						</span>
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onclick={toggleEdit}
							title="Επεξεργασία"
						>
							<Pen class="h-3.5 w-3.5 text-muted-foreground" />
						</button>
					{/if}
				</div>
			</div>

			<div class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
				<span class="text-sm font-medium text-foreground">Αναμενόμενο Σύνολο</span>
				<span class="font-mono text-base font-bold tabular-nums text-primary">
					€{formatCurrency(sales.expectedFinal)}
				</span>
			</div>
		</div>

		<Separator />

		<!-- Actual Cash Count Section -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Καταμέτρηση</p>
				{#if hasDiscrepancy && sales.getActualCashCounted() > 0}
					<Badge variant="secondary" class="text-xs tabular-nums">
						{#if discrepancy > 0}
							<TrendingUp class="mr-1 h-3 w-3 text-green-600 dark:text-green-400" />
						{:else}
							<TrendingDown class="mr-1 h-3 w-3 text-red-600 dark:text-red-400" />
						{/if}
						€{formatCurrency(Math.abs(discrepancy))}
					</Badge>
				{/if}
			</div>

			<div
				class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/60 p-3"
			>
				<span class="text-sm font-medium text-foreground"> Πραγματικά Μετρητά </span>
				<span class="font-mono text-base font-bold tabular-nums text-foreground">
					€{formatCurrency(sales.getActualCashCounted())}
				</span>
			</div>

			{#if hasDiscrepancy && sales.getActualCashCounted() > 0}
				<div class="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs">
					<p class="font-medium text-foreground">
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
