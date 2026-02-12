<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { X, RefreshCcw, Plus, Search, UserPlus, Mail, Users, Phone, Shield, Coffee, ChefHat, Crown } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DataTable from './data-table.svelte';
	import { columns } from './colums';
	import { authenticatedAccess, getAllUserFromOrg } from './data.remote';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { inviteUser } from './data.remote';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { toast } from 'svelte-sonner';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import PhoneCells from './PhoneCells.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Only call auth once and store the result
	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let query = getAllUserFromOrg();
	let profiles = $derived(query.current?.users ?? []);
	let invite = $state(false);

	let inviteUserDialog: boolean = $state(false);
	let inviteEmail: string = $state('');

	let activeTab = $state(page.url.searchParams.get('tab') || 'users');

	// Role stats derived from profiles
	let roleStats = $derived.by(() => {
		const stats = { managers: 0, headBaristas: 0, baristas: 0, bakersRegisters: 0};
		for (const p of profiles) {
			const role = p.role?.toLowerCase();
			if (role === 'admin' || role === 'super_admin') stats.managers++;
			else if (role === 'head_barista') stats.headBaristas++;
			else if (role === 'barista') stats.baristas++;
			else if (role === 'baker' || role === 'register') stats.bakersRegisters++;
		}
		return stats;
	});

	function handleTabChange(value: string | undefined) {
		if (!value) return;
		activeTab = value;
		const url = new URL(page.url);
		url.searchParams.set('tab', value);
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function handleIviteUser() {
		inviteUserDialog = true;
	}

	async function handleInviteUser() {
		invite = true;
		try {
			const result = await inviteUser({
				email: inviteEmail
			});

			if (result?.success) {
				showSuccessToast('Επιτυχία', result?.message);
				inviteEmail = '';
			} else {
				showFailToast('Σφάλμα', result?.message || 'Αποτυχία αποστολής πρόσκλησης');
			}
		} catch (error) {
			console.error('Σφάλμα κατά την πρόσκληση χρήστη:', error);
			showFailToast('Σφάλμα', 'Αποτυχία αποστολής πρόσκλησης');
		} finally {
			inviteUserDialog = false;
			invite = false;
		}
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto px-4 pt-6 pb-10 md:px-6 lg:px-8">
			<!-- Header Section -->
			<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="space-y-1">
					<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
						Διαχείριση Χρηστών & Οργανισμού
					</h1>
					<p class="text-sm text-muted-foreground">
						Διαχειριστείτε τα μέλη, τους ρόλους και τα δικαιώματα του οργανισμού σας
					</p>
				</div>
				<Button
					variant="default"
					size="sm"
					class="h-9 w-fit cursor-pointer gap-2 px-4"
					onclick={handleIviteUser}
				>
					<UserPlus class="h-4 w-4" />
					<span>Πρόσκληση Χρήστη</span>
				</Button>
			</div>

			<!-- Tabs Section -->
			<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full">
				<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
					<Tabs.Trigger value="users" class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground">
						<Users class="h-4 w-4" />
						Χρήστες
					</Tabs.Trigger>
					<Tabs.Trigger value="phone_calls" class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground">
						<Phone class="h-4 w-4" />
						Προμηθευτές - Τεχνικοί
					</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="users" class="mt-6 space-y-6 animate-fade-in-left">
					<!-- Stats Cards -->
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<!-- Total Users -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Σύνολο</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{profiles.length}</p>
								</div>
								<div class="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
									<Users class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<p class="text-[11px] text-muted-foreground">Ενεργοί χρήστες</p>
							</div>
						</div>

						<!-- Managers -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Managers</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{roleStats.managers}</p>
								</div>
								<div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 transition-colors group-hover:bg-amber-500/15 dark:text-amber-400">
									<Crown class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-amber-500 transition-all duration-500"
										style="width: {profiles.length ? (roleStats.managers / profiles.length) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Baristas -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Baristas & Head baristas</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{roleStats.baristas + roleStats.headBaristas}</p>
								</div>
								<div class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400">
									<Coffee class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all duration-500"
										style="width: {profiles.length ? ((roleStats.baristas + roleStats.headBaristas) / profiles.length) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Bakers -->
						<div class="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-md">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Bakers & register</p>
									<p class="text-2xl font-bold tabular-nums tracking-tight">{roleStats.bakersRegisters}</p>
								</div>
								<div class="rounded-lg bg-orange-500/10 p-2.5 text-orange-600 transition-colors group-hover:bg-orange-500/15 dark:text-orange-400">
									<ChefHat class="h-5 w-5" />
								</div>
							</div>
							<div class="mt-2">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-orange-500 transition-all duration-500"
										style="width: {profiles.length ? (roleStats.bakersRegisters / profiles.length) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>
					</div>

					<!-- Data Table wrapped in card -->
					<div class="rounded-xl border border-border/60 bg-card">
						<DataTable data={query.current?.users ?? []} {columns} />
					</div>
				</Tabs.Content>

				<Tabs.Content value="phone_calls" class="mt-6 animate-fade-in-left">
					<PhoneCells />
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>

	<!-- Invite User Dialog -->
	<Dialog.Root bind:open={inviteUserDialog}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Πρόσκληση Υπαλλήλου</Dialog.Title>
				<Dialog.Description>
					Εισάγετε το email του χρήστη για να στείλετε πρόσκληση
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={inviteEmail}
						placeholder="παράδειγμα@email.com"
						disabled={invite}
						class="w-full"
					/>
				</div>
			</div>
			<Dialog.Footer class="flex-col gap-2 sm:flex-row">
				<Button
					variant="outline"
					onclick={() => {
						inviteUserDialog = false;
						inviteEmail = '';
					}}
					class="w-full cursor-pointer sm:w-auto"
					disabled={invite}
				>
					Ακύρωση
				</Button>
				<Button
					disabled={invite || !inviteEmail}
					onclick={handleInviteUser}
					class="w-full cursor-pointer gap-2 sm:w-auto"
				>
					{#if invite}
						<Spinner />
						Αποστολή...
					{:else}
						<Mail class="h-4 w-4" />
						Αποστολή Πρόσκλησης
					{/if}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
