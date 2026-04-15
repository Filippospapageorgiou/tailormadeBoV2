<script lang="ts">
	import { getBeverageReads } from '$lib/api/blog/data.remote';
	import { Coffee } from 'lucide-svelte';
	import ReadsAreaChart from './ReadsAreaChart.svelte';

	let readsQuery = getBeverageReads();
	let reads = $derived(readsQuery?.current?.reads ?? []);
</script>

<ReadsAreaChart
	title="Ροφήματα"
	description="Αναγνώσεις συνταγών - 7 ημέρες"
	icon={Coffee as any}
	{reads}
	color="var(--color-amber-500)"
	moreHref="/app/managment/organization_managment/reads-analytics?tab=beverages"
/>
