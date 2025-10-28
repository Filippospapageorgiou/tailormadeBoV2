<script lang="ts">
	import * as Empty from "$lib/components/ui/empty/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { getProfileContext } from "$lib/stores/profile.svelte";
	import { goto } from "$app/navigation";
	import { onMount } from 'svelte';
	
	onMount(() => {
		// Disable scrolling on body
		document.body.style.overflow = 'hidden';
		// Prevent iOS Safari bounce scrolling
		document.body.style.position = 'fixed';
		document.body.style.width = '100%';
		document.body.style.top = `-${window.scrollY}px`;
		
		const scrollY = window.scrollY;
		
		// Re-enable scrolling when component unmounts
		return () => {
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
			window.scrollTo(0, scrollY);
		};
	});

	let user = getProfileContext();
</script>

<div class="fixed backdrop-blur-sm w-full h-full flex items-center justify-center z-50">
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="default">
					<Avatar.Root class="size-12">
						<Avatar.Image src={user.imageUrl} class="grayscale" />
						<Avatar.Fallback>{user.email.slice(0, 2)}</Avatar.Fallback>
					</Avatar.Root>
				</Empty.Media>
				<Empty.Title>Απογαρευεται η πρόσβαση</Empty.Title>
				<Empty.Description>
					Δεν έχεις πρόσβαση στην εφαρμογή σε αυτήν την λειτουργία.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button onclick={() => {
					goto('/app/');
				}} class="cursor-pointer" size="sm">Πίσω στην εφαρμογή</Button>
			</Empty.Content>
		</Empty.Root>
</div>