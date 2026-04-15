<script lang="ts">
	import { getBlogReadsLast7Days } from '$lib/api/blog/data.remote';
	import { Newspaper } from 'lucide-svelte';
	import ReadsAreaChart from './ReadsAreaChart.svelte';

	let readsQuery = getBlogReadsLast7Days();
	let reads = $derived(readsQuery?.current?.reads ?? []);
</script>

<ReadsAreaChart
	title="Blog"
	description="Αναγνώσεις άρθρων - 7 ημέρες"
	icon={Newspaper as any}
	{reads}
	color="var(--color-sky-500)"
	moreHref="/app/managment/organization_managment/reads-analytics?tab=blog"
/>
