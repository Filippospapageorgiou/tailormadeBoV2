<script lang="ts">
	import type { Shift } from '$lib/models/schedule.types';
	import { SHIFT_TYPE } from '$lib/models/schedule.types';
	import Clock from '@lucide/svelte/icons/clock';
	import Coffee from '@lucide/svelte/icons/coffee';
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import Palmtree from '@lucide/svelte/icons/palmtree';

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

	const shiftConfig: Record<string, { label: string; icon: typeof Clock }> = {
		work: { label: 'Εργασία', icon: Clock },
		day_off: { label: 'Ρεπό', icon: Coffee },
		sick_leave: { label: 'Άρρωστος', icon: Thermometer },
		vacation: { label: 'Άδεια', icon: Palmtree }
	};

	let config = $derived(shiftConfig[shift.shift_type] ?? shiftConfig.work);
	let isWorkShift = $derived(shift.shift_type === SHIFT_TYPE.WORK);
	let ShiftIcon = $derived(config.icon);
</script>

<button
	type="button"
	onclick={onClick}
	class="group relative w-full cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
	aria-label={isWorkShift
		? `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`
		: config.label}
>
	<div
		class="relative flex h-[50px] w-full items-center gap-2 overflow-hidden rounded-md border transition-all duration-150
		       {isWorkShift
			? 'border-border/60 bg-card hover:border-border hover:shadow-sm dark:bg-card dark:hover:border-border dark:hover:shadow-none'
			: 'border-dashed border-border/50 bg-muted/40 hover:bg-muted/60 dark:bg-muted/20 dark:hover:bg-muted/30'}"
	>
		<!-- Left accent bar -->
		<div
			class="absolute top-0 left-0 h-full w-[3px] rounded-l-md transition-all duration-150"
			class:opacity-80={!isWorkShift}
			style="background-color: {badgeColor};"
		></div>

		<!-- Content -->
		<div class="flex w-full items-center gap-2 pr-2.5 pl-3">
			{#if isWorkShift}
				<!-- Work shift: time range -->
				<div class="flex min-w-0 flex-col">
					<span
						class="text-[13px] leading-tight font-semibold tracking-tight text-foreground tabular-nums"
					>
						{formatTime(shift.start_time)}–{formatTime(shift.end_time)}
					</span>
					{#if shift.shift_category}
						<div class="flex gap-[20px] flex-row justify-between items-start content-center flex-nowrap">
							<div
								class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
							>
								{shift.shift_category}
							</div>
							<!-- Subtle clock icon on the right -->
							<div class="opacity-0 transition-opacity duration-150 group-hover:opacity-60">
								<Clock class="h-3.5 w-3.5 text-muted-foreground" />
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Non-work shift: icon + label -->
				<div
					class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded"
					style="background-color: {badgeColor}18;"
				>
					<ShiftIcon class="h-3.5 w-3.5" style="color: {badgeColor};" />
				</div>
				<span class="truncate text-[12px] font-medium text-muted-foreground">
					{config.label}
				</span>
			{/if}
		</div>
	</div>
</button>
