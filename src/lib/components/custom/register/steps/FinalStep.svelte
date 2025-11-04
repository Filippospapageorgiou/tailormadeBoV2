<!-- src/lib/components/custom/register/steps/FinalStep.svelte -->
<script lang="ts">
	import { DollarSign } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { getSalesRegister } from '$lib/stores/register.svelte';

	let sales = getSalesRegister();

	// Format currency helper
	function formatCurrency(amount: number): string {
		return `€${amount.toFixed(2)}`;
	}

	let actual_cash_counted = $state(0);
	$effect(() => {
		if(actual_cash_counted){
			sales.actualCashCounted = actual_cash_counted;
		}
	})
</script>

<div class="space-y-6">
	<!-- Summary Overview Card -->
	<Card.Root class="border-neutral-200 shadow-sm">
		<Card.Header>
			<div class="flex items-center gap-2">
				<div class="rounded-full bg-[#8B6B4A]/10 p-2">
					<DollarSign class="h-5 w-5 text-[#8B6B4A]" />
				</div>
				<div>
					<Card.Title class="text-xl text-neutral-800">Συνοπτική Επισκόπηση</Card.Title>
					<Card.Description>Έλεγχος όλων των στοιχείων πριν την υποβολή</Card.Description>
				</div>
			</div>
		</Card.Header>
        <Card.Content class="py-2 px-10">
        <div class="space-y-3">
			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Συνολικές Πωλήσεις:</span>
				<span class="font-medium">{formatCurrency(sales.totalSales)}</span>
			</div>

			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Ψηφιακές Πληρωμές:</span>
				<span class="font-medium">{formatCurrency(sales.digital)}</span>
			</div>

			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Πληρωμές Προμηθευτών (μετρητά):</span>
				<span class="font-medium">{formatCurrency(sales.totalSupplierPayments)}</span>
			</div>

			<div class="flex justify-between text-sm">
				<span class="text-neutral-600">Έξοδα:</span>
				<span class="font-medium">{formatCurrency(sales.totalExpenses)}</span>
			</div>

			<Separator />
            <div class="flex justify-between text-sm">
				<span class="text-neutral-600">Πάγιο Σήμερα:</span>
				<span class="font-medium">{formatCurrency(sales.openingFloat)}</span>
			</div>

			<div class="flex justify-between">
				<span class="font-semibold text-neutral-800">Αναμενόμενα Μετρητά:</span>
				<span class="text-lg font-semibold text-[#8B6B4A]">
					{formatCurrency(sales.expectedFinal)}
				</span>
			</div>
		</div>

		<Separator class="my-6" />

		<!-- Actual Cash Counted -->
		<div class="space-y-2">
			<Label for="actual_cash" class="text-base font-semibold text-neutral-800">
				Πραγματικά Μετρητά που Μέτρησες *
			</Label>
			<Input
				type="number"
				bind:value={actual_cash_counted}
				placeholder="0.00"
				min="0"
				step="0.01"
				class="text-lg"
				required
			/>
			<p class="text-xs text-neutral-500">Μέτρησε τα μετρητά στο ταμείο και καταχώρησε το ποσό</p>
		</div>

		<Separator class="my-6" />

		<!-- Tomorrow's Float & Deposit -->
		<div class="space-y-4">
			<h3 class="font-semibold text-neutral-800">Διαχείριση Μετρητών</h3>

			<div class="space-y-2">
				<Label for="tomorrow_float" class="text-sm text-neutral-700">
					Πάγιο Αυριανής *
				</Label>
				<Input
					type="number"
					bind:value={sales.tommorow_opening_float}
					placeholder="0.00"
					min="0"
					step="0.01"
					required
				/>
				<p class="text-xs text-neutral-500">Το ποσό που θα παραμείνει στο ταμείο</p>
			</div>

			<div class="space-y-2">
				<Label for="cash_deposit" class="text-sm text-neutral-700">
					Κατάθεση Τράπεζας *
				</Label>
				<Input
					id="cash_deposit"
					type="number"
					bind:value={sales.cash_deposit}
					placeholder="0.00"
					min="0"
					step="0.01"
					required
				/>
				<p class="text-xs text-neutral-500">Το ποσό που θα κατατεθεί</p>
			</div>
        </div>
        </Card.Content>
	</Card.Root>
</div>