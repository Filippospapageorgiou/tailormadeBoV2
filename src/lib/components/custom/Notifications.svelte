<!-- src/lib/components/custom/notifications/Notifications.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		BellIcon,
		Coffee,
		FileText,
		Calendar,
		Wrench,
		ClipboardList,
		RefreshCw,
		CheckCheck,
		Boxes
	} from 'lucide-svelte';
	import {
		getNotifications,
		markNotificationAsRead,
		markAllNotificationsAsRead
	} from '../../api/notifications/data.remote';
	import { goto } from '$app/navigation';
	import type { Notification, NotificationType } from '../../models/notifications.types';
	import Separator from '../ui/separator/separator.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let query = getNotifications();

	let notifications = $derived(query.current?.notifications ?? []);
	let unreadCount = $derived(query.current?.unreadCount ?? 0);
	let isLoading = $derived(query.loading);

	let isRefreshing = $state(false);

	$effect(() => {
		if (isRefreshing) {
			notifications = query.current?.notifications ?? [];
			unreadCount = query.current?.unreadCount ?? 0;
			isLoading = query.loading;
		}
	});

	// Icon mapping for notification types
	const typeIcons: Record<NotificationType, typeof Coffee> = {
		recipe_added: Coffee,
		blog_published: FileText,
		schedule_published: Calendar,
		equipment_added: Wrench,
		daily_tasks: ClipboardList,
		shift_request_update: RefreshCw,
		manual_published:Boxes
	};

	// Group notifications by date
	function groupNotifications(items: Notification[]) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const groups = {
			today: [] as Notification[],
			yesterday: [] as Notification[],
			older: [] as Notification[]
		};

		for (const item of items) {
			const itemDate = new Date(item.created_at);
			itemDate.setHours(0, 0, 0, 0);

			if (itemDate.getTime() === today.getTime()) {
				groups.today.push(item);
			} else if (itemDate.getTime() === yesterday.getTime()) {
				groups.yesterday.push(item);
			} else {
				groups.older.push(item);
			}
		}

		return groups;
	}

	let groupedNotifications = $derived(groupNotifications(notifications));

	// Format relative time
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Τώρα';
		if (diffMins < 60) return `${diffMins}λ`;
		if (diffHours < 24) return `${diffHours}ω`;
		if (diffDays < 7) return `${diffDays}μ`;

		return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
	}

	async function handleRefresh() {
		isRefreshing = true;
		await query.refresh();
		isRefreshing = false;
	}

	async function handleNotificationClick(notification: Notification) {
		// Mark as read if unread
		if (!notification.is_read) {
			await markNotificationAsRead({ notificationId: notification.id });
			await query.refresh();
		}

		// Navigate if there's a reference URL
		if (notification.reference_url) {
			goto(notification.reference_url);
		}
	}

	async function handleMarkAllAsRead() {
		await markAllNotificationsAsRead();
		await query.refresh();
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		<div class="relative inline-flex">
			<Button variant="ghost" size="icon">
				<BellIcon class="h-5 w-5" />
			</Button>
			{#if unreadCount > 0}
				<Badge
					variant="destructive"
					class="pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1 text-xs tabular-nums"
				>
					{unreadCount > 99 ? '99+' : unreadCount}
				</Badge>
			{/if}
		</div>
	</Popover.Trigger>

	<Popover.Content
		class="w-80 animate-fade-in overflow-hidden rounded-2xl border border-border/50 bg-card p-0
		   shadow-sm backdrop-blur-sm
		   transition-all duration-200
		   ease-out zoom-in-95 slide-in-from-top-2
			hover:shadow-xl dark:border-white/10
		   dark:shadow-black/20"
		align="end"
	>
		<div class="flex items-center justify-between border-b border-border/50 px-4 py-3">
			<h3 class="text-sm font-semibold">Ειδοποιήσεις</h3>
			<div class="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7"
					onclick={handleRefresh}
					disabled={isRefreshing}
				>
					<RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin-clockwise' : ''}" />
				</Button>
				{#if unreadCount > 0}
					<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleMarkAllAsRead}>
						<CheckCheck class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</div>

		<ScrollArea class="h-[400px]">
			{#if isLoading}
				<div class="flex justify-center pt-40">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Spinner />
					</div>
				</div>
			{:else if notifications.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<BellIcon class="mb-2 h-8 w-8 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">No notifications</p>
				</div>
			{:else}
				<div class="p-2">
					{#each Object.entries(groupedNotifications) as [key, items]}
						{#if items.length > 0}
							<div class="mb-2">
								<h4 class="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
									{key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Older'}
								</h4>
								<div class="space-y-1">
									{#each items as notification}
										{@const Icon = typeIcons[notification.type]}
										<button
											onclick={() => handleNotificationClick(notification)}
											class="group relative w-full overflow-hidden rounded-md p-2 text-left transition-colors hover:bg-accent cursor-pointer"
										>
											<div class="flex gap-3">
												<div class="mt-0.5 flex-shrink-0">
													<div class="rounded-full bg-muted p-1.5">
														<Icon class="h-4 w-4" />
													</div>
												</div>
												<div class="min-w-0 flex-1 space-y-1">
													<div class="flex items-start justify-between gap-2">
														<p class="text-sm leading-tight font-medium">
															{notification.title}
														</p>
														{#if !notification.is_read}
															<div class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
														{/if}
													</div>
													<p class="line-clamp-2 text-xs text-muted-foreground">
														{notification.message}
													</p>
													<p class="text-xs text-muted-foreground">
														{formatRelativeTime(notification.created_at)}
													</p>
												</div>
											</div>
										</button>
									{/each}
								</div>
							</div>
							{#if key !== 'older'}
								<Separator class="my-2" />
							{/if}
						{/if}
					{/each}
				</div>
			{/if}
		</ScrollArea>
	</Popover.Content>
</Popover.Root>
