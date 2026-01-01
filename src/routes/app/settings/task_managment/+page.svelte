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
		addUserDailyTasks,
		addCustomDayliTask
	} from './data.remote';
	import { toast } from 'svelte-sonner';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import Templates from './components/templates.svelte';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import type { TaskItem, TaskTemplateWithTasks } from '$lib/models/tasks.types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Modal from '$lib/components/ui/modal';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import AssignedTasks from './components/assigned-tasks.svelte';

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
	let openAddNewTask = $state(false);
	let searchQuery = $state<string>('');
	let isAssigning = $state<boolean>(false);
	let taskItemIds = $derived<string[]>((selectedTemplated?.task_items ?? []).map((v) => v.id));

	const selectedUserIdData = $derived(users.find((u) => u.id === selectedUserId));

	// Check if selected user already has tasks for the selected date
	const userHasExistingTasks = $derived(
		selectedUserIdData && selectedUserIdData.dailyTasks && selectedUserIdData.dailyTasks.length > 0
	);

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
		if (!selectedUserId || !selectedDate) return;

		let result;
		isAssigning = true;
		result = await addCustomDayliTask({
			user_id: selectedUserId,
			task_date: selectedDate,
			title: customTitle,
			description: customDesc,
			scheduled_time: customTime,
			estimated_minutes: customEstimatedMin,
			requires_photo: customRequiresPhoto
		});
		if (result.success) {
			refresh();
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
		isAssigning = false;
		handleCloseCustomTask();
	}

	function refresh(){
		usersQuery?.refresh();
		taskQuery?.refresh();
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
												<div class="mt-1 flex items-center gap-2 py-0.5">
													{#if user.dailyTasks && user.dailyTasks.length > 0}
														{@const lentgh = user.dailyTasks.length}
														{@const dailyTasks = user.dailyTasks}
														<Badge
															variant="outline"
															class="rounded-2 h-6 rounded-sm border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 [a&]:hover:bg-green-600/10 [a&]:hover:text-green-600/90 dark:[a&]:hover:bg-green-400/10 dark:[a&]:hover:text-green-400/90"
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
										{#each selectedUserIdData?.dailyTasks as taskItem, index}
											<!-- Tasks List -->
											<div class="space-y-2">
												<div
													style="animation-delay: {index *
														selectedUserIdData?.dailyTasks.length! *
														100}ms; animation-fill-mode: backwards;"
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
																	<!-- Changed from task_item to task_items -->
																</h4>
																{#if taskItem?.task_items?.template_id === null}
																	<Badge
																		variant="outline"
																		class="rounded-sm border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 [a&]:hover:bg-amber-600/10 [a&]:hover:text-amber-600/90 dark:[a&]:hover:bg-amber-400/10 dark:[a&]:hover:text-amber-400/90"
																	>
																		<AlertCircleIcon className="size-3" />
																		Προσαρμοσμένο
																	</Badge>
																{/if}
															</div>

															<div class="flex shrink-0 items-center gap-2">
																{#if taskItem?.task_items?.requires_photo}
																	<!-- Changed -->
																	<Badge variant="outline" class="text-xs">
																		<Camera class="mr-1 h-3 w-3" />
																		Photo
																	</Badge>
																{/if}
																{#if taskItem?.task_items?.estimated_minutes != null && taskItem?.task_items.estimated_minutes > 0}
																	<!-- Changed -->
																	<span class="text-xs whitespace-nowrap text-muted-foreground">
																		{taskItem.task_items.estimated_minutes}m
																	</span>
																{/if}
															</div>
														</div>

														{#if taskItem?.task_items?.description}
															<!-- Changed -->
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
			{:else if currentView === 'assigned'}
				{#if currentView === 'assigned'}
					<AssignedTasks {users} bind:selectedDate isLoading={usersQuery.loading} onDelete={refresh}/>
				{/if}
			{/if}
		</main>
	</div>
{/if}

<!-- ADD TEMPLATE MODAL -->
<Modal.Root bind:open={openAddNewTask}>
	<Modal.Content class="flex h-[45dvh] max-h-[45dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Δημιουργία νέας εργασίας</Modal.Title>
			<Modal.Description>Δημιουργήστε μια Προσαρμοσμένη εργασία εκτός προτύπου</Modal.Description>
		</Modal.Header>
		<ScrollArea class="h-[40dvh] w-full">
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
