<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-svelte';

	interface Props {
		weekStartDate: string; // YYYY-MM-DD
		weekEndDate: string; // YYYY-MM-DD
		onPrevWeek?: () => void;
		onNextWeek?: () => void;
		onBack?: () => void;
	}

	let { weekStartDate, weekEndDate, onBack }: Props = $props();

	// Format date range for display (e.g., "Oct 20-26")
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

		const month = monthNames[startDate.getMonth()];
		const startDay = startDate.getDate();
		const endDay = endDate.getDate();

		return `${month} ${startDay}-${endDay}`;
	}
	

	let weekDisplay = $derived(formatWeekRange(weekStartDate, weekEndDate));
</script>

<Card.Card class="mb-4">
	<Card.CardHeader>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				{#if onBack}
					<Button variant="ghost" size="icon" onclick={onBack} class="h-8 w-8">
						<ArrowLeft class="h-4 w-4" />
					</Button>
				{/if}
				<div>
					<Card.CardTitle class="text-xl">Schedule Management</Card.CardTitle>
					<Card.CardDescription>Week of {weekDisplay}</Card.CardDescription>
				</div>
			</div>
		</div>
	</Card.CardHeader>
</Card.Card>
