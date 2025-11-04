<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { getSalesRegister } from '$lib/stores/register.svelte';
	import { Pen } from 'lucide-svelte';

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

</script>

<Card.Root class="border-neutral-200 shadow-sm">
	<Card.Header>
		<div class="flex items-center gap-2">
			<div>
				<Card.Title class="text-xl text-neutral-800">Συνοψή</Card.Title>
				<Card.Description>Μέτρητα - Έξοδα - Προμηθευτές - Σύνολο</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-3">
		<Separator />
		<div>
		 	Συνολίκο τάμειο : {sales.totalSales}
		</div>
		<div>
			Κάρτες-wolt-efood : {sales.digital}
		</div>
		<div>
			Συνολίκα έξοδα προμηθευτών : {sales.totalSupplierPayments}
		</div>
		<div>
			Συνολίκα γενικά εξόδα : {sales.totalExpenses}
		</div>
		<Separator />
		<div>
			Αναμένομενα τελίκα μέτρητα : {sales.expectedCash.toFixed(2)}
		</div>
		<div class="flex items-center gap-2">
			<span class="font-medium">Πάγιο:</span>

			{#if editOpen}
				<Input
					class="w-24 h-6 text-right"
					bind:value={tempOpeningFloat}
				/>
			{:else}
				<span class="w-24">{sales.openingFloat.toFixed(2)}</span>
			{/if}

			<button
				type="button"
				class="cursor-pointer rounded p-1 transition hover:bg-neutral-100"
				onclick={toggleEdit}
			>
				<Pen class="h-4 w-4 text-neutral-700" />
			</button>
		</div>
		<Separator />
		<div>
			Συνολίκα μέτρητα που πρέπει να βρεις : {sales.expectedFinal.toFixed(2)}
		</div>
		
		<div>
			Συνολίκα μέτρητα στο τάμειο : {(sales.getActualCashCounted().toFixed(2) || 0.0)}
		</div>	
	</Card.Content>
</Card.Root>