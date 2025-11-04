<script lang="ts">
	import * as Empty from "$lib/components/ui/empty/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { goto } from "$app/navigation";
	import { onMount } from 'svelte';
	import { CalendarCheck } from 'lucide-svelte';
	
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
</script>

<div class="fixed backdrop-blur-sm w-full h-full flex items-center justify-center z-50">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="default">
				<div class="rounded-full bg-[#8B6B4A]/10 p-3">
					<CalendarCheck class="h-8 w-8 text-[#8B6B4A]" />
				</div>
			</Empty.Media>
			<Empty.Title>Το Ταμείο Έχει Ήδη Κλείσει Σήμερα</Empty.Title>
			<Empty.Description>
				Έχει ήδη γίνει κλείσιμο ταμείου για σήμερα. Δοκίμασε ξανά αύριο.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button 
				onclick={() => goto('/app/')} 
				class="cursor-pointer" 
				size="sm"
			>
				Πίσω στην Εφαρμογή
			</Button>
		</Empty.Content>
	</Empty.Root>
</div>