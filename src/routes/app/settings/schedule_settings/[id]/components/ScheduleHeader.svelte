<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Calendar } from 'lucide-svelte';

	interface Props {
		weekStartDate: string; // YYYY-MM-DD
		weekEndDate: string; // YYYY-MM-DD
		onBack?: () => void;
	}

	let { weekStartDate, weekEndDate, onBack }: Props = $props();

	// Format date range for display (e.g., "Oct 20 - Oct 26, 2024")
	function formatWeekRange(start: string, end: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);

		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];

		const startMonth = monthNames[startDate.getMonth()];
		const endMonth = monthNames[endDate.getMonth()];
		const startDay = startDate.getDate();
		const endDay = endDate.getDate();
		const year = startDate.getFullYear();

		if (startMonth === endMonth) {
			return `${startMonth} ${startDay}-${endDay}, ${year}`;
		} else {
			return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
		}
	}

	let weekDisplay = $derived(formatWeekRange(weekStartDate, weekEndDate));
</script>

<div class="flex items-center justify-between rounded-xl border bg-card p-6 shadow-sm">
	<div class="flex items-center gap-4">
		{#if onBack}
			<Button variant="ghost" size="icon" onclick={onBack} class="h-10 w-10">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		{/if}
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
				<Calendar class="h-6 w-6 text-primary" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Schedule Management</h1>
				<p class="text-sm text-muted-foreground">Week of {weekDisplay}</p>
			</div>
		</div>
	</div>
</div>