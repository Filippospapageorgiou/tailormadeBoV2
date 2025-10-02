<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { getProfileContext } from "$lib/stores/profile.svelte";

	let user = getProfileContext();

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			icon: any;
			isActive?: boolean;
			requiresAdmin?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();

	function canAccessItem(item: typeof items[0]): boolean {
		if (!item.requiresAdmin) return true;
		return user?.role?.toLowerCase() === 'admin';
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as mainItem (mainItem.title)}
			{#if canAccessItem(mainItem)}
				<Collapsible.Root open={mainItem.isActive}>
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Sidebar.MenuButton tooltipContent={mainItem.title}>
								{#snippet child({ props })}
									<a href={mainItem.url} {...props}>
										<mainItem.icon />
										<span>{mainItem.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
							{#if mainItem.items?.length}
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuAction
											{...props}
											class="data-[state=open]:rotate-90"
										>
											<ChevronRightIcon />
											<span class="sr-only">Toggle</span>
										</Sidebar.MenuAction>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each mainItem.items as subItem (subItem.title)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton href={subItem.url}>
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
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>