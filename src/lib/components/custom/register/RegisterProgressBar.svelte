<script lang="ts">
	import { Check } from 'lucide-svelte';

	interface Props {
		currentStep?: number;
		totalSteps?: number;
	}

	let {
		currentStep = $bindable(1),
		totalSteps = 4,
	}: Props = $props();

	const labels = ['Πωλήσεις', 'Προμηθευτές', 'Έξοδα', 'Επισκόπηση'];
</script>

<nav aria-label="Βήματα φόρμας" class="mb-10">
	<div class="flex items-center justify-between">
		{#each Array(totalSteps) as _, i}
			<div class="flex flex-1 items-center">
				<div class="flex flex-col items-center flex-shrink-0">
					<button
						type="button"
						aria-label="Βήμα {i + 1}: {labels[i]}"
						aria-current={currentStep === i + 1 ? 'step' : undefined}
						onclick={() => { if (i + 1 < currentStep) currentStep = i + 1; }}
						class="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold
							transition-all duration-300 ease-out
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
							{currentStep > i + 1
								? 'bg-primary text-primary-foreground shadow-sm cursor-pointer hover:shadow-md hover:scale-105'
								: currentStep === i + 1
									? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20 scale-105'
									: 'bg-muted text-muted-foreground cursor-default'}"
					>
						{#if currentStep > i + 1}
							<Check class="h-4.5 w-4.5" strokeWidth={2.5} />
						{:else}
							{i + 1}
						{/if}
					</button>
					<span
						class="mt-2.5 text-xs font-medium text-center whitespace-nowrap transition-colors duration-300
							{currentStep === i + 1
								? 'text-foreground font-semibold'
								: currentStep > i + 1
									? 'text-primary'
									: 'text-muted-foreground'}"
					>
						{labels[i]}
					</span>
				</div>
				{#if i < totalSteps - 1}
					<div class="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
							style="width: {currentStep > i + 1 ? '100%' : '0%'}"
						></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</nav>
