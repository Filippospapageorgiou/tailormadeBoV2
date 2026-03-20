<script lang="ts">
	import { ListChecks, TrendingUp, Users, Shield } from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import OrgTasksTab from '$lib/components/custom/tasks/OrgTasksTab.svelte';
	import AssignTasksTab from './components/assign-tasks-tab.svelte';
	import Templates from './components/templates.svelte';
	import {
		authenticatedAccess,
		getAllTemplatesTask,
		getAllUsersWithTasks,
		getAllUsersWithWeeklyTasks,
		getAllUsersWithMonthlyTasks,
		getAllUsers
	} from './data.remote';
	import { toast } from 'svelte-sonner';

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	// ─── Overview tab data ───
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

	let dailyUsersQuery = $derived(getAllUsers(selectedDate));
	let dailyUsers = $derived(dailyUsersQuery.current?.users ?? []);

	let dailyWithTasksQuery = $derived(getAllUsersWithTasks(selectedDate));
	let weeklyWithTasksQuery = $derived(getAllUsersWithWeeklyTasks(selectedWeekStart));
	let monthlyWithTasksQuery = $derived(getAllUsersWithMonthlyTasks(selectedMonth + '-01'));

	let dailyUsersWithTasks = $derived(dailyWithTasksQuery.current?.users ?? []);
	let weeklyUsersWithTasks = $derived(weeklyWithTasksQuery.current?.users ?? []);
	let monthlyUsersWithTasks = $derived(monthlyWithTasksQuery.current?.users ?? []);

	let taskStats = $derived.by(() => {
		const map = new Map<
			string,
			{
				userId: string;
				daily: { total: number; completed: number };
				weekly: { total: number; completed: number };
				monthly: { total: number; completed: number };
			}
		>();

		// Seed every org user with zero stats so they always appear
		for (const u of dailyUsers) {
			map.set(u.id, {
				userId: u.id,
				daily: { total: 0, completed: 0 },
				weekly: { total: 0, completed: 0 },
				monthly: { total: 0, completed: 0 }
			});
		}

		const ensure = (id: string) => {
			if (!map.has(id))
				map.set(id, {
					userId: id,
					daily: { total: 0, completed: 0 },
					weekly: { total: 0, completed: 0 },
					monthly: { total: 0, completed: 0 }
				});
			return map.get(id)!;
		};

		for (const u of dailyUsersWithTasks) {
			const s = ensure(u.id);
			const tasks = (u as any).dailyTasks ?? [];
			s.daily.total = tasks.length;
			s.daily.completed = tasks.filter((t: any) => t.completed_at !== null).length;
		}
		for (const u of weeklyUsersWithTasks) {
			const s = ensure(u.id);
			const tasks = (u as any).weeklyTasks ?? [];
			s.weekly.total = tasks.length;
			s.weekly.completed = tasks.filter((t: any) => t.completed_at !== null).length;
		}
		for (const u of monthlyUsersWithTasks) {
			const s = ensure(u.id);
			const tasks = (u as any).monthlyTasks ?? [];
			s.monthly.total = tasks.length;
			s.monthly.completed = tasks.filter((t: any) => t.completed_at !== null).length;
		}

		return [...map.values()];
	});

	// ─── Templates tab data ───
	let taskQuery = getAllTemplatesTask();
	let taskTemplatesWithTasks = $derived(taskQuery.current?.taskTemplatesWithTasks ?? []);
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto px-4 py-6 md:px-6">
			<!-- Header -->
			<div class="mb-8">
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<ListChecks class="h-5 w-5" />
					</div>
					<div>
						<h1 class="text-2xl font-semibold tracking-tight text-foreground">
							Διαχείριση Εργασιών
						</h1>
						<p class="mt-0.5 text-sm text-muted-foreground">
							Ανάθεση, παρακολούθηση και πρότυπα εργασιών για όλο το προσωπικό
						</p>
					</div>
				</div>
			</div>

			<!-- Tabs -->
			<Tabs.Root value="overview" class="w-full overflow-visible">
				<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
					{#each [
						{ value: 'overview', icon: TrendingUp, label: 'Επισκόπηση' },
						{ value: 'assign', icon: Shield, label: 'Ανάθεση' },
						{ value: 'templates', icon: Users, label: 'Πρότυπα' }
					] as tab}
						<Tabs.Trigger
							value={tab.value}
							class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground sm:px-4"
						>
							<tab.icon class="h-4 w-4 shrink-0" />
							<span class="hidden sm:inline">{tab.label}</span>
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				<!-- Tab 1: Overview -->
				<Tabs.Content value="overview" class="mt-6 animate-fade-in-left space-y-6">
					<OrgTasksTab {taskStats} employees={dailyUsers} />
				</Tabs.Content>

				<!-- Tab 2: Assign -->
				<Tabs.Content value="assign" class="mt-6 animate-fade-in-left">
					<AssignTasksTab />
				</Tabs.Content>

				<!-- Tab 3: Templates -->
				<Tabs.Content value="templates" class="mt-6 animate-fade-in-left">
					<Templates {taskTemplatesWithTasks} />
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
{/if}
