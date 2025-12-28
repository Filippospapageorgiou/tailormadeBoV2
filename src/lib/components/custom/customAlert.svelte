<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { toast } from '$lib/stores/toast.svelte';

	let timeoutId: ReturnType<typeof setTimeout>;
	let isExiting = $state(false);

	$effect(() => {
		if (toast.show) {
			isExiting = false;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					toast.show = false;
				}, 300);
			}, 2000);
		}
	});

	$effect(() => {
		return () => {
			clearTimeout(timeoutId);
		};
	});
</script>

{#if toast.show}
	<div
		class="fixed top-4 left-1/2 z-[52] w-full max-w-md -translate-x-1/2 transform px-4 {isExiting
			? 'animate-fade-out-up'
			: 'animate-fade-in-down'}"
	>
		{#if toast.status}
			<Alert.Root variant="default" class="bg-primary/10 border border-primary/30 shadow-lg backdrop-blur-sm">
				<CheckCircle2Icon class="text-primary size-5" />
				<Alert.Title class="text-foreground font-semibold">{toast.title}</Alert.Title>
				<Alert.Description class="text-foreground/80">{toast.text}</Alert.Description>
			</Alert.Root>
		{:else}
			<Alert.Root variant="destructive" class="bg-destructive/10 border border-destructive/30 shadow-lg backdrop-blur-sm">
				<AlertCircleIcon class="size-5 text-destructive" />
				<Alert.Title class="text-destructive font-semibold">{toast.title}</Alert.Title>
				<Alert.Description class="text-destructive/80">{toast.text}</Alert.Description>
			</Alert.Root>
		{/if}
	</div>
{/if}