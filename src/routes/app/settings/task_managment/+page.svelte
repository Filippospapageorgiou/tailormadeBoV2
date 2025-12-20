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
		LayoutTemplate
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
	import { authenticatedAccess, getAllTemplatesTask, getAllUsers } from './data.remote';
	import { toast } from 'svelte-sonner';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import Templates from './components/templates.svelte';

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let usersQuery = getAllUsers();
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

	let selectedUser = $state<string>('');
	let selectedTemplate = $state<string>('');
	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);
	let searchQuery = $state<string>('');
	let isAssigning = $state<boolean>(false);

	const selectedUserData = $derived(users.find((u) => u.id === selectedUser));
	const totalMinutes = $derived(0);

	let taskTemplates = ['1'];
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
						<!--<Badge variant="secondary" class="text-xs">{assignedTasks.length}</Badge> -->
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
											onclick={() => (selectedUser = user.id)}
											style="animation-delay: {i * 200}ms; animation-fill-mode: backwards;"
											class="flex w-full animate-fade-in-right items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent {selectedUser ===
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
													{#if selectedUser === user.id}
														<Check class="h-4 w-4 shrink-0 text-primary" />
													{/if}
												</div>
												<p class="truncate text-xs text-muted-foreground">{user.email}</p>
												<Badge variant="secondary" class="mt-1 text-xs">{user.role}</Badge>
											</div>
										</button>
									{/each}
								{/if}
							</div>
						</CardContent>
					</Card>

					<!-- Task Assignment Panel -->
					<div class="space-y-6 lg:col-span-2">
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
										<TemplateSelect {taskTemplates} bind:value={selectedTemplate} />
									</div>

									<div class="space-y-2">
										<Label for="task-date">Task Date</Label>
										<div class="relative">
											<Calendar
												class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
											/>
											<Input id="task-date" type="date" bind:value={selectedDate} class="pl-9" />
										</div>
									</div>
								</div>

								{#if selectedUserData}
									<div class="rounded-lg border border-border bg-muted/50 p-4">
										<div class="flex items-center gap-3">
											<UserCircle class="h-5 w-5 text-muted-foreground" />
											<div>
												<p class="text-sm font-medium text-foreground">
													Assigning to: {selectedUserData.username}
												</p>
												<p class="text-xs text-muted-foreground">{selectedUserData.email}</p>
											</div>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Template Preview -->
						{#if true}
							<Card class="bg-transparent">
								<CardHeader>
									<div class="flex items-start justify-between">
										<div>
											<CardTitle class="text-lg"></CardTitle>
											<CardDescription></CardDescription>
										</div>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<Clock class="h-4 w-4" />
											<span>{totalMinutes} min</span>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div class="space-y-3"></div>

									<div class="mt-6 flex items-center justify-between gap-4">
										<div class="text-sm text-muted-foreground">
											<!--{selectedTemplateData.tasks.length} tasks • Est. {totalMinutes} minutes-->
										</div>
										<Button
											disabled={!selectedUser || !selectedTemplate || isAssigning}
											class="min-w-[140px]"
										>
											{isAssigning ? 'Assigning...' : 'Assign Tasks'}
										</Button>
									</div>
								</CardContent>
							</Card>
						{:else}
							<Card class="border-dashed bg-white">
								<CardContent class="flex flex-col items-center justify-center py-12">
									<div class="mb-4 rounded-full bg-muted p-3">
										<Calendar class="h-6 w-6 text-muted-foreground" />
									</div>
									<h3 class="mb-1 font-medium text-foreground">No Template Selected</h3>
									<p class="text-center text-sm text-muted-foreground">
										Select a task template to preview and assign tasks
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
