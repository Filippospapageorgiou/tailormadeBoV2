<script lang="ts">
	import {
		Trash2,
		CheckCircle2,
		Clock,
		Calendar,
		CalendarRange,
		CalendarDays,
		Camera,
		User,
		ListChecks,
		CircleDashed
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import ImagePreviewModal from '$lib/components/custom/ImagePreviewModal.svelte';
	import { deleteDailyTask, deleteWeeklyTask, deleteMonthlyTask } from '../data.remote';
	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/utils';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	type Frequency = 'daily' | 'weekly' | 'monthly';

	let {
		usersWithTasks = [],
		selectedFrequency = 'daily',
		selectedDate = $bindable(),
		selectedWeekStart = $bindable(),
		selectedMonth = $bindable(),
		isLoading = false,
		onDelete
	}: {
		usersWithTasks: any[];
		selectedFrequency: Frequency;
		selectedDate: string;
		selectedWeekStart: string;
		selectedMonth: string;
		isLoading: boolean;
		onDelete: () => void;
	} = $props();

	let previewImage: string | null = $state(null);
	let previewModalOpen = $state(false);

	function openImagePreview(imageUrl: string) {
		previewImage = imageUrl;
		previewModalOpen = true;
	}

	let animatedProgress = $state<Record<string, number>>({});

	const freqConfig: Record<Frequency, {
		badge: string;
		badgeBg: string;
		dot: string;
		accent: string;
		label: string;
		dateLabel: string;
		description: string;
		icon: typeof Calendar;
	}> = {
		daily: {
			badge: 'border-emerald-500/30 text-emerald-700 bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/10',
			badgeBg: 'bg-emerald-500',
			dot: 'bg-emerald-500',
			accent: 'text-emerald-600 dark:text-emerald-400',
			label: 'Ημερήσιο',
			dateLabel: 'Ημερομηνία',
			description: 'Προβολή ημερήσιων εργασιών ανά ημερομηνία',
			icon: Calendar
		},
		weekly: {
			badge: 'border-blue-500/30 text-blue-700 bg-blue-50 dark:border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/10',
			badgeBg: 'bg-blue-500',
			dot: 'bg-blue-500',
			accent: 'text-blue-600 dark:text-blue-400',
			label: 'Εβδομαδιαίο',
			dateLabel: 'Εβδομάδα',
			description: 'Προβολή εβδομαδιαίων εργασιών ανά εβδομάδα',
			icon: CalendarRange
		},
		monthly: {
			badge: 'border-amber-500/30 text-amber-700 bg-amber-50 dark:border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/10',
			badgeBg: 'bg-amber-500',
			dot: 'bg-amber-500',
			accent: 'text-amber-600 dark:text-amber-400',
			label: 'Μηνιαίο',
			dateLabel: 'Μήνας',
			description: 'Προβολή μηνιαίων εργασιών ανά μήνα',
			icon: CalendarDays
		}
	};

	function getTasksForUser(user: any): any[] {
		if (selectedFrequency === 'daily') return user.dailyTasks || [];
		if (selectedFrequency === 'weekly') return user.weeklyTasks || [];
		if (selectedFrequency === 'monthly') return user.monthlyTasks || [];
		return [];
	}

	const getUserStats = (user: any) => {
		const tasks = getTasksForUser(user);
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

	// Animate progress bars on load
	$effect(() => {
		if (usersWithTasks.length > 0) {
			usersWithTasks.forEach((user) => {
				animatedProgress[user.id] = 0;
			});

			usersWithTasks.forEach((user, index) => {
				setTimeout(() => {
					const stats = getUserStats(user);
					animatedProgress[user.id] = stats.progress;
				}, index * 200 + 400);
			});
		}
	});

	let deletingTaskId = $state<string | null>(null);

	async function handleDeleteTask(id: string) {
		if (!id) return;
		deletingTaskId = id;

		let result;
		if (selectedFrequency === 'daily') {
			result = await deleteDailyTask({ id });
		} else if (selectedFrequency === 'weekly') {
			result = await deleteWeeklyTask({ id });
		} else {
			result = await deleteMonthlyTask({ id });
		}

		if (result.success) {
			toast.success(result.message);
			await onDelete();
		} else {
			toast.error(result.message);
		}
		deletingTaskId = null;
	}

	function getWeekEndDate(startDate: string): string {
		const d = new Date(startDate);
		d.setDate(d.getDate() + 6);
		return d.toLocaleDateString('el-GR');
	}

	// Summary stats across all users
	const summaryStats = $derived.by(() => {
		let totalTasks = 0;
		let completedTasks = 0;
		let totalMinutes = 0;

		usersWithTasks.forEach((user) => {
			const s = getUserStats(user);
			totalTasks += s.total;
			completedTasks += s.completed;
			totalMinutes += s.time;
		});

		return {
			users: usersWithTasks.length,
			totalTasks,
			completedTasks,
			totalMinutes,
			progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
		};
	});
</script>

<div class="w-full space-y-6">
	<!-- Header Section -->
	<div class="space-y-4">
		<div class="flex flex-col gap-1">
			<h2 class="text-xl font-semibold tracking-tight text-foreground">
				{freqConfig[selectedFrequency].label} εργασίες
			</h2>
			<p class="text-sm text-muted-foreground">
				{freqConfig[selectedFrequency].description}
			</p>
		</div>

		<!-- Date Picker Row -->
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-2">
				{#if selectedFrequency === 'daily'}
					<InputCalendar bind:value={selectedDate} required />
				{:else if selectedFrequency === 'weekly'}
					<InputCalendar bind:value={selectedWeekStart} required />
				{:else}
					<Input type="month" bind:value={selectedMonth} class="w-auto" required />
				{/if}
			</div>

			{#if isLoading}
				<Spinner class="h-4 w-4 text-muted-foreground" />
			{/if}

			<!-- Contextual date range display -->
			{#if selectedFrequency === 'weekly' && selectedWeekStart}
				<div class="flex items-center gap-2 rounded-lg border border-blue-200/50 bg-blue-50/50 px-3 py-1.5 text-xs dark:border-blue-500/20 dark:bg-blue-500/5">
					<CalendarRange class="h-3.5 w-3.5 text-blue-500" />
					<span class="text-muted-foreground">Εβδομάδα:</span>
					<span class="font-medium text-foreground">
						{new Date(selectedWeekStart).toLocaleDateString('el-GR')} — {getWeekEndDate(selectedWeekStart)}
					</span>
				</div>
			{:else if selectedFrequency === 'monthly' && selectedMonth}
				<div class="flex items-center gap-2 rounded-lg border border-amber-200/50 bg-amber-50/50 px-3 py-1.5 text-xs dark:border-amber-500/20 dark:bg-amber-500/5">
					<CalendarDays class="h-3.5 w-3.5 text-amber-500" />
					<span class="text-muted-foreground">Μήνας:</span>
					<span class="font-medium text-foreground">
						{new Date(selectedMonth + '-01').toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
					</span>
				</div>
			{/if}
		</div>

		<!-- Summary Stats Bar -->
		{#if usersWithTasks.length > 0 && !isLoading}
			{@const stats = summaryStats}
			<div class="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
				<div class="flex items-center gap-2 text-sm">
					<User class="h-4 w-4 text-muted-foreground" />
					<span class="font-medium text-foreground">{stats.users}</span>
					<span class="text-muted-foreground">χρήστες</span>
				</div>
				<span class="text-border">•</span>
				<div class="flex items-center gap-2 text-sm">
					<ListChecks class="h-4 w-4 text-muted-foreground" />
					<span class="font-medium text-foreground">{stats.completedTasks}/{stats.totalTasks}</span>
					<span class="text-muted-foreground">εργασίες</span>
				</div>
				<span class="text-border">•</span>
				<div class="flex items-center gap-2 text-sm">
					<Clock class="h-4 w-4 text-muted-foreground" />
					<span class="font-medium text-foreground">{stats.totalMinutes}</span>
					<span class="text-muted-foreground">λεπτά</span>
				</div>
				{#if stats.totalTasks > 0}
					<div class="ml-auto flex items-center gap-2">
						<Progress value={stats.progress} max={100} class="w-24" />
						<span class="text-xs font-medium text-muted-foreground">{Math.round(stats.progress)}%</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Content -->
	{#if isLoading && usersWithTasks.length === 0}
		<div class="flex justify-center py-16">
			<Spinner class="h-6 w-6" />
		</div>
	{:else if usersWithTasks.length === 0}
		<EmptyComp
			title="Δεν βρέθηκαν εργασίες"
			description="Δεν υπάρχουν ανατεθειμένες εργασίες για αυτή την περίοδο"
			icon={Calendar as any}
			tip="Επιλέξτε διαφορετική ημερομηνία ή αναθέστε εργασίες στην καρτέλα 'Ανάθεση εργασιών'"
		/>
	{:else}
		<div class="grid gap-4">
			{#each usersWithTasks as user, index (user.id)}
				{@const s = getUserStats(user)}
				<div
					style="animation-delay: {index * 150}ms; animation-fill-mode: backwards;"
					class="animate-fade-in-down overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
				>
					<!-- User Header -->
					<div class="border-b border-border/40 bg-muted/20 px-5 py-4">
						<div class="flex items-center gap-4">
							<!-- Avatar -->
							<div class="relative">
								<Avatar.Root class="h-11 w-11 ring-2 ring-background dark:bg-white">
									<Avatar.Image src={user.image_url} alt={user.username} />
									<Avatar.Fallback class="text-sm font-medium">
										{user.username.slice(0, 2).toUpperCase()}
									</Avatar.Fallback>
								</Avatar.Root>
								<!-- Status dot -->
								{#if s.completedBool}
									<div class="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500"></div>
								{/if}
							</div>

							<!-- User info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="truncate text-sm font-semibold text-foreground">{user.username}</h3>
									<Badge
										variant="outline"
										class="shrink-0 text-[10px] {freqConfig[selectedFrequency].badge}"
									>
										{freqConfig[selectedFrequency].label}
									</Badge>
								</div>
								<p class="truncate text-xs text-muted-foreground">{user?.email}</p>
							</div>

							<!-- Right side stats -->
							<div class="hidden items-center gap-4 sm:flex">
								<div class="text-right">
									<div class="flex items-center gap-2">
										<Progress value={animatedProgress[user.id] ?? 0} max={100} class="w-20" />
										<span class="min-w-[2.5rem] text-right text-sm font-semibold tabular-nums text-foreground">
											{Math.round(animatedProgress[user.id] ?? 0)}%
										</span>
									</div>
									<p class="mt-0.5 text-[11px] text-muted-foreground">
										{s.completed}/{s.total} εργασίες
										{#if s.time > 0}
											• {s.time} λεπτά
										{/if}
									</p>
								</div>

								{#if s.completedBool}
									<Badge variant="default" class="bg-emerald-500 text-white hover:bg-emerald-600">
										<CheckCircle2 class="mr-1 h-3 w-3" />
										Ολοκληρώθηκε
									</Badge>
								{:else}
									<Badge variant="secondary" class="text-muted-foreground">
										<CircleDashed class="mr-1 h-3 w-3" />
										Σε εξέλιξη
									</Badge>
								{/if}
							</div>
						</div>

						<!-- Mobile progress (visible on small screens) -->
						<div class="mt-3 flex items-center gap-3 sm:hidden">
							<Progress value={animatedProgress[user.id] ?? 0} max={100} class="flex-1" />
							<span class="text-xs font-medium tabular-nums text-muted-foreground">
								{s.completed}/{s.total}
							</span>
							{#if s.completedBool}
								<Badge variant="default" class="bg-emerald-500 text-xs text-white">Ολοκληρώθηκε</Badge>
							{/if}
						</div>
					</div>

					<!-- Tasks Accordion -->
					<Accordion.Root type="single" class="w-full">
						<Accordion.Item value="tasks" class="border-none">
							<Accordion.Trigger
								class="px-5 py-3 transition-colors hover:bg-muted/30 hover:no-underline"
							>
								<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
									<ListChecks class="h-4 w-4" />
									<span>Λίστα εργασιών ({s.completed}/{s.total})</span>
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="px-5 pt-0 pb-4">
								<div class="space-y-2">
									{#each s.tasks as task, i (task.id)}
										<div
											class="group relative rounded-lg border border-border/50 p-3.5 transition-all hover:border-border
											{task.completed ? 'bg-emerald-50/50 dark:bg-emerald-500/20': ''}"
											class:animate-fade-out={deletingTaskId === task.id}
											class:bg-card={!task.completed}
											style="animation-delay: {deletingTaskId === task.id ? '0ms' : i * 100 + 'ms'};
												animation-fill-mode: {deletingTaskId === task.id ? 'forwards' : 'backwards'};"
										>
											<!-- Delete button -->
											<Button
												variant="ghost"
												size="icon"
												class="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/10"
												onclick={() => handleDeleteTask(task.id)}
											>
												{#if deletingTaskId === task.id}
													<Spinner class="h-3 w-3" />
												{:else}
													<Trash2 class="h-3.5 w-3.5" />
												{/if}
											</Button>

											<div class="flex items-start gap-3">
												<!-- Checkbox -->
												<div class="pt-0.5">
													<Checkbox
														checked={task.completed}
														disabled
														class="h-[18px] w-[18px] data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
													/>
												</div>

												<!-- Task content -->
												<div class="min-w-0 flex-1 space-y-1.5">
													<div class="flex items-start gap-2 pr-8">
														<h4
															class="text-sm font-medium leading-tight text-foreground"
															class:line-through={task.completed}
															class:text-muted-foreground={task.completed}
														>
															{task.task_items.title}
														</h4>
													</div>

													{#if task.task_items?.description}
														<p
															class="text-xs leading-relaxed text-muted-foreground"
															class:line-through={task.completed}
														>
															{task.task_items.description}
														</p>
													{/if}

													<!-- Task metadata -->
													<div class="flex flex-wrap items-center gap-2 pt-0.5">
														{#if (task.task_items?.estimated_minutes ?? 0) > 0}
															<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
																<Clock class="h-3 w-3" />
																<span>{task.task_items.estimated_minutes} λεπτά</span>
															</div>
														{/if}

														{#if task.task_items?.requires_photo}
															<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
																<Camera class="h-3 w-3" />
																<span>Φωτογραφία</span>
															</div>
														{/if}

														{#if task.task_items?.template_id === null}
															<Badge
																variant="outline"
																class="h-4 rounded px-1.5 text-[10px] font-normal border-amber-500/30 text-amber-600 dark:text-amber-400"
															>
																Προσαρμοσμένο
															</Badge>
														{/if}

														{#if task.completed && task?.completed_at}
															<span class="text-[11px] text-emerald-600 dark:text-emerald-400">
																✓ {formatDate(task.completed_at)}
															</span>
														{/if}

														{#if task.photo_url}
															<button
																class="relative h-7 w-7 cursor-pointer overflow-hidden rounded-md border border-border transition-transform hover:scale-105 hover:ring-2 hover:ring-primary/30"
																title="Προβολή φωτογραφίας"
																onclick={() => openImagePreview(task.photo_url)}
															>
																<img
																	src={task.photo_url}
																	alt="Evidence"
																	class="h-full w-full object-cover"
																/>
															</button>
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
				</div>
			{/each}
		</div>
	{/if}
</div>

<ImagePreviewModal bind:open={previewModalOpen} imageUrl={previewImage} />