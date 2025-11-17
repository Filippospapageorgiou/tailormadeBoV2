<script lang="ts">
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { Loader } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import Spinner from './ui/spinner/spinner.svelte';

	let isLoggingOut = $state(false);

	const sidebar = useSidebar();

	// Close sidebar on mobile when link is clicked
	function handleLinkClick() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	function gotoAccount(id: any) {
		handleLinkClick();
		goto(`/app/profile/${profile.id}`);
	}

	async function handleLogout() {
		if (isLoggingOut) {
			return true;
		}

		isLoggingOut = true;
		try {
			const response = await fetch('/auth/api/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error logging out');
			}

			window.location.reload();
		} catch (error) {
			console.error('Logout failed:', error);
			isLoggingOut = false;
		}
	}

	let profile = getProfileContext();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={profile.imageUrl} alt={profile.username} />
							<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{profile.username}</span>
							<span class="truncate text-xs">{profile.email}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={profile.imageUrl} alt={profile.username} />
							<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{profile.username}</span>
							<span class="truncate text-xs">{profile.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<SparklesIcon />
						Play memory game
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Item>
					<BadgeCheckIcon />
					<button
						class="w-full cursor-pointer text-start"
						onclick={() => {
							gotoAccount(profile.id);
						}}>Account</button
					>
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					<LogOutIcon />
					<button
						onclick={handleLogout}
						disabled={isLoggingOut}
						class="flex w-full cursor-pointer items-center gap-2 text-start"
					>
						{#if isLoggingOut}
							<Spinner />
						{/if}
						<span>
							{isLoggingOut ? 'Logging out...' : 'Log out'}
						</span>
					</button>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
