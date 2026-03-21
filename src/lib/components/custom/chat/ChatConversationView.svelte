<script lang="ts">
	import * as Chat from '$lib/components/ui/chat';
	import * as EmojiPicker from '$lib/components/ui/emoji-picker';
	import * as Popover from '$lib/components/ui/popover';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SendIcon from '@lucide/svelte/icons/send';
	import SmilePlusIcon from '@lucide/svelte/icons/smile-plus';
	import ImageIcon from '@lucide/svelte/icons/image';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import {
		getMessages,
		sendMessage,
		markConversationAsRead,
		getConversations
	} from '$lib/api/chat/data.remote';
	import { subscribeToConversation } from '$lib/hooks/use-chat.svelte';
	import { getChatContext } from '$lib/stores/chat.svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import type { ChatMessage } from '$lib/models/chat.types';
	import { formatDistanceToNow } from 'date-fns';
	import { el } from 'date-fns/locale';

	interface Props {
		conversationId: number;
		basePath?: string;
		supabase: any;
	}

	let { conversationId, basePath = '/app/chat', supabase }: Props = $props();

	const profile = getProfileContext();
	const chatStore = getChatContext();

	// Local messages state
	let messages = $state<ChatMessage[]>([]);
	let nextCursor = $state<number | null>(null);
	let loadingMore = $state(false);
	let sending = $state(false);
	let messageText = $state('');
	let emojiOpen = $state(false);
	let initialLoaded = $state(false);
	let markedAsRead = $state(false);

	// Get the other participant info from the conversations query
	const convsQuery = getConversations();
	let otherParticipant = $derived.by(() => {
		const convs = convsQuery.current?.conversations ?? [];
		const conv = convs.find((c) => c.id === conversationId);
		return conv?.other_participant ?? null;
	});

	// Load initial messages
	const messagesQuery = $derived(getMessages({ conversationId }));

	$effect(() => {
		const result = messagesQuery.current;
		if (result && !initialLoaded) {
			// Messages come newest-first from API, reverse for display (oldest at top)
			messages = [...(result.messages ?? [])].reverse();
			nextCursor = result.nextCursor;
			initialLoaded = true;
		}
	});

	// Mark conversation as read on mount (once per conversation)
	$effect(() => {
		if (initialLoaded && conversationId && !markedAsRead) {
			markedAsRead = true;
			markConversationAsRead({ conversationId }).then(() => {
				chatStore.refreshCount();
			});
		}
	});

	// Realtime subscription
	$effect(() => {
		if (!supabase || !profile.id || !conversationId) return;

		return subscribeToConversation(supabase, conversationId, profile.id, {
			onMessage: (msg) => {
				// Avoid duplicates
				if (!messages.some((m) => m.id === msg.id)) {
					messages = [...messages, msg];
				}
			},
			onRead: () => {
				chatStore.refreshCount();
			}
		});
	});

	// Load older messages (scroll up pagination)
	async function loadMore() {
		if (loadingMore || !nextCursor) return;
		loadingMore = true;

		try {
			const result = await getMessages({ conversationId, cursor: nextCursor });
			if (result.success && result.messages.length > 0) {
				// Prepend older messages (they come newest-first, reverse for display)
				const older = [...result.messages].reverse();
				messages = [...older, ...messages];
				nextCursor = result.nextCursor;
			}
		} finally {
			loadingMore = false;
		}
	}

	// Send message
	async function handleSend() {
		const text = messageText.trim();
		if (!text || sending) return;

		sending = true;
		messageText = '';

		try {
			const result = await sendMessage({ conversationId, content: text });
			if (result.success && result.data) {
				// Realtime will handle adding the message, but add optimistically to avoid delay
				if (!messages.some((m) => m.id === result.data!.id)) {
					messages = [...messages, result.data];
				}
			}
		} finally {
			sending = false;
		}
	}

	// Image upload
	let fileInput = $state<HTMLInputElement>();

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
		if (!validTypes.includes(file.type)) return;
		if (file.size > 10 * 1024 * 1024) return;

		sending = true;
		try {
			const ext = file.name.split('.').pop() ?? 'jpg';
			const filePath = `${conversationId}/${profile.id}/${Date.now()}.${ext}`;

			const buffer = await file.arrayBuffer();
			const { error: uploadError } = await supabase.storage
				.from('chat-images')
				.upload(filePath, buffer, { contentType: file.type, upsert: false });

			if (!uploadError) {
				await sendMessage({ conversationId, imagePath: filePath });
			}
		} finally {
			sending = false;
			input.value = '';
		}
	}

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
</script>

