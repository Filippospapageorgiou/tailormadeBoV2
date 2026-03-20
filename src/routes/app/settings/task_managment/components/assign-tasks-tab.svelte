<script lang="ts">
	import {
		Search,
		UserCircle,
		ListChecks,
		Camera,
		Clock,
		Plus,
		CheckCheck,
		CalendarRange,
		CalendarDays,
		Calendar,
		AlertCircleIcon,
		CheckCircle2,
		PinIcon
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Spinner } from '$lib/components/ui/spinner';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import InputCalendar from '$lib/components/custom/inputCalendar.svelte';
	import AssignedTasks from './assigned-tasks.svelte';
	import { toast } from 'svelte-sonner';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { cn } from '$lib/utils';
	import {
		getAllUsers,
		getAllUsersWeekly,
		getAllUsersMonthly,
		getAllUsersWithTasks,
		getAllUsersWithWeeklyTasks,
		getAllUsersWithMonthlyTasks,
		getAllTemplatesTask,
		addUserDailyTasks,
		addUserWeeklyTasks,
		addUserMonthlyTasks,
		addCustomDayliTask,
		addCustomWeeklyTask,
		addCustomMonthlyTask
	} from '../data.remote';

	// ─── Auth ───
	let profile = getProfileContext();

	// ─── Frequency ───
	type Frequency = 'daily' | 'weekly' | 'monthly';
	let selectedFrequency = $state<Frequency>('daily');

	// ─── Dates ───
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

	// ─── Queries ───
	let dailyUsersQuery = $derived(getAllUsers(selectedDate));
	let weeklyUsersQuery = $derived(getAllUsersWeekly(selectedWeekStart));
	let monthlyUsersQuery = $derived(getAllUsersMonthly(selectedMonth + '-01'));

	let dailyWithTasksQuery = $derived(getAllUsersWithTasks(selectedDate));
	let weeklyWithTasksQuery = $derived(getAllUsersWithWeeklyTasks(selectedWeekStart));
	let monthlyWithTasksQuery = $derived(getAllUsersWithMonthlyTasks(selectedMonth + '-01'));

	let taskQuery = getAllTemplatesTask();

	// ─── Derived data ───
	let users = $derived(
		selectedFrequency === 'daily'
			? (dailyUsersQuery.current?.users ?? [])
			: selectedFrequency === 'weekly'
				? (weeklyUsersQuery.current?.users ?? [])
				: (monthlyUsersQuery.current?.users ?? [])
	);

	let usersWithTasks = $derived(
		selectedFrequency === 'daily'
			? (dailyWithTasksQuery.current?.users ?? [])
			: selectedFrequency === 'weekly'
				? (weeklyWithTasksQuery.current?.users ?? [])
				: (monthlyWithTasksQuery.current?.users ?? [])
	);

	let isLoadingUsers = $derived(
		selectedFrequency === 'daily'
			? dailyUsersQuery.loading
			: selectedFrequency === 'weekly'
				? weeklyUsersQuery.loading
				: monthlyUsersQuery.loading
	);

	let taskTemplatesWithTasks = $derived(taskQuery.current?.taskTemplatesWithTasks ?? []);
	let filteredTemplates = $derived(
		taskTemplatesWithTasks.filter((t) => t.frequency === selectedFrequency)
	);

	// ─── Selection state ───
	let selectedUserId = $state('');
	let selectedTemplateId = $state('');
	let searchQuery = $state('');
	let isAssigning = $state(false);

	let selectedUser = $derived(users.find((u) => u.id === selectedUserId));
	let selectedTemplate = $derived(filteredTemplates.find((t) => t.id === selectedTemplateId));
	let taskItemIds = $derived((selectedTemplate?.task_items ?? []).map((v) => v.id));
	let totalMinutes = $derived(
		(selectedTemplate?.task_items ?? []).reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0)
	);

	let filteredUsers = $derived(
		searchQuery.trim()
			? users.filter(
					(u) =>
						u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
						u.email.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: users
	);

	// ─── Existing tasks check ───
	let userHasExistingTasks = $derived(() => {
		if (!selectedUser) return false;
		if (selectedFrequency === 'daily') return ((selectedUser as any).dailyTasks?.length ?? 0) > 0;
		if (selectedFrequency === 'weekly') return ((selectedUser as any).weeklyTasks?.length ?? 0) > 0;
		return ((selectedUser as any).monthlyTasks?.length ?? 0) > 0;
	});

	function getUserTaskCount(user: any): number {
		if (selectedFrequency === 'daily') return user.dailyTasks?.length ?? 0;
		if (selectedFrequency === 'weekly') return user.weeklyTasks?.length ?? 0;
		return user.monthlyTasks?.length ?? 0;
	}

	// ─── Reset on frequency change ───
	$effect(() => {
		selectedFrequency;
		selectedUserId = '';
		selectedTemplateId = '';
		searchQuery = '';
	});

	// ─── Frequency config ───
	const freqConfig: Record<
		Frequency,
		{ label: string; color: string; dot: string; dateLabel: string }
	> = {
		daily: {
			label: 'Ημερήσιο',
			color: 'text-emerald-600 dark:text-emerald-400',
			dot: 'bg-emerald-500',
			dateLabel: 'Ημερομηνία'
		},
		weekly: {
			label: 'Εβδομαδιαίο',
			color: 'text-blue-600 dark:text-blue-400',
			dot: 'bg-blue-500',
			dateLabel: 'Εβδομάδα (αρχή)'
		},
		monthly: {
			label: 'Μηνιαίο',
			color: 'text-amber-600 dark:text-amber-400',
			dot: 'bg-amber-500',
			dateLabel: 'Μήνας'
		}
	};

	// ─── Assign ───
	async function handleAssign() {
		if (!selectedUserId || !selectedTemplate) return;
		isAssigning = true;
		let result;

		if (selectedFrequency === 'daily') {
			result = await addUserDailyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				task_date: selectedDate,
				assigned_by: profile!.id,
				notes: ''
			});
		} else if (selectedFrequency === 'weekly') {
			result = await addUserWeeklyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				week_start_date: selectedWeekStart,
				assigned_by: profile!.id,
				notes: ''
			});
		} else {
			result = await addUserMonthlyTasks({
				user_id: selectedUserId,
				task_item_ids: taskItemIds,
				month_date: selectedMonth + '-01',
				assigned_by: profile!.id,
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

	// ─── Custom task ───
	let openCustomTask = $state(false);
	let customTitle = $state('');
	let customDesc = $state('');
	let customEstimatedMin = $state(0);
	let customTime = $state('');
	let customRequiresPhoto = $state(false);

	function closeCustomTask() {
		openCustomTask = false;
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
		closeCustomTask();
	}

	// ─── Refresh ───
	function refresh() {
		dailyUsersQuery?.refresh();
		weeklyUsersQuery?.refresh();
		monthlyUsersQuery?.refresh();
		dailyWithTasksQuery?.refresh();
		weeklyWithTasksQuery?.refresh();
		monthlyWithTasksQuery?.refresh();
	}
</script>

<div class="space-y-6">
	<!-- ─── Frequency + Date row ─── -->
	<div class="flex flex-wrap items-center gap-3">
		<!-- Frequency pills -->
		<div class="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
			{#each ['daily', 'weekly', 'monthly'] as Frequency[] as freq}
				<button
					onclick={() => (selectedFrequency = freq)}
					class={cn(
						'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
						selectedFrequency === freq
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					<span class="size-1.5 rounded-full {freqConfig[freq].dot}"></span>
					{freqConfig[freq].label}
				</button>
			{/each}
		</div>

		<!-- Date picker -->
		<div class="flex items-center gap-2">
			{#if selectedFrequency === 'daily'}
				<InputCalendar bind:value={selectedDate} required />
			{:else if selectedFrequency === 'weekly'}
				<div class="flex items-center gap-2">
					<InputCalendar bind:value={selectedWeekStart} required />
					<div
						class="hidden items-center gap-2 rounded-lg border border-blue-200/50 bg-blue-50/50 px-3 py-1.5 text-xs sm:flex dark:border-blue-500/20 dark:bg-blue-500/5"
					>
						<CalendarRange class="h-3.5 w-3.5 text-blue-500" />
						<span class="text-muted-foreground">έως</span>
						<span class="font-medium">{getWeekEndDate(selectedWeekStart)}</span>
					</div>
				</div>
			{:else}
				<Input type="month" bind:value={selectedMonth} class="w-auto" />
			{/if}
			{#if isLoadingUsers}
				<Spinner class="h-4 w-4 text-muted-foreground" />
			{/if}
		</div>
	</div>

	<!-- ─── Main 2-column layout ─── -->
	<div class="grid gap-4 lg:grid-cols-5">
		<!-- Left: User list -->
		<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-2">
			<Card.Header class="px-4 pt-4 pb-3">
				<Card.Title class="text-sm font-medium">Επιλογή υπαλλήλου</Card.Title>
				<div class="relative mt-1">
					<Search
						class="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
					/>
					<Input bind:value={searchQuery} placeholder="Αναζήτηση..." class="h-8 pl-8 text-sm" />
				</div>
			</Card.Header>
			<Card.Content class="px-2 pb-3">
				<ScrollArea class="h-[320px]">
					<div class="space-y-1 px-2">
						{#if isLoadingUsers}
							<div class="flex justify-center py-8">
								<Spinner class="h-5 w-5" />
							</div>
						{:else if filteredUsers.length === 0}
							<div
								class="flex flex-col items-center py-8 text-center text-sm text-muted-foreground"
							>
								<UserCircle class="mb-2 h-8 w-8 opacity-30" />
								Δεν βρέθηκαν χρήστες
							</div>
						{:else}
							{#each filteredUsers as user (user.id)}
								{@const taskCount = getUserTaskCount(user)}
								<button
									onclick={() => (selectedUserId = selectedUserId === user.id ? '' : user.id)}
									class={cn(
										'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
										selectedUserId === user.id
											? 'bg-primary/10 ring-1 ring-primary/30'
											: 'hover:bg-muted/60'
									)}
								>
									<Avatar class="h-8 w-8 shrink-0">
										<AvatarImage class="dark:bg-white" src={user.image_url} />
										<AvatarFallback class="text-[10px]">
											{user.username.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-foreground">{user.username}</p>
										<p class="truncate text-[11px] text-muted-foreground">{user.email}</p>
									</div>
									{#if taskCount > 0}
										<span class="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
											{taskCount}
										</span>
									{/if}
									{#if selectedUserId === user.id}
										<CheckCircle2 class="h-4 w-4 shrink-0 text-primary" />
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Right: Template picker + actions -->
		<Card.Root class="overflow-hidden rounded-xl border border-border/60 bg-card lg:col-span-3">
			<Card.Header class="px-4 pt-4 pb-3">
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-sm font-medium">Επιλογή προτύπου</Card.Title>
						{#if selectedUser}
							<Card.Description class="text-xs">
								για <span class="font-medium text-foreground">{selectedUser.username}</span>
								{#if userHasExistingTasks()}
									<span class="ml-1 text-amber-600 dark:text-amber-400">· έχει ήδη εργασίες</span>
								{/if}
							</Card.Description>
						{:else}
							<Card.Description class="text-xs">Πρώτα επιλέξτε υπάλληλο</Card.Description>
						{/if}
					</div>
					{#if selectedUser}
						<Button
							variant="outline"
							size="sm"
							class="h-8 gap-1.5 text-xs"
							disabled={!selectedUserId || isAssigning}
							onclick={() => (openCustomTask = true)}
						>
							<Plus class="h-3.5 w-3.5" />
							Προσαρμοσμένη
						</Button>
					{/if}
				</div>
			</Card.Header>
			<Card.Content class="px-3 pb-3">
				<ScrollArea class="h-[260px]">
					<div class="space-y-2 px-1">
						{#if !selectedUser}
							<div
								class="flex h-[200px] flex-col items-center justify-center text-center text-sm text-muted-foreground"
							>
								<UserCircle class="mb-2 h-8 w-8 opacity-30" />
								Επιλέξτε πρώτα υπάλληλο από τα αριστερά
							</div>
						{:else if filteredTemplates.length === 0}
							<div
								class="flex h-[200px] flex-col items-center justify-center text-center text-sm text-muted-foreground"
							>
								<ListChecks class="mb-2 h-8 w-8 opacity-30" />
								Δεν υπάρχουν πρότυπα για {freqConfig[selectedFrequency].label.toLowerCase()} συχνότητα
							</div>
						{:else}
							{#each filteredTemplates as template (template.id)}
								{@const mins = template.task_items.reduce(
									(s, t) => s + (t.estimated_minutes ?? 0),
									0
								)}
								{@const isSelected = selectedTemplateId === template.id}
								<div
									class={cn(
										'rounded-lg border transition-all duration-200',
										isSelected
											? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
											: 'border-border/50 bg-card'
									)}
								>
									<!-- Header row — click to select -->
									<button
										onclick={() =>
											(selectedTemplateId = isSelected ? '' : template.id)}
										class="flex w-full items-start gap-3 px-3.5 py-3 text-left"
									>
										<!-- Task count badge — prominent -->
										<div
											class={cn(
												'mt-0.5 flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg text-center transition-colors',
												isSelected
													? 'bg-primary text-primary-foreground'
													: 'bg-muted text-muted-foreground'
											)}
										>
											<span class="text-sm font-bold leading-none">
												{template.task_items.length}
											</span>
											<span class="text-[9px] leading-none opacity-80">εργ.</span>
										</div>

										<!-- Name + meta -->
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-semibold text-foreground">
												{template.name}
											</p>
											<div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
												{#if mins > 0}
													<span class="flex items-center gap-1">
														<Clock class="h-3 w-3" />
														{mins} λ
													</span>
												{/if}
												{#if template.task_items.some((t) => t.requires_photo)}
													<span class="flex items-center gap-1">
														<Camera class="h-3 w-3" />
														Φωτογραφία
													</span>
												{/if}
												{#if template.description}
													<span class="truncate opacity-70">{template.description}</span>
												{/if}
											</div>
										</div>

										<!-- Checkmark -->
										{#if isSelected}
											<CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
										{/if}
									</button>

									<!-- Expanded task list — visible when selected -->
									{#if isSelected}
										<div class="border-t border-primary/15 px-3.5 pb-3 pt-2">
											<p class="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
												Εργασίες προτύπου
											</p>
											<div class="space-y-1.5">
												{#each template.task_items as item, i (item.id)}
													<div class="flex items-start gap-2.5 rounded-md bg-background/60 px-2.5 py-2">
														<span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
															{i + 1}
														</span>
														<div class="min-w-0 flex-1">
															<p class="text-xs font-medium text-foreground">{item.title}</p>
															{#if item.description}
																<p class="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
															{/if}
														</div>
														<div class="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
															{#if item.estimated_minutes}
																<span class="flex items-center gap-0.5">
																	<Clock class="h-2.5 w-2.5" />{item.estimated_minutes}λ
																</span>
															{/if}
															{#if item.requires_photo}
																<Camera class="h-2.5 w-2.5 text-amber-500" />
															{/if}
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</ScrollArea>

				<!-- Assign button -->
				{#if selectedUser && selectedTemplate}
					<div class="mt-3 rounded-lg border border-border/40 bg-muted/30 p-3">
						<div class="mb-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<PinIcon class="h-3 w-3" />
								<span class="font-medium text-foreground">{selectedUser.username}</span>
							</span>
							<span>·</span>
							<span class="font-medium text-foreground">{selectedTemplate.name}</span>
							<span>·</span>
							<span>{selectedTemplate.task_items.length} εργασίες</span>
							{#if totalMinutes > 0}
								<span>· {totalMinutes} λ</span>
							{/if}
						</div>
						{#if userHasExistingTasks()}
							<div
								class="mb-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400"
							>
								<AlertCircleIcon class="h-3 w-3" />
								Ο χρήστης έχει ήδη εργασίες για αυτή την περίοδο
							</div>
						{/if}
						<Button onclick={handleAssign} disabled={isAssigning} class="w-full gap-2" size="sm">
							{#if isAssigning}
								<Spinner class="h-3.5 w-3.5" />
								Ανάθεση...
							{:else}
								<CheckCheck class="h-3.5 w-3.5" />
								Ανάθεση εργασιών
							{/if}
						</Button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- ─── Divider ─── -->
	<div class="flex items-center gap-3">
		<div class="h-px flex-1 bg-border/60"></div>
		<span class="text-xs font-medium text-muted-foreground">Ανατεθειμένες εργασίες περιόδου</span>
		<div class="h-px flex-1 bg-border/60"></div>
	</div>

	<!-- ─── Assigned tasks view ─── -->
	<AssignedTasks
		{usersWithTasks}
		{selectedFrequency}
		bind:selectedDate
		bind:selectedWeekStart
		bind:selectedMonth
		isLoading={isLoadingUsers}
		onDelete={refresh}
	/>
</div>

<!-- ─── Custom task modal ─── -->
<Modal.Root bind:open={openCustomTask}>
	<Modal.Content class="flex h-full max-h-[80dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Προσαρμοσμένη εργασία</Modal.Title>
			<Modal.Description>
				Νέα εργασία εκτός προτύπου για
				<span class="font-medium text-foreground">{selectedUser?.username}</span>
				({freqConfig[selectedFrequency].label})
			</Modal.Description>
		</Modal.Header>
		<ScrollArea class="h-[60dvh] w-full">
			<div class="space-y-4 py-4">
				<Input placeholder="Τίτλος εργασίας" bind:value={customTitle} disabled={isAssigning} />
				<Textarea
					placeholder="Περιγραφή (προαιρετικά)"
					rows={2}
					bind:value={customDesc}
					disabled={isAssigning}
				/>
				<div class="grid grid-cols-2 gap-2">
					<Input
						type="number"
						placeholder="Λεπτά"
						bind:value={customEstimatedMin}
						disabled={isAssigning}
					/>
					<Input type="time" step="1" bind:value={customTime} disabled={isAssigning} />
				</div>
				<div class="flex items-center justify-between">
					<Label>Απαιτείται φωτογραφία</Label>
					<Switch
						class="cursor-pointer"
						bind:checked={customRequiresPhoto}
						disabled={isAssigning}
					/>
				</div>
			</div>
		</ScrollArea>
		<Modal.Footer>
			<Button onclick={handleAddCustomTask} disabled={isAssigning || !customTitle.trim()}>
				{#if isAssigning}
					<Spinner class="h-3.5 w-3.5" />
					Προσθήκη...
				{:else}
					Προσθήκη εργασίας
				{/if}
			</Button>
			<Button variant="outline" onclick={closeCustomTask} disabled={isAssigning}>Κλείσιμο</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>
