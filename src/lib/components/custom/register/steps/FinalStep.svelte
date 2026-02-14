<!-- src/lib/components/custom/register/steps/FinalStep.svelte -->
<script lang="ts">
	import { DollarSign, Banknote, PiggyBank, Landmark } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { getSalesRegister } from '$lib/stores/register.svelte';

	let sales = getSalesRegister();

	// Format currency helper
	function formatCurrency(amount: number): string {
		return `€${amount.toFixed(2)}`;
	}

	let actual_cash_counted = $state(0);
	let deposit = $derived(sales.actualCashCounted - sales.tommorow_opening_float)
	$effect(() => {
		if(actual_cash_counted){
			sales.actualCashCounted = actual_cash_counted;
		}
		if(deposit){
			sales.cash_deposit = deposit;
		}
	})


</script>
<div class="space-y-6">
	<!-- Summary Overview Card -->
	<Card.Root class="rounded-xl border-border/60 shadow-sm">
		<Card.Header class="pb-4">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<DollarSign class="h-5 w-5 text-primary" />
				</div>
				<div>
					<Card.Title class="text-lg font-semibold text-foreground">Συνοπτική Επισκόπηση</Card.Title>
					<Card.Description class="text-sm">Έλεγχος όλων των στοιχείων πριν την υποβολή</Card.Description>
				</div>
			</div>
		</Card.Header>
        <Card.Content class="space-y-5">
			<!-- Summary rows -->
			<div class="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-4">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Συνολικές Πωλήσεις:</span>
					<span class="font-medium tabular-nums">{formatCurrency(sales.totalSales)}</span>
				</div>

				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Ψηφιακές Πληρωμές:</span>
					<span class="font-medium tabular-nums">{formatCurrency(sales.digital)}</span>
				</div>

				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Πληρωμές Προμηθευτών (μετρητά):</span>
					<span class="font-medium tabular-nums">{formatCurrency(sales.totalSupplierPayments)}</span>
				</div>

				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Έξοδα:</span>
					<span class="font-medium tabular-nums">{formatCurrency(sales.totalExpenses)}</span>
				</div>

				<Separator />

				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Πάγιο Σήμερα:</span>
					<span class="font-medium tabular-nums">{formatCurrency(sales.openingFloat)}</span>
				</div>

				<div class="flex justify-between rounded-md bg-primary/5 p-2.5">
					<span class="font-medium text-foreground">Αναμενόμενα Μετρητά:</span>
					<span class="text-lg font-semibold tabular-nums text-primary">
						{formatCurrency(sales.expectedFinal)}
					</span>
				</div>
			</div>

		<Separator />

		<!-- Actual Cash Counted -->
		<div class="space-y-2">
			<Label for="actual_cash" class="text-sm font-medium text-foreground">
				Πραγματικά Μετρητά που Μέτρησες *
			</Label>
			<div class="relative">
				<Banknote class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
				<Input
					type="number"
					bind:value={actual_cash_counted}
					placeholder="0.00"
					min="0"
					step="0.01"
					class="pl-10 text-lg"
					required
				/>
			</div>
			<p class="text-xs text-muted-foreground">Μέτρησε τα μετρητά στο ταμείο και καταχώρησε το ποσό</p>
		</div>

		<Separator />

		<!-- Tomorrow's Float & Deposit -->
		<div class="space-y-4">
			<h3 class="text-sm font-medium text-foreground">Διαχείριση Μετρητών</h3>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="tomorrow_float" class="text-sm text-muted-foreground">
						Πάγιο Αυριανής *
					</Label>
					<div class="relative">
						<PiggyBank class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							type="number"
							bind:value={sales.tommorow_opening_float}
							placeholder="0.00"
							min="0"
							step="0.01"
							class="pl-10"
							required
						/>
					</div>
					<p class="text-xs text-muted-foreground">Το ποσό που θα παραμείνει στο ταμείο</p>
				</div>

				<div class="space-y-1.5">
					<Label for="cash_deposit" class="text-sm text-muted-foreground">
						Κατάθεση Τράπεζας *
					</Label>
					<div class="relative">
						<Landmark class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							id="cash_deposit"
							type="number"
							bind:value={sales.cash_deposit}
							placeholder="0.00"
							min="0"
							step="0.01"
							class="pl-10"
							required
						/>
					</div>
					<p class="text-xs text-muted-foreground">Το ποσό που θα κατατεθεί</p>
				</div>
			</div>
        </div>
        </Card.Content>
	</Card.Root>
</div>
