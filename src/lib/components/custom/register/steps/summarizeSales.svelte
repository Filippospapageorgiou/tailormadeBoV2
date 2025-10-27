<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	interface Props {
		expectedCash?:number;
	}

	let { expectedCash = $bindable(0) }:Props = $props();

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
	<Card.Content class="space-y-6">
		<Separator />
		<div>
			Αναμένομενα μέτρητα : {expectedCash}
		</div>
	</Card.Content>
</Card.Root>
