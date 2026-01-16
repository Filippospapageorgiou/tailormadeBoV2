<script lang="ts">
	import { progress } from '$lib/stores/progress.svelte';
	import { Progress } from '$lib/components/ui/progress';
	import Spinner from '../ui/spinner/spinner.svelte';
</script>

{#if progress.show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
		<div
			class="w-full max-w-sm mx-4 p-6 bg-card border border-border/50 dark:border-white/10 
				   rounded-2xl shadow-xl text-center space-y-4
				   animate-in fade-in zoom-in-95 duration-200"
		>
			<!-- Spinner -->
			<div class="flex justify-center">
				<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
					<Spinner />
				</div>
			</div>

			<!-- Text -->
			<p class="text-base font-medium text-foreground">{progress.text}</p>

			<!-- Progress bar -->
			<div class="space-y-2">
				<Progress value={progress.progress} class="h-2" />
				<p class="text-xs text-muted-foreground">{progress.progress}%</p>
			</div>
		</div>
	</div>
{/if}