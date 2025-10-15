<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { X, RefreshCcw, Plus, Search, UserPlus, Mail } from 'lucide-svelte';
	import { Badge } from "$lib/components/ui/badge/index.js";
    import DataTable from "./data-table.svelte";
    import { columns } from './colums';
    import { authenticatedAccess, getAllUserFromOrg } from './data.remote';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { inviteUser } from './data.remote';
	import { toast } from '$lib/stores/toast.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';

	let auth = authenticatedAccess();
    let query = getAllUserFromOrg();
    let profiles = $derived(query.current?.flattenedUsers);
	let invite = $state(false);

	let inviteUserDialog:boolean = $state(false);
	let inviteEmail:string = $state('');

	function handleIviteUser(){
		inviteUserDialog = true;
	}

	async function handleInviteUser(){
		invite = true;
		try{
			const result = await inviteUser({
				email: inviteEmail,
			});

			if(result?.success){
				toast.show = true;
				toast.status = true;
				toast.title = 'Success';
				toast.text = result?.message;
				inviteEmail = '';
			}else {
				toast.show = true;
				toast.status = false;
				toast.title = 'Error';
				toast.text = result?.message || 'Failed to send invitation';
			}

		}catch (error) {
			console.error('Error inviting user:', error);
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = 'An error occured trying to invite user'
		} finally {
			inviteUserDialog = false;
			invite = false;
		}

	}
	
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					User Management
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Manage your organization members, roles, and permissions
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Showing: <span class="font-semibold">{profiles?.length}</span>
						users
					</p>
				</div>
			</div>

			<!-- Filters & Actions Section -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<!-- Role Filter -->
					
				</div>

				<div class="relative flex items-center gap-2">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="default"
									size="sm"
									class="h-8 cursor-pointer gap-2 px-3"
									onclick={handleIviteUser}
								>
									<UserPlus class="h-4 w-4" />
									<span class="hidden sm:inline">Invite User</span>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Invite New User</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<!-- Refresh Button -->
					

					<!-- Search Input -->
					
				</div>
			</div>
		</div>
		<DataTable data={query.current?.flattenedUsers ?? []} {columns} />
	</main>
</div>


<Dialog.Root bind:open={inviteUserDialog}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Invite employee</Dialog.Title>
			<Dialog.Description>
				invite user type email down below
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-1 py-4">
			<div class="grid grid-cols-4 items-center gap-1">
				<Label class="text-right">Email</Label>
				<div class="col-span-3">
					<Input
						type="email"
						bind:value={inviteEmail}
						placeholder="example@gmail.com"
						disabled={invite}
					/>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button 
				variant="outline" 
				onclick={() => {
					inviteUserDialog = false;
					inviteEmail = '';
				}} 
				class="cursor-pointer"
				disabled={invite}
			>
				Cancel
			</Button>
			<Button 
				disabled={invite || !inviteEmail} 
				onclick={handleInviteUser} 
				class="cursor-pointer gap-2"
			>
				{#if invite} 
					<Spinner />
					Sending...
				{:else}
					<Mail class="h-4 w-4" />
					Invite User
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
{/if}