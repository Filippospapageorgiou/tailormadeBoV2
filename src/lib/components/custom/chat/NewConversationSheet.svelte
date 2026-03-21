<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, ChevronRight, ChevronLeft, Building2 } from 'lucide-svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		getChatableUsers,
		getChatableOrgs,
		getOrCreateConversation
	} from '$lib/api/chat/data.remote';
	import { getProfileContext } from '$lib/stores/profile.svelte';

	interface Props {
		open: boolean;
		/** Base path for navigation after creating conversation (/app/chat or /trainer/chat) */
		basePath?: string;
	}

	let { open = $bindable(), basePath = '/app/chat' }: Props = $props();

	const profile = getProfileContext();
	const isTrainer = $derived(profile.role_id === 3);

	// Queries
	const orgsQuery = getChatableOrgs();
	const usersQuery = getChatableUsers({});

	let orgs = $derived(orgsQuery.current?.orgs ?? []);
	let trainers = $derived(usersQuery.current?.users ?? []);

	// Trainer two-step state
	let selectedOrgId = $state<number | null>(null);
	let selectedOrgName = $state('');
	let orgUsersQuery = $derived(selectedOrgId ? getChatableUsers({ orgId: selectedOrgId }) : null);
	let orgUsers = $derived(orgUsersQuery?.current?.users ?? []);

	// Search
	let search = $state('');
	let starting = $state(false);

	// Reset when sheet closes
	$effect(() => {
		if (!open) {
			selectedOrgId = null;
			selectedOrgName = '';
			search = '';
		}
	});

	let displayUsers = $derived(isTrainer && selectedOrgId ? orgUsers : trainers);
	let filteredUsers = $derived(
		displayUsers.filter((u) => (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()))
	);

	let filteredOrgs = $derived(
		orgs.filter((o) => o.store_name.toLowerCase().includes(search.toLowerCase()))
	);

	function getInitials(name: string | null) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function getRoleLabel(roleId: number | null) {
		if (roleId === 1 || roleId === 2) return 'Manager';
		if (roleId === 3) return 'Trainer';
		return 'Barista';
	}

	async function startConversation(userId: string) {
		if (starting) return;
		starting = true;
		try {
			const result = await getOrCreateConversation({ otherUserId: userId });
			if (result.success && result.conversationId > 0) {
				open = false;
				goto(`${basePath}/${result.conversationId}`);
			}
		} finally {
			starting = false;
		}
	}

	function selectOrg(orgId: number, orgName: string) {
		selectedOrgId = orgId;
		selectedOrgName = orgName;
		search = '';
	}

	function backToOrgs() {
		selectedOrgId = null;
		selectedOrgName = '';
		search = '';
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Portal>
		<Sheet.Overlay />
		<Sheet.Content side="right" class="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
			<Sheet.Header class="border-b border-border px-4 py-3">
				<div class="flex items-center gap-2">
					{#if isTrainer && selectedOrgId}
						<button
							onclick={backToOrgs}
							class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<ChevronLeft class="size-4" />
						</button>
					{/if}
					<div>
						<Sheet.Title class="text-base">Νέα συνομιλία</Sheet.Title>
						{#if isTrainer && selectedOrgId}
							<p class="text-xs text-muted-foreground">{selectedOrgName}</p>
						{:else if isTrainer}
							<p class="text-xs text-muted-foreground">Επίλεξε κατάστημα</p>
						{:else}
							<p class="text-xs text-muted-foreground">Επίλεξε trainer</p>
						{/if}
					</div>
				</div>
			</Sheet.Header>

			<!-- Search -->
			<div class="shrink-0 px-4 py-3">
				<div class="relative">
					<Search
						class="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						bind:value={search}
						placeholder={isTrainer && !selectedOrgId
							? 'Αναζήτηση καταστήματος...'
							: 'Αναζήτηση ατόμου...'}
						class="pl-8 text-sm"
					/>
				</div>
			</div>

			<!-- List -->
			<div class="flex-1 overflow-y-auto">
				{#if isTrainer && !selectedOrgId}
					<!-- Trainer step 1: org picker -->
					{#if filteredOrgs.length === 0}
						<div
							class="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground"
						>
							<Building2 class="size-8 opacity-40" />
							<p class="text-sm">Δεν βρέθηκαν καταστήματα</p>
						</div>
					{:else}
						{#each filteredOrgs as org (org.id)}
							<button
								onclick={() => selectOrg(org.id, org.store_name)}
								class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
							>
								<div
									class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
								>
									<Building2 class="size-4 text-primary" />
								</div>
								<span class="flex-1 text-sm font-medium">{org.store_name}</span>
								<ChevronRight class="size-4 text-muted-foreground" />
							</button>
						{/each}
					{/if}
				{:else}
					<!-- User picker (trainers see org users, others see trainers) -->
					{#if filteredUsers.length === 0}
						<div
							class="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground"
						>
							<Search class="size-8 opacity-40" />
							<p class="text-sm">Δεν βρέθηκαν χρήστες</p>
						</div>
					{:else}
						{#each filteredUsers as user (user.id)}
							<button
								onclick={() => startConversation(user.id)}
								disabled={starting}
								class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted disabled:opacity-50"
							>
								<Avatar.Root class="size-10 shrink-0">
									{#if user.image_url}
										<Avatar.Image
											class="dark:bg-white"
											src={user.image_url}
											alt={user.full_name ?? ''}
										/>
									{/if}
									<Avatar.Fallback class="bg-primary/10 text-xs font-medium text-primary">
										{getInitials(user.full_name)}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{user.full_name ?? 'Άγνωστος'}</p>
									<p class="text-xs text-muted-foreground">{getRoleLabel(user.role_id)}</p>
								</div>
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							</button>
						{/each}
					{/if}
				{/if}
			</div>
		</Sheet.Content>
	</Sheet.Portal>
</Sheet.Root>
