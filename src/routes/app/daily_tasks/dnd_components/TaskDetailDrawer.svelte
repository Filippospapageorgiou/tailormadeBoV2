<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { Clock, Timer, Camera, CheckCircle2, Circle, CalendarRange, CalendarDays, Calendar, ArrowLeftRight } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { formatDate } from '$lib/utils';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		open = $bindable(false),
		task,
		frequency = 'daily'
	}: {
		open: boolean;
		task: any;
		frequency?: Frequency;
	} = $props();

	const freqConfig: Record<Frequency, { label: string; color: string; icon: typeof Calendar }> = {
		daily: {
			label: 'Ημερήσιο',
			color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
			icon: Calendar
		},
		weekly: {
			label: 'Εβδομαδιαίο',
			color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
			icon: CalendarRange
		},
		monthly: {
			label: 'Μηνιαίο',
			color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
			icon: CalendarDays
		}
	};
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
		<Drawer.Content
			class="fixed inset-x-0 bottom-0 mt-24 flex h-auto max-h-[85vh] flex-col rounded-t-3xl border-t border-border/20 bg-background shadow-2xl"
		>
			<!-- Drag handle -->
			<div class="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/15"></div>

			<div class="flex flex-col gap-5 overflow-y-auto px-6 pt-5 pb-8">
				<!-- Header -->
				<Drawer.Header class="p-0">
					<div class="flex items-start gap-3.5">
						<!-- Status icon -->
						<div
							class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
								{task?.completed
									? 'bg-emerald-500/10'
									: 'bg-muted/60'}"
						>
							{#if task?.completed}
								<CheckCircle2 class="h-5 w-5 text-emerald-500" />
							{:else}
								<Circle class="h-5 w-5 text-muted-foreground/40" />
							{/if}
						</div>

						<div class="min-w-0 flex-1">
							<Drawer.Title class="text-left text-base font-bold leading-snug text-foreground">
								{task?.task_items?.title ?? 'Task'}
							</Drawer.Title>
							<div class="mt-1.5 flex items-center gap-2">
								{#if task?.completed}
									<Badge variant="default" class="h-5 bg-emerald-500 text-[10px] text-white">
										Ολοκληρωμένο
									</Badge>
								{:else}
									<Badge variant="secondary" class="h-5 text-[10px]">
										Σε εξέλιξη
									</Badge>
								{/if}
								<Badge variant="outline" class="h-5 text-[10px] {freqConfig[frequency].color}">
									{freqConfig[frequency].label}
								</Badge>
							</div>
						</div>
					</div>
				</Drawer.Header>

				<!-- Description -->
				{#if task?.task_items?.description}
					<Drawer.Description class="text-left text-[13px] leading-relaxed text-foreground/70">
						{task.task_items.description}
					</Drawer.Description>
				{/if}

				<!-- Info grid -->
				<div class="grid grid-cols-2 gap-2.5">
					{#if task?.task_items?.scheduled_time}
						<div class="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-3.5 py-3">
							<Clock class="h-4 w-4 text-primary/70" />
							<div>
								<p class="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Ώρα</p>
								<p class="text-sm font-bold tabular-nums text-foreground">
									{task.task_items.scheduled_time.slice(0, 5)}
								</p>
							</div>
						</div>
					{/if}

					{#if task?.task_items?.estimated_minutes > 0}
						<div class="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-3.5 py-3">
							<Timer class="h-4 w-4 text-muted-foreground/60" />
							<div>
								<p class="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Διάρκεια</p>
								<p class="text-sm font-bold text-foreground">
									{task.task_items.estimated_minutes} λεπτά
								</p>
							</div>
						</div>
					{/if}

					{#if task?.task_items?.requires_photo}
						<div class="flex items-center gap-3 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-3.5 py-3">
							<Camera class="h-4 w-4 text-sky-500/70" />
							<div>
								<p class="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Φωτογραφία</p>
								<p class="text-sm font-bold text-sky-600 dark:text-sky-400">Απαιτείται</p>
							</div>
						</div>
					{/if}

					{#if task?.completed && task?.completed_at}
						<div class="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-3.5 py-3">
							<CheckCircle2 class="h-4 w-4 text-emerald-500/70" />
							<div>
								<p class="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Ολοκληρώθηκε</p>
								<p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
									{formatDate(task.completed_at)}
								</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Photo evidence -->
				{#if task?.photo_url}
					<div class="space-y-2">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
							Φωτογραφία απόδειξης
						</p>
						<div class="overflow-hidden rounded-xl border border-border/30">
							<!-- svelte-ignore a11y_img_redundant_alt -->
							<img
								src={task.photo_url}
								alt="Evidence photo"
								class="w-full object-cover"
								style="max-height: 220px;"
							/>
						</div>
					</div>
				{/if}

				<!-- Footer hint -->
				<Drawer.Footer class="border-t border-border/20 p-0 pt-4">
					<div class="flex items-center justify-center gap-2 text-muted-foreground/40">
						<ArrowLeftRight class="h-3 w-3" />
						<p class="text-center text-[11px]">
							{#if task?.completed}
								Σύρε πίσω στο "Σε εξέλιξη" για αναίρεση
							{:else}
								Σύρε στο "Ολοκληρωμένα" για ολοκλήρωση
							{/if}
						</p>
					</div>
				</Drawer.Footer>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
