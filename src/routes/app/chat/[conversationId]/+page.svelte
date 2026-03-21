<script lang="ts">
	import { page } from '$app/state';
	import ChatConversationView from '$lib/components/custom/chat/ChatConversationView.svelte';

	let { data } = $props();

	let conversationId = $derived(Number(page.params.conversationId));
</script>

{#key conversationId}
	<ChatConversationView {conversationId} basePath="/app/chat" supabase={data.supabase} />
{/key}
