<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import CustomAlert from '$lib/components/custom/customAlert.svelte';
	import CustomProgressBar from '$lib/components/custom/customProgressBar.svelte';
	import Feedbackmodal from '$lib/components/custom/Feedbackmodal.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { setProfileContext, updateGlobalProfile } from '$lib/stores/profile.svelte.js';

	let { data, children } = $props();
	let { session, supabase, profile } = $derived(data);

	// Set profile context globally - available everywhere
	let currentProfile = $derived(profile || null);

	// svelte-ignore state_referenced_locally
	setProfileContext(profile);

	// Update when profile changes (e.g., after page refresh)
	$effect(() => {
		if (data.profile) {
			updateGlobalProfile(data.profile);
		}
	});

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

<Feedbackmodal />
<ModeWatcher />
<Toaster />
<CustomAlert />
<CustomProgressBar />
{@render children?.()}