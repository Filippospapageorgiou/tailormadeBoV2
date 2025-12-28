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
		Image,
		Camera,
		CheckCircle2,
		AlertCircle,

		CheckCheck,

		AlertCircleIcon,

		PinIcon



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
		addUserDailyTasks
	} from './data.remote';
	import { toast } from 'svelte-sonner';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import Templates from './components/templates.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';

	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let usersQuery = $derived(getAllUsers(selectedDate));
	let users = $derived(usersQuery.current?.users ?? []);

	let taskQuery = getAllTemplatesTask();
	let taskTemplatesWithTasks = $derived(taskQuery.current?.taskTemplatesWithTasks ?? []);

	// Derived values using $derived
	const filteredUsers = $derived(() => {
		if (!searchQuery) return users;
		return users.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	// State using Svelte 5 runes
	let currentView = $state<'assign' | 'templates' | 'assigned'>('assign');

	let selectedUserId = $state<string>('');
	let selectedTemplateId = $state<string>('');
	let selectedTemplated = $derived(taskTemplatesWithTasks.find((f) => f.id === selectedTemplateId));
	let searchQuery = $state<string>('');
	let isAssigning = $state<boolean>(false);
	let taskItemIds = $derived<string[]>((selectedTemplated?.task_items ?? []).map((v) => v.id));

	const selectedUserIdData = $derived(users.find((u) => u.id === selectedUserId));
	
	// Check if selected user already has tasks for the selected date
	const userHasExistingTasks = $derived(
		selectedUserIdData && selectedUserIdData.dailyTasks && selectedUserIdData.dailyTasks.length > 0
	);

	// Group existing tasks by template
	const groupedExistingTasks = $derived(() => {
		if (!selectedUserIdData || !selectedUserIdData.dailyTasks) return [];
		
		const tasksByTemplate = new Map();
		
		selectedUserIdData.dailyTasks.forEach(task => {
			// Find the task item to get template info
			const taskItem = taskTemplatesWithTasks
				.flatMap(t => t.task_items)
				.find(item => item.id === task.task_item_id);
			
			if (taskItem) {
				const template = taskTemplatesWithTasks.find(t => t.id === taskItem.template_id);
				if (template) {
					if (!tasksByTemplate.has(template.id)) {
						tasksByTemplate.set(template.id, {
							templateName: template.name,
							templateDescription: template.description,
							tasks: []
						});
					}
					tasksByTemplate.get(template.id).tasks.push({
						dailyTask: task,
						taskItem: taskItem
					});
				}
			}
		});
		
		return Array.from(tasksByTemplate.values());
	});

	// ✅ Corrected version
	const totalMinutes = $derived(
		(selectedTemplated?.task_items ?? []).reduce((sum, t) => sum + t.estimated_minutes!, 0)
	);

	async function handleAssignTasks() {
		if (!selectedUserId || !selectedTemplated || !selectedDate) return;

		let result;
		isAssigning = true;
		result = await addUserDailyTasks({
			user_id: selectedUserId,
			task_item_ids: taskItemIds,
			task_date: selectedDate.toString(),
			assigned_by: auth.current?.profile.id!,
			notes: ''
		});

		if (result.success) {
			selectedTemplateId = '';
			selectedUserId = '';
			usersQuery?.refresh();
			taskQuery?.refresh();
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
		isAssigning = false;
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<!-- Header -->
		<header class="top-0 z-10">
			<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
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
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{#if currentView === 'assign'}
				<div class="grid animate-fade-in-left gap-6 lg:grid-cols-3">
					<!-- User Selection Panel -->
					<Card class="bg-transparent lg:col-span-1">
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
								<Input placeholder="Search users..." bind:value={searchQuery} class="pl-9" />
							</div>

							<div class="max-h-[500px] space-y-2 overflow-y-auto pr-2">
								{#if usersQuery.loading}
									<div class="flex min-h-screen w-full items-center justify-center">
										<Spinner />
									</div>
								{:else}
									{#each filteredUsers() as user, i}
										<button
											onclick={() => (selectedUserId = user.id)}
											style="animation-delay: {i * 200}ms; animation-fill-mode: backwards;"
											class="flex w-full animate-fade-in-right items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent {selectedUserId ===
											user.id
												? 'border-primary bg-accent'
												: 'border-border'}"
										>
											<Avatar class="h-10 w-10">
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
												<div class="mt-1 py-0.5 flex items-center gap-2">
													{#if user.dailyTasks && user.dailyTasks.length > 0}
														{@const lentgh = user.dailyTasks.length}
														{@const dailyTasks = user.dailyTasks}
														<Badge
															variant="outline"
															class="rounded-sm border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 [a&]:hover:bg-green-600/10 [a&]:hover:text-green-600/90 dark:[a&]:hover:bg-green-400/10 dark:[a&]:hover:text-green-400/90 h-6 rounded-2"
														>
															<CheckCheck className="size-3" />
															{lentgh} εργασίες
														</Badge>
													{/if}
												</div>
											</div>
										</button>
									{/each}
								{/if}
							</div>
						</CardContent>
					</Card>

					<!-- Task Assignment Panel -->
					<div class="space-y-6 lg:col-span-2">
						<!-- Existing Tasks Warning (if user has tasks) -->
						<!-- Assignment Details -->
						<Card class="bg-transparent">
							<CardHeader>
								<CardTitle class="text-lg">Assignment Details</CardTitle>
								<CardDescription>Configure task assignment parameters</CardDescription>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2">
										<Label for="task-template">Task Template</Label>
										<TemplateSelect
											{taskTemplatesWithTasks}
											bind:value={selectedTemplateId}
											userHasExistingTasks={userHasExistingTasks ?? false}
										/>
										{#if userHasExistingTasks}
											<p class="text-xs text-muted-foreground">
												Απενεργοποιημένο: Υπάρχουν ήδη εργασίες για αυτή την ημερομηνία
											</p>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="task-date">Task Date</Label>
										<div class="relative">
											<Calendar
												class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
											/>
											<InputCalendar id="week_start_date" bind:value={selectedDate} required />
										</div>
									</div>
								</div>

								{#if selectedUserIdData && !userHasExistingTasks}
									<div class="rounded-lg border border-border bg-muted/50 p-4">
										<div class="flex items-center gap-3">
											<UserCircle class="h-5 w-5 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium text-foreground">
													Assigning to: {selectedUserIdData.username}
												</p>
												<p class="text-xs text-muted-foreground">{selectedUserIdData.email}</p>
											</div>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>
						{#if userHasExistingTasks}
							<Card class="bg-transparent">
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
										{#each groupedExistingTasks() as group, index}
											<div
												style="animation-delay: {index * 200}ms; animation-fill-mode: backwards;"
												class="flex animate-fade-in-down gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
											>
												<div
													class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
												>
													<CheckCircle2 class="h-4 w-4" />
												</div>
												<div class="min-w-0 flex-1">
													<div class="flex items-start justify-between gap-2">
														<h4 class="text-sm font-medium text-foreground">
															{group.templateName}
														</h4>
														<Badge variant="secondary" class="text-xs">
															{group.tasks.length} tasks
														</Badge>
													</div>
												</div>
											</div>
											<!-- Tasks List -->
											<div class="space-y-2">
												{#each group.tasks as { dailyTask, taskItem }, taskIndex}
													<div
														style="animation-delay: {(index * group.tasks.length + taskIndex) * 100}ms; animation-fill-mode: backwards;"
														class="flex animate-fade-in-down gap-3 rounded-lg px-4"
													>
														<div
															class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
														>
															<PinIcon class="h-4 w-4" />
														</div>
														<div class="min-w-0 flex-1">
															<div class="flex items-start justify-between gap-2">
																<h4 class="text-sm font-medium text-foreground">{taskItem?.title}</h4>
																<div class="flex shrink-0 items-center gap-2">
																	{#if taskItem?.requires_photo}
																		<Badge variant="outline" class="text-xs">
																			<Camera class="mr-1 h-3 w-3" />
																			Photo
																		</Badge>
																	{/if}
																	{#if taskItem?.estimated_minutes != null && taskItem.estimated_minutes > 0}
																		<span class="text-xs whitespace-nowrap text-muted-foreground">
																			{taskItem.estimated_minutes}m
																		</span>
																	{/if}
																</div>
															</div>
															{#if taskItem?.description}
																<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
																	{taskItem.description}
																</p>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{/each}
									</div>
									<div class="mt-6 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
										<p>Για να αναθέσετε νέες εργασίες, επιλέξτε διαφορετική ημερομηνία ή χρήστη.</p>
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- Template Preview -->
						{#if selectedTemplated && !userHasExistingTasks}
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
											{selectedTemplated.task_items.length} tasks • Est. {totalMinutes} minutes
										</div>
										<Button
											disabled={!selectedUserId ||
												!selectedTemplated ||
												isAssigning ||
												userHasExistingTasks}
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
						{:else if !userHasExistingTasks}
							<Card class="border-dashed">
								<CardContent class="flex flex-col items-center justify-center py-12">
									<div class="mb-4 rounded-full bg-muted p-3">
										<Calendar class="h-6 w-6 text-muted-foreground" />
									</div>
									<h3 class="mb-1 font-medium text-foreground">
										Διάλεξτε πρότυπο και αναθέσετε εργασίες στους εργαζομένους.
									</h3>
									<p class="text-center text-sm text-muted-foreground">
										Δεν έχει επιλεχθεί κάποιο πρότυπο ή ο εργαζόμενος δεν έχει εργασίες για την
										επιλεγμένη ημερομηνία
									</p>
								</CardContent>
							</Card>
						{/if}
					</div>
				</div>
			{:else if currentView === 'templates'}
				<Templates {taskTemplatesWithTasks} />
			{:else if currentView === 'assigned'}{/if}
		</main>
	</div>
{/if}
