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
			class="sticky top-2 z-40 mx-2 mt-1 flex h-14 shrink-0 items-center justify-between rounded-lg border border-border/50 bg-background/80 px-4 py-1 shadow-sm backdrop-blur-md"
		>
			<div class="flex items-center gap-2">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />

				<Breadcrumb.Root class="hidden items-center gap-2 sm:flex">
					<Breadcrumb.List>
						{#if breadcrumbs().length > 0}
							<Breadcrumb.Separator />
						{/if}

						{#each breadcrumbs() as segment, i}
							<Breadcrumb.Item>
								{#if i === breadcrumbs().length - 1}
									<Breadcrumb.Page>{segment.name}</Breadcrumb.Page>
								{:else}
									<Breadcrumb.Link
										href={segment.href}
										class="text-muted-foreground/70 transition-colors hover:text-foreground"
									>
										{segment.name}
									</Breadcrumb.Link>
								{/if}
							</Breadcrumb.Item>
							{#if i < breadcrumbs().length - 1}
								<Breadcrumb.Separator />
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>

			<div class="flex items-center gap-2">
				<Command />
				<Notifications />
				<ThemeSelector />
			</div>
		</header>
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
