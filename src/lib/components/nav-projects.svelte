<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import Separator from './ui/separator/separator.svelte';

	let {
		projects
	}: {
		projects: {
			name: string;
			url?: string;
			icon: any;
			items?: {
				title: string;
				url: string;
				icon: any;
			}[];
		}[];
	} = $props();

	const sidebar = useSidebar();

	let openState = $state<Record<string, boolean>>(
		Object.fromEntries(
			// svelte-ignore state_referenced_locally
			projects.map((p) => [
				p.name,
				p.items?.some((sub) => page.url.pathname.startsWith(sub.url)) ?? false
			])
		)
	);

	function handleMainClick(project: (typeof projects)[0]) {
		if (project.items?.length) {
			openState[project.name] = !openState[project.name];
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
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.Menu class="px-2">
		<Separator />
		{#each projects as project (project.name)}
			<Collapsible.Root bind:open={openState[project.name]}>
				{#snippet child({ props })}
					<Sidebar.MenuItem {...props}>
						<Sidebar.MenuButton
							tooltipContent={project.name}
							onclick={() => handleMainClick(project)}
						>
							<project.icon />
							<span class="text-base font-semibold">{project.name}</span>
							{#if project.items?.length}
								<ChevronRightIcon
									class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 {openState[
										project.name
									]
										? 'rotate-90'
										: ''}"
								/>
							{/if}
						</Sidebar.MenuButton>
						{#if project.items?.length}
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each project.items as subItem (subItem.title)}
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
												<span>{subItem.title}</span>
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						{/if}
					</Sidebar.MenuItem>
				{/snippet}
			</Collapsible.Root>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
