<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	interface Props {
		expectedCash?:number;
		totalSuppliersPayments?:number;
		expectedFinal?:number;
		totalExpenses?:number;
		openingFloat?:number;
	}

	let { expectedCash = $bindable(0),
		  totalSuppliersPayments = $bindable(0),
		  expectedFinal = $bindable(0),
		  totalExpenses = $bindable(0),
		  openingFloat = $bindable(0)
	 }:Props = $props();


	
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
			Αναμένομενα μέτρητα : {expectedCash.toFixed(2)}
		</div>
		<div>
			Συνολίκα έξοδα προμηθευτών : {totalSuppliersPayments}
		</div>
		<div>
			Συνολίκα γενικά εξόδα : {totalExpenses}
		</div>
		<Separator />
		<div>
			Αναμένομενα τελίκα μέτρητα : {expectedFinal.toFixed(2)}
		</div>
		<div>
			Πάγιο : {openingFloat}
		</div>
		<Separator />
		<div>
			Συνολίκα μέτρητα που πρέπει να βρεις : {(expectedFinal + openingFloat).toFixed(2)}
		</div>
	</Card.Content>
</Card.Root>
