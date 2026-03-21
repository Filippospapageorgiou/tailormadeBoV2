<script lang="ts">
	import ChatSidebar from '$lib/components/custom/chat/ChatSidebar.svelte';

	let { data, children } = $props();
</script>

<div class="flex h-[calc(100dvh-4.5rem)] overflow-hidden">
	<ChatSidebar basePath="/trainer/chat" />
	<div class="flex-1">
		{@render children()}
	</div>
</div>