<div class="flex h-full w-full flex-col">
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-2.5"
	>
		<div class="flex items-center gap-2">
			<a
				href={basePath}
				class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
			>
				<ArrowLeftIcon class="size-4" />
			</a>
			{#if otherParticipant}
				<Avatar.Root class="size-9">
					{#if otherParticipant?.image_url}
						<Avatar.Image
							class="dark:bg-white"
							src={otherParticipant?.image_url}
							alt={otherParticipant?.full_name ?? ''}
						/>
					{/if}
					<Avatar.Fallback class="bg-primary/10 text-xs font-medium text-primary">
						{getInitials(otherParticipant?.full_name ?? null)}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-col">
					<span class="text-sm font-semibold">{otherParticipant?.full_name ?? 'Άγνωστος'}</span>
					{#if otherParticipant?.org_name}
						<span class="text-[11px] text-muted-foreground">{otherParticipant.org_name}</span>
					{/if}
				</div>
			{:else}
				<div class="h-9 w-24 animate-pulse rounded bg-muted"></div>
			{/if}
		</div>
	</div>

	<!-- Messages -->
	<div class="flex-1 overflow-hidden">
		<Chat.List class="h-full max-h-none px-2 py-3">
			<!-- Load more button -->
			{#if nextCursor}
				<div class="mb-3 flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						class="gap-1.5 text-xs text-muted-foreground"
						onclick={loadMore}
						disabled={loadingMore}
					>
						{#if loadingMore}
							<LoaderIcon class="size-3 animate-spin-clockwise repeat-infinite" />
						{/if}
						Φόρτωση παλαιότερων
					</Button>
				</div>
			{/if}

			{#if !initialLoaded}
				<div class="flex items-center justify-center py-8">
					<LoaderIcon class="size-5 animate-spin-clockwise text-muted-foreground repeat-infinite" />
				</div>
			{:else if messages.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
					<p class="text-sm">Δεν υπάρχουν μηνύματα ακόμα</p>
					<p class="text-xs">Ξεκίνα τη συνομιλία!</p>
				</div>
			{:else}
				{#each messages as msg (msg.id)}
					{@const isSent = msg.sender_id === profile.id}
					<Chat.Bubble variant={isSent ? 'sent' : 'received'}>
						{#if !isSent}
							<Chat.BubbleAvatar>
								{#if otherParticipant?.image_url}
									<Chat.BubbleAvatarImage
										src={otherParticipant?.image_url}
										alt={otherParticipant?.full_name ?? ''}
									/>
								{/if}
								<Chat.BubbleAvatarFallback>
									{getInitials(otherParticipant?.full_name ?? null)}
								</Chat.BubbleAvatarFallback>
							</Chat.BubbleAvatar>
						{/if}
						<Chat.BubbleMessage class="flex flex-col gap-1">
							{#if msg.image_url}
								<img
									src={msg.image_url}
									alt="Εικόνα"
									class="max-h-60 max-w-60 rounded-md object-cover"
									loading="lazy"
								/>
							{/if}
							{#if msg.content}
								<p class="break-words whitespace-pre-wrap">{msg.content}</p>
							{/if}
							<div
								class="w-full text-[10px] opacity-60 group-data-[variant='sent']/chat-bubble:text-end"
							>
								{formatTime(msg.created_at)}
								{#if isSent && msg.is_read}
									· Αναγνώστηκε
								{/if}
							</div>
						</Chat.BubbleMessage>
					</Chat.Bubble>
				{/each}
			{/if}
		</Chat.List>
	</div>

	<!-- Input -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSend();
		}}
		class="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5"
	>
		<EmojiPicker.Root
			showRecents
			recentsKey="emoji-picker-chat"
			disableInitialScroll
			onSelect={(selected) => {
				emojiOpen = false;
				messageText += selected.emoji;
			}}
		>
			<Popover.Root bind:open={emojiOpen}>
				<Popover.Trigger
					class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0 rounded-full')}
				>
					<SmilePlusIcon class="size-4" />
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" side="top" align="start">
					<EmojiPicker.Search />
					<EmojiPicker.List class="h-[175px]" />
					<EmojiPicker.Footer class="relative flex max-w-[232px] items-center gap-2 px-2">
						{#snippet children({ active })}
							<div class="flex w-[calc(100%-40px)] items-center gap-2">
								<span class="text-lg">{active?.emoji}</span>
								<span class="truncate text-xs text-muted-foreground">
									{active?.data.name}
								</span>
							</div>
							<EmojiPicker.SkinToneSelector />
						{/snippet}
					</EmojiPicker.Footer>
				</Popover.Content>
			</Popover.Root>
		</EmojiPicker.Root>

		<button
			type="button"
			onclick={() => fileInput?.click()}
			class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0 rounded-full')}
		>
			<ImageIcon class="size-4" />
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp,image/gif"
			class="hidden"
			onchange={handleImageUpload}
		/>

		<Input
			bind:value={messageText}
			class="rounded-full"
			placeholder="Γράψε ένα μήνυμα..."
			disabled={sending}
		/>
		<Button
			type="submit"
			variant="default"
			size="icon"
			class="shrink-0 rounded-full"
			disabled={messageText.trim() === '' || sending}
		>
			{#if sending}
				<LoaderIcon class="animate-spin size-4" />
			{:else}
				<SendIcon class="size-4" />
			{/if}
		</Button>
	</form>
</div>
