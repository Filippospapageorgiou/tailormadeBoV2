<script lang="ts">
	import { page } from '$app/state';
	import { Search, Plus, ImageIcon } from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { getConversations } from '$lib/api/chat/data.remote';
	import { getChatContext } from '$lib/stores/chat.svelte';
	import NewConversationSheet from './NewConversationSheet.svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { el } from 'date-fns/locale';

	interface Props {
		/** Base path for navigation (/app/chat or /trainer/chat) */
		basePath?: string;
	}

	let { basePath = '/app/chat' }: Props = $props();

	let sheetOpen = $state(false);

	const chatStore = getChatContext();
	const query = getConversations();

	let conversations = $derived(query.current?.conversations ?? []);
	let search = $state('');

	let filtered = $derived(
		conversations.filter((c) =>
			c.other_participant.full_name?.toLowerCase().includes(search.toLowerCase())
		)
	);

	let totalUnread = $derived(chatStore.unreadCount);

	// Detect if a conversation is currently active (for mobile hide/show)
	let activeConversationId = $derived.by(() => {
		const match = page.url.pathname.match(/\/chat\/(\d+)/);
		return match ? Number(match[1]) : null;
	});

	function formatTime(dateStr: string) {
		return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: el });
	}

	function getInitials(name: string | null) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function getRoleLabel(roleId: number | null) {
		if (roleId === 1 || roleId === 2) return 'Manager';
		if (roleId === 3) return 'Trainer';
		return 'Barista';
	}
</script>

<!-- On mobile: hide sidebar when a conversation is open -->
<div
	class="flex w-full flex-col border-r border-border md:w-80 lg:w-96 {activeConversationId
		? 'hidden md:flex'
		: 'flex'}"
>
	<div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
		<div class="flex items-center gap-2">
			<h1 class="font-mono text-lg font-semibold tracking-wide">Συνομιλίες</h1>
			{#if totalUnread > 0}
				<Badge variant="destructive" class="h-5 min-w-5 rounded-full px-1.5 text-xs">
					{totalUnread}
				</Badge>
			{/if}
		</div>
		<Button size="sm" class="gap-1.5" onclick={() => (sheetOpen = true)}>
			<Plus class="size-3.5" />
			<span class="hidden sm:inline">Νέα</span>
			<span class="sm:hidden">Νέα συνομιλία</span>
		</Button>
	</div>

	<div class="shrink-0 px-3 py-2">
		<div class="relative">
			<Search
				class="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
			/>
			<Input bind:value={search} placeholder="Αναζήτηση συνομιλίας..." class="pl-8 text-sm" />
		</div>
	</div>

	<div class="flex-1 overflow-y-auto overscroll-contain">
		{#if query.current === undefined}
			{#each Array(4) as _}
				<div class="flex items-center gap-3 px-4 py-3">
					<div class="size-11 shrink-0 animate-pulse rounded-full bg-muted"></div>
					<div class="flex-1 space-y-2">
						<div class="h-3 w-32 animate-pulse rounded bg-muted"></div>
						<div class="h-2.5 w-48 animate-pulse rounded bg-muted"></div>
					</div>
				</div>
			{/each}
		{:else if filtered.length === 0}
			<div class="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
				<Search class="size-8 opacity-40" />
				<p class="text-sm">Δεν βρέθηκαν συνομιλίες</p>
			</div>
		{:else}
			{#each filtered as conv (conv.id)}
				{@const isActive = activeConversationId === conv.id}
				{@const hasUnread = conv.unread_count > 0}
				<a
					href="{basePath}/{conv.id}"
					class="flex min-h-[4rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted {isActive
						? 'bg-muted/60'
						: ''} {hasUnread ? 'bg-primary/[0.03]' : ''}"
				>
					<div class="relative shrink-0">
						<Avatar.Root class="size-11">
							{#if conv.other_participant.image_url}
								<Avatar.Image
									class="dark:bg-white"
									src={conv.other_participant.image_url}
									alt={conv.other_participant.full_name ?? ''}
								/>
							{/if}
							<Avatar.Fallback class="bg-primary/10 text-xs font-medium text-primary">
								{getInitials(conv.other_participant.full_name)}
							</Avatar.Fallback>
						</Avatar.Root>
						{#if hasUnread}
							<span class="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
								{conv.unread_count > 9 ? '9+' : conv.unread_count}
							</span>
						{/if}
					</div>

					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between gap-2">
							<span class="truncate text-sm {hasUnread ? 'font-bold' : 'font-semibold'}">
								{conv.other_participant.full_name ?? 'Άγνωστος'}
							</span>
							<span class="shrink-0 text-[11px] {hasUnread ? 'font-semibold text-primary' : 'text-muted-foreground'}">
								{formatTime(conv.last_message_at)}
							</span>
						</div>
						{#if conv.last_message}
							<p class="truncate text-xs {hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}">
								{#if conv.last_message.has_image && !conv.last_message.content}
									<span class="inline-flex items-center gap-1">
										<ImageIcon class="inline size-3" />
										Εικόνα
									</span>
								{:else}
									{conv.last_message.content}
								{/if}
							</p>
						{/if}
						<div class="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
							<span>{getRoleLabel(conv.other_participant.role_id)}</span>
							{#if conv.other_participant.org_name}
								<span>·</span>
								<span class="truncate">{conv.other_participant.org_name}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>

<NewConversationSheet bind:open={sheetOpen} {basePath} />
