<script lang="ts">
	import { X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';

	let { 
		open = $bindable(false), 
		imageUrl = null,
		onClose = () => {}
	}: { 
		open: boolean; 
		imageUrl: string | null;
		onClose?: () => void;
	} = $props();

	function handleClose() {
		open = false;
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClose();
		}
	}
</script>

{#if open && imageUrl}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Image preview dialog"
		tabindex="0"
		onclick={handleClose}
		onkeydown={handleKeydown}
		transition:fade={{ duration: 200 }}
	>
		<button
			class="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
			onclick={handleClose}
			aria-label="Close preview"
			type="button"
		>
			<X class="h-6 w-6" />
		</button>

		<button
			type="button"
			class="rounded-lg p-0"
			onclick={(e) => e.stopPropagation()}
			aria-label="Preview image"
		>
			<img
				src={imageUrl}
				alt="Preview"
				class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
				transition:scale={{ duration: 200 }}
			/>
		</button>
	</div>
{/if}