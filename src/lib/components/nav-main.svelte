<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';

	let user = getProfileContext();
	const sidebar = useSidebar();

	let {
		items
	}: {
		items: {
			title: string;
			url?: string;
			icon: any;
			isActive?: boolean;
			newLine?: boolean;
			requiresAdmin?: boolean;
			items?: {
				title: string;
				url: string;
				requiresSuperAdmin?: boolean;
				icon: any;
			}[];
		}[];
	} = $props();

	// Initialize immediately with $derived so it's never undefined
	let openState = $state<Record<string, boolean>>(
		Object.fromEntries(
			// svelte-ignore state_referenced_locally
			items.map((item) => [
				item.title,
				item.items?.some((sub) => page.url.pathname.startsWith(sub.url)) ?? false
			])
		)
	);

	function handleMainClick(mainItem: (typeof items)[0]) {
		if (mainItem.items?.length) {
			openState[mainItem.title] = !openState[mainItem.title];
		}
	}

	function handleSubClick() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	function isActive(url: string): boolean {
		return page.url.pathname === url || page.url.pathname.startsWith(url + '/');
	}

	function canAccessItem(item: (typeof items)[0]): boolean {
		if (!item.requiresAdmin) return true;
		return user.role_id === 1 || user.role_id === 2 || user.role_id === 4;
	}

	function canAccessSubItem(item: {
		title: string;
		url: string;
		requiresSuperAdmin?: boolean;
	}): boolean {
		if (!item.requiresSuperAdmin) return true;
		return user.role_id === 1 || user.role_id === 2;
	}

	let hoveredItem = $state<string | null>(null);
</script>

<Sidebar.Group>
	<Sidebar.Menu class="px-2">
		{#each items as mainItem (mainItem.title)}
			{#if canAccessItem(mainItem)}
				<Collapsible.Root bind:open={openState[mainItem.title]}>
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Sidebar.MenuButton
								tooltipContent={mainItem.title}
								onclick={() => handleMainClick(mainItem)}
								class="sidebar-menu-button"
								onmouseenter={() => (hoveredItem = mainItem.title)}
								onmouseleave={() => (hoveredItem = null)}
							>
								<mainItem.icon hover={hoveredItem === mainItem.title} />
								<span class="text-base font-semibold">{mainItem.title}</span>
								{#if mainItem.items?.length}
									<ChevronRightIcon
										class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 {openState[
											mainItem.title
										]
											? 'rotate-90'
											: ''}"
									/>
								{/if}
							</Sidebar.MenuButton>
							{#if mainItem.items?.length}
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each mainItem.items as subItem (subItem.title)}
											{#if canAccessSubItem(subItem)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton
														href={subItem.url}
														onclick={handleSubClick}
														class={isActive(subItem.url)
															? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
															: ''}
													>
														<subItem.icon
															class="h-4 w-4 {isActive(subItem.url) ? 'text-primary' : ''}"
														/>
														<span class="text-sm">{subItem.title}</span>
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/if}
										{/each}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							{/if}
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
