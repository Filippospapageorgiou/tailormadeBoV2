<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import CustomAlert from '$lib/components/custom/customAlert.svelte';
	import CustomProgressBar from '$lib/components/custom/customProgressBar.svelte';
	let { data, children } = $props();
	let { session, supabase } = $derived(data);

	let favicon = '/logo.png';

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => data.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />
<CustomAlert />
<CustomProgressBar />
{@render children?.()}
