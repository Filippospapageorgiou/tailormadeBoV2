<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import type { DateRange } from 'bits-ui';
	import {
		CalendarDate,
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		now
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let {
		rangeStart = $bindable(),
		rangeEnd = $bindable()
	} = $props();

	const df = new DateFormatter('el-GR', {
		dateStyle: 'medium'
	});

	let value: DateRange = $state({
		start: rangeStart,
		end: rangeEnd
	});

	let startValue: DateValue | undefined = $state(undefined);

	// Sync changes back to parent
	$effect(() => {
		if (value.start) rangeStart = value.start;
		if (value.end) rangeEnd = value.end;
	});

	// Keep local value in sync when parent changes
	$effect(() => {
		if (rangeStart && rangeEnd) {
			value = {
				start: rangeStart,
				end: rangeEnd
			};
		}
	});
</script>

<div class="grid gap-2">
	<Popover.Root>
		<Popover.Trigger
			class={cn(buttonVariants({ variant: 'datepicker' }), !value.start && 'text-muted-foreground')}
		>
			<CalendarIcon class="mr-2 size-4" />
			{#if value?.start}
				{#if value?.end}
					{df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
						value.end.toDate(getLocalTimeZone())
					)}
				{:else}
					{df.format(value.start.toDate(getLocalTimeZone()))}
				{/if}
			{:else if startValue}
				{df.format(startValue.toDate(getLocalTimeZone()))}
			{:else}
				Pick a date
			{/if}
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			<RangeCalendar
				bind:value
				onStartValueChange={(v) => {
					startValue = v;
				}}
				numberOfMonths={2}
			/>
		</Popover.Content>
	</Popover.Root>
</div>