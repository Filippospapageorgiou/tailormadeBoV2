<script lang="ts">
	import {
		Search,
		Calendar,
		Clock,
		UserCircle,
		Check,
		Plus,
		ListChecks,
		Users,
		LayoutTemplate,
		Camera,
		CheckCheck,
		AlertCircleIcon,
		PinIcon,
		CalendarDays,
		CalendarRange
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import TemplateSelect from './components/template-select.svelte';
	import {
		authenticatedAccess,
		getAllTemplatesTask,
		getAllUsers,
		getAllUsersWeekly,
		getAllUsersMonthly,
		addUserDailyTasks,
		addUserWeeklyTasks,
		addUserMonthlyTasks,
		addCustomDayliTask,
		addCustomWeeklyTask,
		addCustomMonthlyTask,
		getAllUsersWithTasks,
		getAllUsersWithWeeklyTasks,
		getAllUsersWithMonthlyTasks
	} from './data.remote';
	import { toast } from 'svelte-sonner';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import Templates from './components/templates.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import AssignedTasks from './components/assigned-tasks.svelte';
	import EmptyComp from '$lib/components/custom/EmptyComp.svelte';

	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);
	let selectedWeekStart = $state<string>(getMonday(new Date()));
	let selectedMonth = $state<string>(new Date().toISOString().slice(0, 7));

	function getMonday(d: Date): string {
		const date = new Date(d);
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1);
		date.setDate(diff);
		return date.toISOString().split('T')[0];
	}

	function getWeekEndDate(startDate: string): string {
		const d = new Date(startDate);
		d.setDate(d.getDate() + 6);
		return d.toLocaleDateString('el-GR');
	}

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	// ─── Frequency State ───
	type Frequency = 'daily' | 'weekly' | 'monthly';
	let selectedFrequency = $state<Frequency>('daily');

	// ─── Queries per frequency ───
	let dailyUsersQuery = $derived(getAllUsers(selectedDate));
	let dailyUsers = $derived(dailyUsersQuery.current?.users ?? []);

	let weeklyUsersQuery = $derived(getAllUsersWeekly(selectedWeekStart));
	let weeklyUsers = $derived(weeklyUsersQuery.current?.users ?? []);

	let monthlyUsersQuery = $derived(getAllUsersMonthly(selectedMonth + '-01'));
	let monthlyUsers = $derived(monthlyUsersQuery.current?.users ?? []);

	// Assigned views
	let dailyWithTasksQuery = $derived(getAllUsersWithTasks(selectedDate));
	let dailyUsersWithTasks = $derived(dailyWithTasksQuery.current?.users ?? []);

	let weeklyWithTasksQuery = $derived(getAllUsersWithWeeklyTasks(selectedWeekStart));
	let weeklyUsersWithTasks = $derived(weeklyWithTasksQuery.current?.users ?? []);

	let monthlyWithTasksQuery = $derived(getAllUsersWithMonthlyTasks(selectedMonth + '-01'));
	let monthlyUsersWithTasks = $derived(monthlyWithTasksQuery.current?.users ?? []);

	// Active users list based on frequency
	let users = $derived(
		selectedFrequency === 'daily'
			? dailyUsers
			: selectedFrequency === 'weekly'
				? weeklyUsers
				: monthlyUsers
	);

	let usersWithTasks = $derived(
		selectedFrequency === 'daily'
			? dailyUsersWithTasks
			: selectedFrequency === 'weekly'
				? weeklyUsersWithTasks
				: monthlyUsersWithTasks
	);

	let isLoadingUsers = $derived(
		selectedFrequency === 'daily'
			? dailyUsersQuery.loading
			: selectedFrequency === 'weekly'
				? weeklyUsersQuery.loading
				: monthlyUsersQuery.loading
	);

	let taskQuery = getAllTemplatesTask();
	let taskTemplatesWithTasks = $derived(taskQuery.current?.taskTemplatesWithTasks ?? []);

	// Filter templates by selected frequency
	const filteredTemplates = $derived(
		taskTemplatesWithTasks.filter((template) => template.frequency === selectedFrequency)
	);

	// Derived values using $derived
	const filteredUsers = $derived(() => {
		if (!searchQuery) return users;
		return users.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	// State
	let currentView = $state<'assign' | 'templates' | 'assigned'>('assign');
	let selectedUserId = $state<string>('');
	let selectedTemplateId = $state<string>('');
	let selectedTemplated = $derived(filteredTemplates.find((f) => f.id === selectedTemplateId));
	let openAddNewTask = $state(false);
	let searchQuery = $state<string>('');
	let isAssigning = $state<boolean>(false);
	let taskItemIds = $derived<string[]>((selectedTemplated?.task_items ?? []).map((v) => v.id));

	const selectedUserIdData = $derived(users.find((u) => u.id === selectedUserId));

	// Check if selected user already has tasks (only blocks daily)
	const userHasExistingDailyTasks = $derived(
		selectedFrequency === 'daily' &&
			selectedUserIdData &&
			'dailyTasks' in selectedUserIdData &&
			(selectedUserIdData as any).dailyTasks?.length > 0
	);

	// For displaying existing tasks in any frequency
	const existingTasksForUser = $derived(() => {
		if (!selectedUserIdData) return [];
		if (selectedFrequency === 'daily' && 'dailyTasks' in selectedUserIdData) {
			return (selectedUserIdData as any).dailyTasks ?? [];
		}
		if (selectedFrequency === 'weekly' && 'weeklyTasks' in selectedUserIdData) {
			return (selectedUserIdData as any).weeklyTasks ?? [];
		}
		if (selectedFrequency === 'monthly' && 'monthlyTasks' in selectedUserIdData) {
			return (selectedUserIdData as any).monthlyTasks ?? [];
		}
		return [];
	});

	const totalMinutes = $derived(
		(selectedTemplated?.task_items ?? []).reduce((sum, t) => sum + t.estimated_minutes!, 0)
	);

	// Reset selections on frequency change
	$effect(() => {
		// Track selectedFrequency
		selectedFrequency;
		selectedTemplateId = '';
		selectedUserId = '';
	});

	const frequencyLabels: Record<Frequency, { label: string; assignLabel: string; dateLabel: string }> = {
		daily: { label: 'Ημερήσιο', assignLabel: 'Ημερήσια ανάθεση', dateLabel: 'Ημερομηνία' },
		weekly: { label: 'Εβδομαδιαίο', assignLabel: 'Εβδομαδιαία ανάθεση', dateLabel: 'Εβδομάδα (αρχή)' },
		monthly: { label: 'Μηνιαίο', assignLabel: 'Μηνιαία ανάθεση', dateLabel: 'Μήνας' }
	};

	// Badge color per frequency
	const freqColors: Record<Frequency, string> = {
		daily: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
		weekly: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
		monthly: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
	};

	const freqDotColors: Record<Frequency, string> = {
		daily: 'bg-green-500',
		weekly: 'bg-blue-500',
		monthly: 'bg-amber-500'
	};

	async function handleAssignTasks() {
		if (!selectedUserId || !selectedTemplated) return;

		isAssigning = true;
		let result;

		if (selectedFrequency === 'daily') {
			result = await addUserDailyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				task_date: selectedDate,
				assigned_by: auth.current?.profile.id!,
				notes: ''
			});
		} else if (selectedFrequency === 'weekly') {
			result = await addUserWeeklyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				week_start_date: selectedWeekStart,
				assigned_by: auth.current?.profile.id!,
				notes: ''
			});
		} else {
			result = await addUserMonthlyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				month_date: selectedMonth + '-01',
				assigned_by: auth.current?.profile.id!,
				notes: ''
			});
		}

		if (result.success) {
			selectedTemplateId = '';
			selectedUserId = '';
			refresh();
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
		isAssigning = false;
	}

	let customTitle = $state('');
	let customDesc = $state('');
	let customEstimatedMin = $state(0);
	let customTime = $state('');
	let customRequiresPhoto = $state(false);

	function handleCloseCustomTask() {
		openAddNewTask = false;
		customTitle = '';
		customDesc = '';
		customEstimatedMin = 0;
		customTime = '';
		customRequiresPhoto = false;
	}

	async function handleAddCustomTask() {
		if (!selectedUserId) return;

		isAssigning = true;
		let result;

		if (selectedFrequency === 'daily') {
			result = await addCustomDayliTask({
				user_id: selectedUserId,
				task_date: selectedDate,
				title: customTitle,
				description: customDesc,
				scheduled_time: customTime,
				estimated_minutes: customEstimatedMin,
				requires_photo: customRequiresPhoto
			});
		} else if (selectedFrequency === 'weekly') {
			result = await addCustomWeeklyTask({
				user_id: selectedUserId,
				week_start_date: selectedWeekStart,
				title: customTitle,
				description: customDesc,
				scheduled_time: customTime,
				estimated_minutes: customEstimatedMin,
				requires_photo: customRequiresPhoto
			});
		} else {
			result = await addCustomMonthlyTask({
				user_id: selectedUserId,
				month_date: selectedMonth + '-01',
				title: customTitle,
				description: customDesc,
				scheduled_time: customTime,
				estimated_minutes: customEstimatedMin,
				requires_photo: customRequiresPhoto
			});
		}

		if (result.success) {
			refresh();
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
		isAssigning = false;
		handleCloseCustomTask();
	}

	function refresh() {
		dailyUsersQuery?.refresh();
		weeklyUsersQuery?.refresh();
		monthlyUsersQuery?.refresh();
		dailyWithTasksQuery?.refresh();
		weeklyWithTasksQuery?.refresh();
		monthlyWithTasksQuery?.refresh();
		taskQuery?.refresh();
	}

	// Get task count for user badge in user list
	function getUserTaskCount(user: any): number {
		if (selectedFrequency === 'daily' && user.dailyTasks) return user.dailyTasks.length;
		if (selectedFrequency === 'weekly' && user.weeklyTasks) return user.weeklyTasks.length;
		if (selectedFrequency === 'monthly' && user.monthlyTasks) return user.monthlyTasks.length;
		return 0;
	}

	function getUserExistingTasks(user: any): any[] {
		if (selectedFrequency === 'daily' && user.dailyTasks) return user.dailyTasks;
		if (selectedFrequency === 'weekly' && user.weeklyTasks) return user.weeklyTasks;
		if (selectedFrequency === 'monthly' && user.monthlyTasks) return user.monthlyTasks;
		return [];
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<!-- Header -->
		<header class="top-0 z-10">
			<div class="mx-auto w-auto px-4 py-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-semibold text-foreground">Διαχείριση εργασιών</h1>
						<p class="mt-1 text-sm text-muted-foreground">
							Διαχείριση προτύπων και ανάθεση εργασιών στα μέλη της ομάδας
						</p>
					</div>
				</div>

				<div class="mt-4 -mb-px flex flex-col gap-2 border-b border-border sm:flex-row">
					<button
						onclick={() => (currentView = 'assign')}
						class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {currentView ===
						'assign'
							? 'border-primary text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<Users class="h-4 w-4" />
						Ανάθεση εργασιών
					</button>
					<button
						onclick={() => (currentView = 'templates')}
						class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {currentView ===
						'templates'
							? 'border-primary text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<LayoutTemplate class="h-4 w-4" />
						Πρότυπα
					</button>
					<button
						onclick={() => (currentView = 'assigned')}
						class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {currentView ===
						'assigned'
							? 'border-primary text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						<ListChecks class="h-4 w-4" />
						Ανατεθειμένες εργασίες
					</button>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="mx-auto w-auto px-4 py-8 sm:px-6 lg:px-8">
			{#if currentView === 'assign'}
				<!-- Frequency Pills -->
				<div class="mb-5 inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-1">
					{#each (['daily', 'weekly', 'monthly'] as const) as freq}
						<button
							onclick={() => (selectedFrequency = freq)}
							class="flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-medium transition-all
								{selectedFrequency === freq
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'}"
						>
							<span class="h-1.5 w-1.5 rounded-full {freqDotColors[freq]}"></span>
							{frequencyLabels[freq].label}
						</button>
					{/each}
				</div>

				<div class="grid animate-fade-in-left gap-6 lg:grid-cols-3">
					<!-- User Selection Panel -->
					<Card
						class="rounded-xl bg-gradient-to-br from-muted/50 to-transparent p-8 backdrop-blur-sm"
					>
						<CardHeader>
							<CardTitle class="text-lg">Επιλογή χρήστη</CardTitle>
							<CardDescription
								>Επιλέξτε ένα μέλος της ομάδας για να αναθέσετε εργασίες</CardDescription
							>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="relative">
								<Search
									class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input placeholder="Αναζήτηση χρηστών..." bind:value={searchQuery} class="pl-9" />
							</div>

							<div class="max-h-[600px] space-y-2 overflow-y-auto pr-2">
								{#if isLoadingUsers}
									<div class="flex min-h-[200px] w-full items-center justify-center">
										<Spinner />
									</div>
								{:else}
									{#each filteredUsers() as user, i}
										{@const taskCount = getUserTaskCount(user)}
										<button
											onclick={() => (selectedUserId = user.id)}
											style="animation-delay: {i * 200}ms; animation-fill-mode: backwards;"
											class="flex w-full animate-fade-in-right items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent {selectedUserId ===
											user.id
												? 'border-primary bg-accent'
												: 'border-border'}"
										>
											<Avatar class="h-10 w-10 dark:bg-white">
												<AvatarImage
													src={user.image_url || '/placeholder.svg'}
													alt={user.username}
												/>
												<AvatarFallback>
													{user.username
														.split(' ')
														.map((n) => n[0])
														.join('')}
												</AvatarFallback>
											</Avatar>
											<div class="min-w-0 flex-1">
												<div class="flex items-center justify-between gap-2">
													<p class="truncate text-sm font-medium text-foreground">
														{user.username}
													</p>
													{#if selectedUserId === user.id}
														<Check class="h-4 w-4 shrink-0 text-primary" />
													{/if}
												</div>
												<p class="truncate text-xs text-muted-foreground">{user.email}</p>
												{#if taskCount > 0}
													<div class="mt-1 flex items-center gap-2 py-0.5">
														<Badge
															variant="outline"
															class="rounded-2 h-6 rounded-sm {freqColors[selectedFrequency]} [a&]:hover:bg-opacity-10"
														>
															<CheckCheck className="size-3" />
															{taskCount} εργασίες
														</Badge>
													</div>
												{/if}
											</div>
										</button>
									{/each}
								{/if}
							</div>
						</CardContent>
					</Card>

					<!-- Task Assignment Panel -->
					<div
						class="space-y-6 rounded-xl bg-gradient-to-br from-muted/50 to-transparent p-8 backdrop-blur-sm lg:col-span-2"
					>
						<!-- Assignment Details -->
						<Card class="rounded-md border border-border/50 bg-transparent">
							<CardHeader>
								<CardTitle class="text-lg">Λεπτομέρειες ανάθεσης</CardTitle>
								<CardDescription>{frequencyLabels[selectedFrequency].assignLabel} εργασιών</CardDescription>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2">
										<Label for="task-template">Πρότυπο {frequencyLabels[selectedFrequency].label.toLowerCase()} εργασιών</Label>
										<TemplateSelect
											taskTemplatesWithTasks={filteredTemplates}
											bind:value={selectedTemplateId}
											userHasExistingTasks={userHasExistingDailyTasks ?? false}
										/>
										{#if userHasExistingDailyTasks}
											<p class="text-xs text-muted-foreground">
												Απενεργοποιημένο: Υπάρχουν ήδη ημερήσιες εργασίες για αυτή την ημερομηνία
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label>{frequencyLabels[selectedFrequency].dateLabel}</Label>
										<div class="relative">
											{#if selectedFrequency === 'daily'}
												<InputCalendar id="task_date" bind:value={selectedDate} required />
											{:else if selectedFrequency === 'weekly'}
												<InputCalendar id="week_start_date" bind:value={selectedWeekStart} required />
											{:else}
												<Input type="month" bind:value={selectedMonth} required />
											{/if}
										</div>
										<!-- Date context hint -->
										{#if selectedFrequency === 'weekly' && selectedWeekStart}
											<div class="flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-xs text-muted-foreground">
												<CalendarRange class="h-3.5 w-3.5 text-blue-500" />
												Εβδομάδα: <span class="font-medium text-foreground">{new Date(selectedWeekStart).toLocaleDateString('el-GR')} — {getWeekEndDate(selectedWeekStart)}</span>
											</div>
										{:else if selectedFrequency === 'monthly' && selectedMonth}
											<div class="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-muted-foreground">
												<CalendarDays class="h-3.5 w-3.5 text-amber-500" />
												Μήνας: <span class="font-medium text-foreground">{new Date(selectedMonth + '-01').toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}</span>
											</div>
										{/if}
									</div>
								</div>

								{#if selectedUserIdData && !userHasExistingDailyTasks}
									<div class="rounded-lg border border-border bg-muted/50 p-4">
										<div class="flex items-center gap-3">
											<UserCircle class="h-5 w-5 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium text-foreground">
													Ανάθεση σε: {selectedUserIdData.username}
												</p>
												<p class="text-xs text-muted-foreground">{selectedUserIdData.email}</p>
											</div>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Existing Daily Tasks Warning (only for daily) -->
						{#if userHasExistingDailyTasks}
							{@const existingTasks = getUserExistingTasks(selectedUserIdData)}
							<Card class="rounded-md border border-border/50 bg-transparent">
								<CardHeader>
									<div class="flex items-start justify-between">
										<div>
											<CardTitle class="text-lg">Υπάρχουν ήδη εργασίες</CardTitle>
											<CardDescription class="mt-1">
												Ο χρήστης {selectedUserIdData?.username} έχει ήδη εργασίες για την {new Date(
													selectedDate
												).toLocaleDateString('el-GR')}
											</CardDescription>
										</div>
										<div class="rounded-full bg-primary/10 p-2">
											<AlertCircleIcon class="h-5 w-5 text-primary" />
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div class="space-y-3">
										{#each existingTasks as taskItem, index}
											<div class="space-y-2">
												<div
													style="animation-delay: {index * 100}ms; animation-fill-mode: backwards;"
													class="flex animate-fade-in-down gap-3 rounded-lg px-4"
												>
													<div
														class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
													>
														<PinIcon class="h-4 w-4" />
													</div>
													<div class="min-w-0 flex-1">
														<div class="flex items-start justify-between gap-2">
															<div class="flex-column flex gap-2">
																<h4 class="text-sm font-medium text-foreground">
																	{taskItem?.task_items?.title}
																</h4>
																{#if taskItem?.task_items?.template_id === null}
																	<Badge
																		variant="outline"
																		class="rounded-sm border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
																	>
																		<AlertCircleIcon className="size-3" />
																		Προσαρμοσμένο
																	</Badge>
																{/if}
															</div>

															<div class="flex shrink-0 items-center gap-2">
																{#if taskItem?.task_items?.requires_photo}
																	<Badge variant="outline" class="text-xs">
																		<Camera class="mr-1 h-3 w-3" />
																		Photo
																	</Badge>
																{/if}
																{#if taskItem?.task_items?.estimated_minutes != null && taskItem?.task_items.estimated_minutes > 0}
																	<span class="text-xs whitespace-nowrap text-muted-foreground">
																		{taskItem.task_items.estimated_minutes}m
																	</span>
																{/if}
															</div>
														</div>

														{#if taskItem?.task_items?.description}
															<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
																{taskItem?.task_items?.description}
															</p>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
									<div class="mt-6 flex flex-col gap-3">
										<Button
											variant="outline"
											class="w-75"
											onclick={() => {
												openAddNewTask = true;
											}}
										>
											<Plus class="mr-2 h-4 w-4" />
											Προσθήκη Προσαρμοσμένης Εργασίας
										</Button>
										<div class="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
											<p>
												Για να αναθέσετε νέες εργασίες από πρότυπα, επιλέξτε διαφορετική ημερομηνία
												ή χρήστη.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- Template Preview -->
						{#if selectedTemplated && !userHasExistingDailyTasks}
							<Card class="bg-transparent">
								<CardHeader>
									<div class="flex items-start justify-between">
										<div>
											<CardTitle class="text-lg">{selectedTemplated.name}</CardTitle>
											<CardDescription>{selectedTemplated.description}</CardDescription>
										</div>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<Clock class="h-4 w-4" />
											<span>{totalMinutes} min</span>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div class="space-y-3">
										{#each selectedTemplated.task_items as task, index (task.id)}
											<div
												style="animation-delay: {index * 200}ms; animation-fill-mode: backwards;"
												class="flex animate-fade-in-down gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
											>
												<div
													class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
												>
													{index + 1}
												</div>
												<div class="min-w-0 flex-1">
													<div class="flex items-start justify-between gap-2">
														<h4 class="text-sm font-medium text-foreground">{task.title}</h4>
														<div class="flex shrink-0 items-center gap-2">
															{#if task.requires_photo}
																<Badge variant="outline" class="text-xs">
																	<Camera class="mr-1 h-3 w-3" />
																	Photo
																</Badge>
															{/if}
															{#if task.estimated_minutes! > 0}
																<span class="text-xs whitespace-nowrap text-muted-foreground">
																	{task.estimated_minutes}m
																</span>
															{/if}
														</div>
													</div>
													{#if task.description}
														<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
															{task.description}
														</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>

									<div class="mt-6 flex items-center justify-between gap-4">
										<div class="text-sm text-muted-foreground">
											{selectedTemplated.task_items.length} εργασίες • {totalMinutes} λεπτά
										</div>
										<Button
											disabled={!selectedUserId ||
												!selectedTemplated ||
												isAssigning ||
												userHasExistingDailyTasks}
											class="min-w-[140px]"
											onclick={handleAssignTasks}
										>
											{#if isAssigning}
												<Spinner />
												Ανάθεση...
											{:else}
												Ανάθεση
											{/if}
										</Button>
									</div>
								</CardContent>
							</Card>
						{:else if !userHasExistingDailyTasks}
							<Card class="bg-transparent">
								<CardContent>
									<EmptyComp
										title="Διάλεξτε πρότυπο και αναθέσετε εργασίες στους εργαζομένους."
										description={'Δεν έχει επιλεχθεί κάποιο πρότυπο ή ο εργαζόμενος δεν έχει εργασίες για την επιλεγμένη ημερομηνία'}
										icon={Calendar as any}
										tip="Οτάν βάλετε ένα task template μέτα μπορείτε να αναθέσετε και custom tasks"
									/>
								</CardContent>
							</Card>
						{/if}
					</div>
				</div>
			{:else if currentView === 'templates'}
				<Templates {taskTemplatesWithTasks} />
			{:else if currentView === 'assigned'}
				<AssignedTasks
					{usersWithTasks}
					{selectedFrequency}
					bind:selectedDate
					bind:selectedWeekStart
					bind:selectedMonth
					isLoading={isLoadingUsers}
					onDelete={refresh}
				/>
			{/if}
		</main>
	</div>
{/if}

<!-- ADD CUSTOM TASK MODAL -->
<Modal.Root bind:open={openAddNewTask}>
	<Modal.Content class="flex h-full max-h-[80dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Δημιουργία νέας εργασίας</Modal.Title>
			<Modal.Description>Δημιουργήστε μια Προσαρμοσμένη εργασία εκτός προτύπου ({frequencyLabels[selectedFrequency].label})</Modal.Description>
		</Modal.Header>
		<ScrollArea class="h-[70dvh] w-full">
			<form class="space-y-6 py-4">
				<div class="space-y-2">
					<Input placeholder="Τίτλος εργασίας" bind:value={customTitle} disabled={isAssigning} />

					<Textarea
						placeholder="Περιγραφή (προαιρετικά)"
						rows={2}
						bind:value={customDesc}
						disabled={isAssigning}
					/>

					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-1">
							<Input
								type="number"
								placeholder="Λεπτά"
								bind:value={customEstimatedMin}
								disabled={isAssigning}
							/>
						</div>
						<Input type="time" step="1" bind:value={customTime} disabled={isAssigning} />
					</div>
					<div class="flex items-center justify-between">
						<Label for="template-active">Απαιτείται φοτωγραφία</Label>
						<Switch
							class="cursor-pointer"
							bind:checked={customRequiresPhoto}
							disabled={isAssigning}
						/>
						<input type="hidden" />
					</div>
				</div>

				<Modal.Footer class="py-2">
					<Button type="button" onclick={handleAddCustomTask} disabled={isAssigning}>
						{#if isAssigning}
							<Spinner /> Προσθήκη...
						{:else}
							Προσθήκη εργασίας
						{/if}
					</Button>
					<Button
						variant="outline"
						type="button"
						disabled={isAssigning}
						onclick={handleCloseCustomTask}>Κλείσιμο</Button
					>
				</Modal.Footer>
			</form>
		</ScrollArea>
	</Modal.Content>
</Modal.Root>
