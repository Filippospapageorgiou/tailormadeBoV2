<script lang="ts">
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, today, parseDate, type CalendarDate } from '@internationalized/date';

	let {
		id,
		value = $bindable(),
		required = false,
		name = $bindable()
	}: {
		id?: string;
		value?: string;
		required?: boolean;
		name?:string
	} = $props();

	let open = $state(false);
	let calendarValue = $state<CalendarDate | undefined>(value ? parseDate(value) : undefined);

	// Sync calendarValue changes back to the string value
	$effect(() => {
		if (calendarValue) {
			value = calendarValue.toString(); // Format: YYYY-MM-DD
		} else {
			value = '';
		}
	});
</script>

<div class="flex flex-col gap-3">
	<Popover.Root bind:open>
		<Popover.Trigger {id}>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class="w-full justify-between font-normal"
					aria-required={required}
				>
					{calendarValue
						? calendarValue.toDate(getLocalTimeZone()).toLocaleDateString()
						: 'Select date'}
					<ChevronDownIcon />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-auto overflow-hidden p-0" align="start">
			<Calendar
				type="single"
				bind:value={calendarValue}
				captionLayout="dropdown"
				onValueChange={() => {
					open = false;
				}}
			/>
			<input type="hidden" name={name} value={value} />
		</Popover.Content>
	</Popover.Root>
</div>
