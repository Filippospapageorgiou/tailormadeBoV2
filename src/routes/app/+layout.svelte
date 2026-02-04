<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ThemeSelector } from '$lib/components/ui/theme-selector';
	import Command from '$lib/components/command/command.svelte';
	import Notifications from '$lib/components/custom/Notifications.svelte';
	
	let { children } = $props();

	let breadcrumbs = $derived(() => {
		const pathSegments = page.url.pathname.split('/').filter(Boolean);
		let cumulativePath = '';
		return pathSegments.map((segment) => {
			cumulativePath += `/${segment}`;
			const name = segment.charAt(0).toUpperCase() + segment.slice(1);
			return { name, href: cumulativePath };
		});
	});
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="sticky top-2 z-40 flex h-16 shrink-0 items-center justify-between bg-muted border border-border/50 rounded-lg mx-2 mt-1 px-4 py-1">
			<div class="flex items-center gap-2">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />

				<Breadcrumb.Root class="hidden sm:flex items-center gap-2">
					<Breadcrumb.List>
						{#if breadcrumbs().length > 0}
							<Breadcrumb.Separator />
						{/if}

						{#each breadcrumbs() as segment, i}
							<Breadcrumb.Item>
								{#if i === breadcrumbs().length - 1}
									<Breadcrumb.Page>{segment.name}</Breadcrumb.Page>
								{:else}
									<Breadcrumb.Link href={segment.href}>{segment.name}</Breadcrumb.Link>
								{/if}
							</Breadcrumb.Item>
							{#if i < breadcrumbs().length - 1}
								<Breadcrumb.Separator />
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>

			<div class="flex items-center gap-1">
				<Command />
				<Notifications />
				<ThemeSelector />
			</div>
		</header>
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
