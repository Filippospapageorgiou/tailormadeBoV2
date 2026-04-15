<script lang="ts">
	import { getManualReadsLast7Days } from '$lib/api/manual/data.remote';
	import { BookOpen } from 'lucide-svelte';
	import ReadsAreaChart from './ReadsAreaChart.svelte';

	let readsQuery = getManualReadsLast7Days();
	let reads = $derived(readsQuery?.current?.reads ?? []);
</script>

<ReadsAreaChart
	title="Εγχειρίδια"
	description="Αναγνώσεις εγχειριδίων - 7 ημέρες"
	icon={BookOpen as any}
	{reads}
	color="var(--color-emerald-500)"
	moreHref="/app/managment/organization_managment/reads-analytics?tab=manual"
/>
