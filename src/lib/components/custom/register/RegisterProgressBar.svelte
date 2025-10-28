<script lang="ts">
	
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

<div class="mb-8">
	<div class="flex items-center justify-between">
		{#each Array(totalSteps) as _, i}
			<div class="flex flex-1 items-center">
				<div class="flex flex-col items-center flex-shrink-0">
					<button
						onclick={() => (currentStep = i + 1)}
						class="flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all {currentStep >=
						i + 1
							? 'bg-[#8B6B4A] text-white shadow-lg'
							: 'bg-neutral-200 text-neutral-600'}"
					>
						{i + 1}
					</button>
					<span class="mt-2 text-sm text-center whitespace-nowrap">{labels[i]}</span>
				</div>
				{#if i < totalSteps - 1}
					<div
						class="mx-2 h-1 flex-1 rounded-full transition-all {currentStep > i + 1
							? 'bg-[#8B6B4A]'
							: 'bg-neutral-200'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>