<script lang="ts">
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import type { PageProps } from './$types';
	import { authenticatedAccess } from './data.remote';
	import { toast } from 'svelte-sonner';

	let auth = authenticatedAccess();
	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});
	let { data }: PageProps = $props();
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<p>authenticatedAccess</p>
{/if}
