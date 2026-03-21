<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { Component, ComponentProps } from 'svelte';
	import { openModal } from '$lib/stores/feedback.svelte';

	const sidebar = Sidebar.useSidebar();

	let {
		ref = $bindable(null),
		items,
		...restProps
	}: {
		items: {
			title: string;
			url: string;
			icon: Component;
			badge?: number;
		}[];
	} & ComponentProps<typeof Sidebar.Group> = $props();

	// Close sidebar on mobile when link is clicked
	function handleLinkClick() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	function handleOpenFeedbackModal(){
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
		openModal()
	}
</script>

<Sidebar.Group bind:ref {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="sm">
						{#snippet child({ props })}
							{#if item.title === 'Feedback'}
								<button {...props} onclick={handleOpenFeedbackModal}>
									<item.icon />
									<span>{item.title}</span>
								</button>
							{:else}
								<a href={item.url} {...props} onclick={handleLinkClick}>
									<item.icon />
									<span>{item.title}</span>
									{#if item.badge && item.badge > 0}
										<span class="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-none text-primary-foreground">
											{item.badge > 99 ? '99+' : item.badge}
										</span>
									{/if}
								</a>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
