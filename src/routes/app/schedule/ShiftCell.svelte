<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import { Clock } from 'lucide-svelte';

	interface Props {
		shift: Shift;
		badgeColor: string;
		onClick?: () => void;
	}

	const { shift, badgeColor, onClick }: Props = $props();

	function formatTime(time: string | null): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		return `${hours}:${minutes}`;
	}

	function getShiftTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			work: 'Εργασία',
			day_off: 'Ρεπό',
			sick_leave: 'Άδεια',
			vacation: 'Διακοπές'
		};
		return labels[type] || type;
	}

	let isWorkShift = $derived(shift.shift_type === SHIFT_TYPE.WORK);
</script>

<button
	type="button"
	onclick={onClick}
	class="group relative cursor-pointer transition-all duration-200 hover:scale-105"
	aria-label={`Shift for ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
>
	<div
		class="items-cente flex w-full justify-center gap-1 rounded-lg border border-border/50 bg-background/40 p-3 backdrop-blur-sm transition-all duration-200 group-hover:border-border group-hover:shadow-md"
		style="border-left: 4px solid {badgeColor};"
	>
		{#if isWorkShift}
			<Clock
				class="absolute top-3.5 left-3 hidden h-4 w-4 flex-shrink-0  2xl:block"
				style="color: {badgeColor};"
			/>
			<span class="pr-0 text-sm font-medium whitespace-nowrap">
				{formatTime(shift.start_time)} - {formatTime(shift.end_time)}
			</span>
		{:else}
			<span class="text-sm font-medium" style="color: {badgeColor};">
				{getShiftTypeLabel(shift.shift_type)}
			</span>
		{/if}
	</div>
</button>
