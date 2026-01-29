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
		class="fixed top-6 left-1/2 z-[52] w-full max-w-sm -translate-x-1/2 transform px-4 {isExiting
			? 'animate-fade-out-up'
			: 'animate-fade-in-down'}"
	>
		{#if toast.status}
			<div class="flex items-start gap-3 rounded-xl bg-card border border-border p-4 shadow-xl">
				<div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
					<CheckCircle2Icon class="size-4 text-primary" />
				</div>
				<div class="flex-1 pt-0.5">
					<p class="text-sm font-medium text-foreground">{toast.title}</p>
					<p class="text-xs text-muted-foreground mt-0.5">{toast.text}</p>
				</div>
			</div>
		{:else}
			<div class="flex items-start gap-3 rounded-xl bg-card border border-destructive/20 p-4 shadow-xl">
				<div class="flex size-8 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircleIcon class="size-4 text-destructive" />
				</div>
				<div class="flex-1 pt-0.5">
					<p class="text-sm font-medium text-foreground">{toast.title}</p>
					<p class="text-xs text-muted-foreground mt-0.5">{toast.text}</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
