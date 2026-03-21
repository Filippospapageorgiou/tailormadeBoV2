<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';
</script>

<!-- Empty state — shown when no conversation is selected -->
<div class="hidden h-full flex-col items-center justify-center gap-4 md:flex">
	<div class="flex flex-col items-center gap-4 text-center">
		<div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
			<MessageCircle class="size-8 text-primary" />
		</div>
		<div>
			<h2 class="font-mono text-lg font-semibold">Επίλεξε συνομιλία</h2>
			<p class="mt-1 max-w-[260px] text-sm text-muted-foreground">
				Επίλεξε μια συνομιλία από τη λίστα ή ξεκίνα μια νέα.
			</p>
		</div>
	</div>
</div>
