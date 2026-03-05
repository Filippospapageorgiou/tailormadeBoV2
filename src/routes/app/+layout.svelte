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

	const routeLabels: Record<string, string> = {
		// Top level
		blog: 'Ιστολόγιο',
		daily_tasks: 'Καθημερινές Εργασίες',
		equipment: 'Εξοπλισμός',
		legal: 'Νομικά',
		manifesto: 'Καταστατικό',
		manuals: 'Εγχειρίδια',
		profile: 'Προφίλ',
		recipes: 'Συνταγές',
		register: 'Εγγραφή',
		schedule: 'Πρόγραμμα',

		// Management
		managment: 'Διαχείριση',
		ai_assistant: 'Βοηθός AI',
		blog_settings: 'Ρυθμίσεις Ιστολογίου',
		bonus_managment: 'Διαχείριση Μπόνους',
		organization_managment: 'Διαχείριση Οργανισμού',
		recipes_settings: 'Ρυθμίσεις Συνταγών',
		trainers: 'Εκπαιδευτές',

		// Settings
		settings: 'Ρυθμίσεις',
		equipment_settings: 'Ρυθμίσεις Εξοπλισμού',
		manage_users: 'Διαχείριση Χρηστών',
		register_settings: 'Ρυθμίσεις Εγγραφής',
		schedule_settings: 'Ρυθμίσεις Προγράμματος',
		task_managment: 'Διαχείριση Εργασιών'
	};

	let breadcrumbs = $derived(() => {
		const pathSegments = page.url.pathname.split('/').filter(Boolean);
		let cumulativePath = '';
		return pathSegments.map((segment) => {
			cumulativePath += `/${segment}`;
			const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
			return { name: label, href: cumulativePath };
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
		<p class="py-4 text-center text-xs text-muted-foreground/50">
			© 2026 Filippos Papageorgiou · Platform Development · Confidential - All Rights Reserved
		</p>
	</Sidebar.Inset>
</Sidebar.Provider>
