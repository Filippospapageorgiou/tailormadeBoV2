<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { Clock, Timer, Camera, CheckCircle2, Circle } from 'lucide-svelte';

	let { open = $bindable(false), task } = $props();
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40" />
		<Drawer.Content
			class="fixed inset-x-0 bottom-0 mt-24 flex h-auto max-h-[85vh] flex-col rounded-t-2xl border-t border-border/30 bg-background"
		>
			<!-- Drag handle indicator -->
			<div class="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20"></div>

			<div class="flex flex-col gap-4 overflow-y-auto p-6">
				<!-- Header with status -->
				<Drawer.Header class="p-0">
					<div class="flex items-start gap-3">
						<!-- Status icon -->
						<div
							class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full {task?.completed
								? 'bg-emerald-500/15'
								: 'bg-muted/50'}"
						>
							{#if task?.completed}
								<CheckCircle2 class="h-5 w-5 text-emerald-500" />
							{:else}
								<Circle class="h-5 w-5 text-muted-foreground/60" />
							{/if}
						</div>

						<div class="flex-1">
							<Drawer.Title class="text-left text-xl font-semibold text-foreground">
								{task?.task_items?.title ?? 'Task'}
							</Drawer.Title>
							{#if task?.completed}
								<span class="text-sm text-emerald-600 dark:text-emerald-400">Completed</span>
							{:else}
								<span class="text-sm text-muted-foreground/70">In Progress</span>
							{/if}
						</div>
					</div>
				</Drawer.Header>

				<!-- Description -->
				{#if task?.task_items?.description}
					<Drawer.Description class="text-left text-base leading-relaxed text-foreground/80">
						{task.task_items.description}
					</Drawer.Description>
				{/if}

				<!-- Badges / Meta info -->
				<div class="flex flex-wrap gap-2 pt-2">
					{#if task?.task_items?.scheduled_time}
						<div
							class="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 dark:bg-primary/15"
						>
							<Clock class="h-4 w-4 text-primary" />
							<span class="text-sm font-medium text-primary">
								{task.task_items.scheduled_time.slice(0, 5)}
							</span>
						</div>
					{/if}

					{#if task?.task_items?.estimated_minutes > 0}
						<div
							class="flex items-center gap-2 rounded-xl bg-chart-2/10 px-4 py-2.5 dark:bg-chart-2/15"
						>
							<Timer class="h-4 w-4 text-chart-2" />
							<span class="text-sm font-medium text-chart-2">
								{task.task_items.estimated_minutes} min
							</span>
						</div>
					{/if}

					{#if task?.task_items?.requires_photo}
						<div
							class="flex items-center gap-2 rounded-xl bg-sky-500/10 px-4 py-2.5 dark:bg-sky-500/15"
						>
							<Camera class="h-4 w-4 text-sky-600 dark:text-sky-400" />
							<span class="text-sm font-medium text-sky-600 dark:text-sky-400">Photo Required</span>
						</div>
					{/if}
				</div>

				<!-- Instructions hint -->
				<Drawer.Footer class="mt-4 border-t border-border/30 p-0 pt-4">
					<p class="text-center text-xs text-muted-foreground/60">
						Drag the card to "Done" to complete this task
					</p>
				</Drawer.Footer>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
