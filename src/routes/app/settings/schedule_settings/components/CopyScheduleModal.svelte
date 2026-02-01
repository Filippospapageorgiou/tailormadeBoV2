<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Calendar, Copy, Users, Clock, ArrowRight, Sun, Sunset, Moon } from 'lucide-svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import type { ScheduleWithMetrics } from '../data.remote';

	interface Props {
		open: boolean;
		sourceSchedule: ScheduleWithMetrics | null;
		isLoading: boolean;
		onClose: () => void;
		onCopy: (targetWeekStart: string) => void;
	}

	let { open, sourceSchedule, isLoading, onClose, onCopy }: Props = $props();

	let targetWeekStart = $state('');

	// Calculate suggested next week
	let suggestedDate = $derived.by(() => {
		if (!sourceSchedule) return '';
		const endDate = new Date(sourceSchedule.week_end_date);
		const nextMonday = new Date(endDate);
		nextMonday.setDate(endDate.getDate() + 1);
		// Adjust to Monday if not already
		const dayOfWeek = nextMonday.getDay();
		const diff = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
		nextMonday.setDate(nextMonday.getDate() + diff);
		return nextMonday.toISOString().split('T')[0];
	});

	// Set suggested date when modal opens
	$effect(() => {
		if (open && suggestedDate && !targetWeekStart) {
			targetWeekStart = suggestedDate;
		}
	});

	// Format date for display
	function formatDate(dateString: string) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function formatDateShort(dateString: string) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
	}

	// Calculate target end date
	let targetEndDate = $derived.by(() => {
		if (!targetWeekStart) return '';
		const start = new Date(targetWeekStart);
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return end.toISOString().split('T')[0];
	});

	function handleClose() {
		targetWeekStart = '';
		onClose();
	}

	function handleCopy() {
		if (!targetWeekStart) return;
		onCopy(targetWeekStart);
	}
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Copy class="h-5 w-5 text-primary" />
				Αντιγραφή Προγράμματος
			</DialogTitle>
			<DialogDescription>
				Δημιουργήστε ένα νέο πρόγραμμα βασισμένο σε ένα υπάρχον. Όλες οι βάρδιες θα αντιγραφούν.
			</DialogDescription>
		</DialogHeader>

		{#if sourceSchedule}
			<div class="space-y-6 py-4">
				<!-- Source Schedule Preview -->
				<div class="space-y-2">
					<Label class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Πηγή
					</Label>
					<div
						class="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4"
					>
						<div class="flex items-center justify-between">
							<div>
								<p class="font-semibold">
									{formatDateShort(sourceSchedule.week_start_date)} - {formatDateShort(
										sourceSchedule.week_end_date
									)}
								</p>
								<p class="text-xs text-muted-foreground">
									Εβδομάδα {sourceSchedule.year}
								</p>
							</div>

							<div class="flex items-center gap-3">
								<div class="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
									<Users class="h-3.5 w-3.5 text-primary/70" />
									<span class="text-sm font-medium">{sourceSchedule.employee_count}</span>
								</div>
								<div class="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
									<Clock class="h-3.5 w-3.5 text-muted-foreground" />
									<span class="text-sm font-medium">{sourceSchedule.shift_count}</span>
								</div>
							</div>
						</div>

						<!-- Shift breakdown -->
						{#if sourceSchedule.shift_count > 0}
							<div class="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
								{#if sourceSchedule.morning_shifts > 0}
									<div
										class="flex items-center gap-1 rounded-md px-2 py-0.5"
										style="background: var(--shift-morning-bg);"
									>
										<Sun class="h-3 w-3" style="color: var(--shift-morning);" />
										<span class="text-xs font-medium" style="color: var(--shift-morning);">
											{sourceSchedule.morning_shifts}
										</span>
									</div>
								{/if}
								{#if sourceSchedule.afternoon_shifts > 0}
									<div
										class="flex items-center gap-1 rounded-md px-2 py-0.5"
										style="background: var(--shift-afternoon-bg);"
									>
										<Sunset class="h-3 w-3" style="color: var(--shift-afternoon);" />
										<span class="text-xs font-medium" style="color: var(--shift-afternoon);">
											{sourceSchedule.afternoon_shifts}
										</span>
									</div>
								{/if}
								{#if sourceSchedule.evening_shifts > 0}
									<div
										class="flex items-center gap-1 rounded-md px-2 py-0.5"
										style="background: var(--shift-evening-bg);"
									>
										<Moon class="h-3 w-3" style="color: var(--shift-evening);" />
										<span class="text-xs font-medium" style="color: var(--shift-evening);">
											{sourceSchedule.evening_shifts}
										</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Arrow indicator -->
				<div class="flex justify-center">
					<div class="rounded-full bg-white/5 p-2">
						<ArrowRight class="h-5 w-5 text-primary/60" />
					</div>
				</div>

				<!-- Target Date Selection -->
				<div class="space-y-2">
					<Label for="target_week_start" class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Νέα Εβδομάδα
					</Label>
					<InputCalendar
						id="target_week_start"
						bind:value={targetWeekStart}
						required
					/>
					{#if targetWeekStart && targetEndDate}
						<p class="text-sm text-muted-foreground">
							Το νέο πρόγραμμα θα είναι: <span class="font-medium text-foreground">{formatDateShort(targetWeekStart)} - {formatDateShort(targetEndDate)}</span>
						</p>
					{/if}
				</div>

				<!-- Summary -->
				<div class="rounded-lg border border-primary/20 bg-primary/5 p-3">
					<p class="text-sm">
						<span class="font-medium text-primary">Θα αντιγραφούν:</span>
					</p>
					<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
						<li class="flex items-center gap-2">
							<span class="h-1.5 w-1.5 rounded-full bg-primary/60"></span>
							{sourceSchedule.employee_count} εργαζόμενοι
						</li>
						<li class="flex items-center gap-2">
							<span class="h-1.5 w-1.5 rounded-full bg-primary/60"></span>
							{sourceSchedule.shift_count} βάρδιες (με τις ίδιες ώρες)
						</li>
					</ul>
				</div>
			</div>
		{/if}

		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>
				Ακύρωση
			</Button>
			<Button
				onclick={handleCopy}
				disabled={isLoading || !targetWeekStart}
				class="gap-2"
			>
				{#if isLoading}
					<Spinner />
					Αντιγραφή...
				{:else}
					<Copy class="h-4 w-4" />
					Αντιγραφή Προγράμματος
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
