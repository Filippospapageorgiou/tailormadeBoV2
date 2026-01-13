<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { X, RefreshCcw, Plus, Search, UserPlus, Mail, Users, Phone } from 'lucide-svelte';
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
	let profiles = $derived(query.current?.flattenedUsers);
	let invite = $state(false);

	let inviteUserDialog: boolean = $state(false);
	let inviteEmail: string = $state('');

	let activeTab = $state(page.url.searchParams.get('tab') || 'users');

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
			<div class="mb-6 space-y-2">
				<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
					Διαχείριση Χρηστών & Οργανισμού
				</h1>
				<p class="text-sm text-muted-foreground">
					Διαχειριστείτε τα μέλη, τους ρόλους και τα δικαιώματα του οργανισμού σας
				</p>
			</div>

			<!-- Tabs Section -->
			<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Tabs.List class="flex h-auto w-auto justify-start space-y-1 bg-transparent">
						<Tabs.Trigger value="users" class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground">
							<Users class="h-4 w-4" />
							<span class="hover:underline">Χρήστες</span>
						</Tabs.Trigger>
						<Tabs.Trigger value="phone_calls" class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground">
							<Phone class="h-4 w-4" />
							<span class="hover:underline">Προμηθευτές - Τεχνικοί</span>
						</Tabs.Trigger>
					</Tabs.List>
				</div>

				<Tabs.Content value="users" class="mt-6 space-y-4 animate-fade-in-left">
					<!-- Actions Bar -->
					<div
						class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
					>
						<div class="flex items-center gap-2">
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="default"
											size="sm"
											class="h-9 cursor-pointer gap-2 px-4"
											onclick={handleIviteUser}
										>
											<UserPlus class="h-4 w-4" />
											<span>Πρόσκληση Χρήστη</span>
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>Προσκαλέστε νέο χρήστη στον οργανισμό</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<!-- Stats Badge - visible on users tab -->
							<div class="flex items-center gap-3">
								<Badge variant="secondary" class="text-xs">
									{profiles?.length ?? 0} χρήστες
								</Badge>
							</div>
						</div>
					</div>
					<DataTable data={query.current?.flattenedUsers ?? []} {columns} />
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
