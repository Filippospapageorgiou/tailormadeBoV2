<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import { Chat } from '@ai-sdk/svelte';

	let input = '';
	const chat = new Chat({});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		chat.sendMessage({ text: input });
		input = '';
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<main class="container mx-auto w-full max-w-2xl px-4 pb-10 md:px-6">
		<ul>
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li>
					<div>{message.role}</div>
					<div>
						{#each message.parts as part, partIndex (partIndex)}
							{#if part.type === 'text'}
								<div>{part.text}</div>
							{/if}
						{/each}
					</div>
				</li>
			{/each}
		</ul>
		<form onsubmit={handleSubmit}>
			<Input bind:value={input} />
			<button type="submit">Send</button>
		</form>
	</main>
</div>
