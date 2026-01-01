<script lang="ts">
	import {
		Trash2,
		Edit,
		CheckCircle2,
		Clock,
		LayoutIcon,
		LayoutPanelLeft,
		Calendar,
		ChevronDown,
		ImageIcon
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import ImagePreviewModal from '$lib/components/custom/ImagePreviewModal.svelte';
	import { deleteDailyTask } from '../data.remote';
	import { toast } from 'svelte-sonner';

	let { users = [], selectedDate = $bindable(), isLoading = false, onDelete } = $props();

	let previewImage: string | null = $state(null);
	let previewModalOpen = $state(false);

	function openImagePreview(imageUrl: string) {
		previewImage = imageUrl;
		previewModalOpen = true;
	}

	let animatedProgress = $state<Record<string, number>>({});

	const getUserStats = (user: any) => {
		const tasks = user.dailyTasks || [];
		console.log(tasks);
		const total = tasks.length;
		const completed = tasks.filter((t: any) => t.completed).length;
		const completedBool = total > 0 && completed === total;
		const time = tasks.reduce(
			(sum: number, t: any) => sum + (t.task_items?.estimated_minutes || 0),
			0
		);
		return {
			tasks,
			total,
			completed,
			time,
			progress: total > 0 ? (completed / total) * 100 : 0,
			completedBool
		};
	};

	// Initialize progress values to 0 and animate to actual values
	$effect(() => {
		if (users.length > 0) {
			// Reset all to 0 first
			users.forEach((user) => {
				animatedProgress[user.id] = 0;
			});

			// Then animate to actual values with staggered delays
			users.forEach((user, index) => {
				setTimeout(
					() => {
						const stats = getUserStats(user);
						animatedProgress[user.id] = stats.progress;
					},
					index * 250 + 600
				);
			});
		}
	});
	let deletingTaskId = $state<string | null>(null);

	async function handleDeleteTask(id: string) {
		if (!id) return;
		deletingTaskId = id;
		const result = await deleteDailyTask({ id });
		if (result.success) {
			toast.success(result.message);
			await onDelete();
			deletingTaskId = null;
		} else {
			toast.error(result.message);
			deletingTaskId = null;
		}
	}
</script>

<div class="max-w-5xl space-y-6">
	<div class="flex animate-fade-in-left gap-6">
		<div class="flex w-auto flex-col gap-1 px-1">
			<h2 class="text-2xl font-semibold text-foreground">Tasks εργαζομένων</h2>
			<p class="mt-1 pt-2 text-sm text-muted-foreground">
				Διαλέξε συκγεκριμένη ημερομηνία και δες την προόδο των εργαζομένων κάθως και την επίλογη να
				αφαιρέσης tasks.
			</p>
			<div class="mt-2 flex items-center gap-4">
				<InputCalendar bind:value={selectedDate} required />
				{#if isLoading}
					<Spinner class="h-4 w-4 opacity-50" />
				{/if}
			</div>
		</div>
	</div>
	{#if isLoading && users.length === 0}
		<div class="flex justify-center py-12"><Spinner /></div>
	{:else}
		<div class="grid gap-3">
			{#each users as user, index (user.id)}
				{@const s = getUserStats(user)}
				<Card.Root
					style="animation-delay: {index * 250}ms; animation-fill-mode: backwards;"
					class="animate-fade-in-down rounded-xl bg-white shadow-lg"
				>
					<Card.Header>
						<Card.Title class="flex items-center gap-4">
							<Avatar.Root class="h-12 w-12">
								<Avatar.Image src={user.image_url} alt={user.username} />
								<Avatar.Fallback>{user.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex min-w-0 flex-1 items-center justify-between gap-3">
								<div class="min-w-0 flex-1">
									<h3 class="truncate font-semibold text-foreground">{user.username}</h3>
									<p class="truncate text-sm text-muted-foreground">{user?.email}</p>
								</div>
							</div>
						</Card.Title>
						<Card.Description>
							<div class="mt-3 flex items-center gap-4 text-sm">
								<div class="flex items-center gap-2">
									<LayoutPanelLeft class="h-4 w-4 text-muted-foreground" />
									<span class="font-medium text-foreground">{s.total}</span>
								</div>
								<div class="flex items-center gap-1 text-muted-foreground">
									<Calendar class="h-4 w-4" />
									<span>{selectedDate}</span>
								</div>
							</div>
						</Card.Description>
						<Card.Action>
							<Badge
								variant={s.completedBool ? 'default' : !s.completedBool ? 'secondary' : 'outline'}
								class="shrink-0 rounded-sm"
							>
								{#if s.completedBool}
									<CheckCircle2 class="mr-1 h-3 w-3" />
									completed
								{:else}
									in progress
								{/if}
							</Badge>
						</Card.Action>
					</Card.Header>
					<Card.Content>
						<div class="mb-4 flex items-center gap-3">
							<Progress value={animatedProgress[user.id] ?? 0} max={100} class="w-[60px] flex-1" />
							<p class="min-w-[45px] text-right text-sm font-semibold text-foreground">
								{Math.round(animatedProgress[user.id] ?? 0)}%
							</p>
						</div>

						<Accordion.Root type="single" class="w-full">
							<Accordion.Item value="tasks" class="border-none">
								<Accordion.Trigger
									class="rounded-lg px-3 py-2 transition-colors hover:bg-muted/50 hover:no-underline"
								>
									<div class="flex items-center gap-2 text-sm font-medium">
										<LayoutPanelLeft class="h-4 w-4" />
										<span>Εργασίες υπαλλήλου ({s.completed}/{s.total})</span>
									</div>
								</Accordion.Trigger>
								<Accordion.Content class="pt-2 pb-1">
									<div class="space-y-2">
										{#each s.tasks as task, i (task.id)}
											<div
												class="group relative rounded-lg border border-border bg-card p-4 transition-all"
												class:animate-fade-out={deletingTaskId === task.id}
												style="animation-delay: {deletingTaskId === task.id ? '0ms' : i * 150 + 'ms'};
														animation-fill-mode: {deletingTaskId === task.id ? 'forwards' : 'backwards'};">
												<Button
													variant="ghost"
													size="icon"
													class="absolute top-2 right-2 h-7 w-7 hover:bg-red-50 hover:text-red-600"
													onclick={() => {
														handleDeleteTask(task.id);
													}}
												>
													{#if deletingTaskId}
														<Spinner class="h-3 w-3" />
													{:else}
														<Trash2 class="h-3.5 w-3.5" />
													{/if}
												</Button>
												<div class="flex items-start gap-3">
													<div class="pt-0.5">
														<Checkbox
															checked={task.completed}
															disabled
															class="h-5 w-5 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
														/>
													</div>
													<div class="min-w-0 flex-1 space-y-1">
														<h4
															class="text-sm leading-tight font-semibold text-foreground"
															class:line-through={task.completed}
															class:text-muted-foreground={task.completed}
														>
															{task.task_items.title}
														</h4>
														{#if task.task_items?.description}
															<p
																class="text-xs leading-relaxed text-muted-foreground"
																class:line-through={task.completed}
															>
																{task.task_items.description}
															</p>
														{/if}
														<div class="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
															{#if task.task_items?.estimated_minutes > 0}
																<div class="flex items-center gap-1 text-xs text-muted-foreground">
																	<Clock class="h-3 w-3" />
																	<span>{task.task_items.estimated_minutes} λεπτά</span>
																</div>
															{/if}
															{#if task.task_items?.requires_photo}
																<Badge variant="outline" class="h-5 px-2 py-0 text-xs">
																	Φωτογραφία
																</Badge>
															{/if}
															{#if task.completed}
																<Badge variant="default" class="h-5 bg-green-500 px-2 py-0 text-xs">
																	✓ Ολοκληρώθηκε
																</Badge>
															{/if}
															{#if task.photo_url}
																<div class="flex -space-x-2">
																	<button
																		class="relative z-0 h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-white ring-1 ring-gray-200 transition-transform hover:z-10 hover:scale-110"
																		title="View image"
																		onclick={() => openImagePreview(task.photo_url)}
																	>
																		<img
																			src={task.photo_url}
																			alt="Evidence"
																			class="h-full w-full object-cover"
																		/>
																	</button>
																</div>
															{/if}
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<ImagePreviewModal bind:open={previewModalOpen} imageUrl={previewImage} />
