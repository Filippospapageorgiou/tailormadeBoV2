<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	let {
		projects
	}: {
		projects: {
			name: string;
			url: string;
			icon: any;
			items?: {
				title: string;
				url: string;
				icon:any;
			}[];
		}[];
	} = $props();

	const sidebar = useSidebar();

	// Close sidebar on mobile when link is clicked
	function handleLinkClick() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Manager Organizations</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each projects as project (project.name)}
			<Collapsible.Root>
				{#snippet child({ props })}
					<Sidebar.MenuItem {...props}>
						<Sidebar.MenuButton tooltipContent={project.name}>
							{#snippet child({ props })}
								<p {...props} onclick={handleLinkClick}>
									<project.icon />
									<span>{project.name}</span>
								</p>
							{/snippet}
						</Sidebar.MenuButton>
						{#if project.items?.length}
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuAction {...props} class="data-[state=open]:rotate-90">
										<ChevronRightIcon />
										<span class="sr-only">Toggle</span>
									</Sidebar.MenuAction>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each project.items as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton href={subItem.url} onclick={handleLinkClick}>
												<subItem.icon />
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
