<script lang="ts">
	import * as Empty from "$lib/components/ui/empty/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { goto } from "$app/navigation";
	import { onMount } from 'svelte';
	import { CalendarCheck } from 'lucide-svelte';

	onMount(() => {
		document.body.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.width = '100%';
		document.body.style.top = `-${window.scrollY}px`;

		const scrollY = window.scrollY;

		return () => {
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
			window.scrollTo(0, scrollY);
		};
	});
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="default">
				<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
					<CalendarCheck class="h-7 w-7 text-primary" />
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
