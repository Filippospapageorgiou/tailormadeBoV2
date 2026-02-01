<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		ArrowLeft,
		Calendar,
		ChevronLeft,
		ChevronRight,
		CalendarDays
	} from 'lucide-svelte';

	interface AdjacentSchedule {
		id: number;
		week_start_date: string;
		week_end_date: string;
	}

	interface Props {
		weekStartDate: string;
		weekEndDate: string;
		onBack?: () => void;
		previousSchedule?: AdjacentSchedule | null;
		nextSchedule?: AdjacentSchedule | null;
		onNavigate?: (scheduleId: number) => void;
		onJumpToCurrentWeek?: () => void;
	}

	let {
		weekStartDate,
		weekEndDate,
		onBack,
		previousSchedule,
		nextSchedule,
		onNavigate,
		onJumpToCurrentWeek
	}: Props = $props();

	// Greek month names
	const monthNames = [
		'Ιαν',
		'Φεβ',
		'Μάρ',
		'Απρ',
		'Μάι',
		'Ιούν',
		'Ιούλ',
		'Αύγ',
		'Σεπ',
		'Οκτ',
		'Νοέ',
		'Δεκ'
	];

	// Format date range for display
	function formatWeekRange(start: string, end: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);

		const startMonth = monthNames[startDate.getMonth()];
		const endMonth = monthNames[endDate.getMonth()];
		const startDay = startDate.getDate();
		const endDay = endDate.getDate();
		const year = startDate.getFullYear();

		if (startMonth === endMonth) {
			return `${startDay} - ${endDay} ${startMonth} ${year}`;
		} else {
			return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
		}
	}

	// Format short date for navigation tooltips
	function formatShortDate(dateString: string): string {
		const date = new Date(dateString);
		return `${date.getDate()} ${monthNames[date.getMonth()]}`;
	}

	// Get week number
	function getWeekNumber(dateString: string): number {
		const date = new Date(dateString);
		const startOfYear = new Date(date.getFullYear(), 0, 1);
		const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
		return Math.ceil((days + startOfYear.getDay() + 1) / 7);
	}

	// Check if this is the current week
	let isCurrentWeek = $derived.by(() => {
		const today = new Date();
		const start = new Date(weekStartDate);
		const end = new Date(weekEndDate);
		return today >= start && today <= end;
	});

	let weekDisplay = $derived(formatWeekRange(weekStartDate, weekEndDate));
	let weekNumber = $derived(getWeekNumber(weekStartDate));
</script>

<div
	class="animate-in fade-in slide-in-from-top-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-4 backdrop-blur-sm duration-500 sm:flex-row sm:items-center sm:justify-between"
>
	<!-- Left side: Back button and title -->
	<div class="flex items-center gap-4">
		{#if onBack}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="ghost"
							size="icon"
							onclick={onBack}
						>
							<ArrowLeft class="h-5 w-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">Πίσω στα προγράμματα</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}

		<div class="flex items-center gap-3">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"
			>
				<Calendar class="h-6 w-6 text-primary" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-xl font-bold tracking-tight sm:text-2xl">
						Εβδομάδα
					</h2>
					{#if isCurrentWeek}
						<span
							class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400"
						>
							Τρέχουσα
						</span>
					{/if}
				</div>
				<p class="text-sm text-muted-foreground">{weekDisplay}</p>
			</div>
		</div>
	</div>

	<!-- Right side: Week navigation -->
	<div class="flex items-center gap-2">
		<!-- Previous Week -->
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="outline"
						size="icon"
						onclick={() => previousSchedule && onNavigate?.(previousSchedule.id)}
						disabled={!previousSchedule}
					>
						<ChevronLeft class="h-5 w-5" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					{#if previousSchedule}
						<p class="text-xs">
							Προηγούμενη: {formatShortDate(previousSchedule.week_start_date)}
						</p>
					{:else}
						<p class="text-xs">Δεν υπάρχει προηγούμενο πρόγραμμα</p>
					{/if}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>

		<!-- Jump to Current Week -->
		{#if onJumpToCurrentWeek && !isCurrentWeek}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="outline"
							size="sm"
							onclick={onJumpToCurrentWeek}
						>
							<CalendarDays class="h-4 w-4" />
							<span class="hidden sm:inline">Σήμερα</span>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-xs">Μετάβαση στην τρέχουσα εβδομάδα</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}

		<!-- Next Week -->
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="outline"
						size="icon"
						onclick={() => nextSchedule && onNavigate?.(nextSchedule.id)}
						disabled={!nextSchedule}
					>
						<ChevronRight class="h-5 w-5" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					{#if nextSchedule}
						<p class="text-xs">
							Επόμενη: {formatShortDate(nextSchedule.week_start_date)}
						</p>
					{:else}
						<p class="text-xs">Δεν υπάρχει επόμενο πρόγραμμα</p>
					{/if}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</div>
