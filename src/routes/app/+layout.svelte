<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ThemeSelector } from '$lib/components/ui/theme-selector';
	import Command from '$lib/components/command/command.svelte';
	import Notifications from '$lib/components/custom/Notifications.svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
	import {
		startPresenceTracker,
		subscribeToOrgPresence,
		TRAINER_VIRTUAL_ORG_ID
	} from '$lib/hooks/use-presence.svelte';
	import { setChatContext } from '$lib/stores/chat.svelte';
	import { subscribeToChatInbox } from '$lib/hooks/use-chat.svelte';
	import { getUnreadCount } from '$lib/api/chat/data.remote';

	let { data, children } = $props();
	const profile = getProfileContext();
	const chatStore = setChatContext();

	// Presence tracking — subscribes to Supabase Realtime Presence channel
	$effect(() => {
		if (!data.supabase || !profile.id || !profile.orgId) return;
		return startPresenceTracker(data.supabase, profile.id, profile.orgId);
	});

	$effect(() => {
		if (!data.supabase) return;
		return subscribeToOrgPresence(data.supabase, [TRAINER_VIRTUAL_ORG_ID]);
	});

	// Chat — reactive unread count query (called at init, NOT inside $effect)
	const unreadQuery = getUnreadCount();
	chatStore.setRefreshFn(() => unreadQuery.refresh());

	// Sync query result → chat store (auto-updates on command invalidation)
	$effect(() => {
		const result = unreadQuery.current;
		if (result?.success) {
			chatStore.setCount(result.count);
		}
	});

	// Inbox subscription — optimistically increment on new messages
	$effect(() => {
		if (!data.supabase || !profile.id) return;
		return subscribeToChatInbox(data.supabase, profile.id, () => chatStore.increment());
	});

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
		task_managment: 'Διαχείριση Εργασιών',

		// Chat
		chat: 'Συνομιλίες'
	};

	let breadcrumbs = $derived.by(() => {
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
						{#if breadcrumbs.length > 0}
							<Breadcrumb.Separator />
						{/if}

						{#each breadcrumbs as segment, i}
							<Breadcrumb.Item>
								{#if i === breadcrumbs.length - 1}
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
							{#if i < breadcrumbs.length - 1}
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
