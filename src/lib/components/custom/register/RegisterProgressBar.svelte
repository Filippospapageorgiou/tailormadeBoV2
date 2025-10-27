<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Plus,
		Trash2,
		User,
		DollarSign,
		Package,
		Receipt,
		CheckCheck
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';

	interface Props {
		currentStep?: number;
		totalSteps?: number;
		stepLabels?: string[];
	}

	let {
		currentStep = $bindable(1),
		totalSteps = 5,
		stepLabels = ['Πωλήσεις', 'Προμηθευτές', 'Έξοδα', 'Μετρητά', 'Επισκόπηση'],

	}: Props = $props();

</script>

<div class="mb-8">
	<div class="flex items-center justify-between">
		{#each Array(totalSteps) as _, i}
			<div class="flex flex-1 items-center">
				<button
					onclick={() => (currentStep = i + 1)}
					class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold transition-all {currentStep >=
					i + 1
						? 'bg-[#8B6B4A] text-white shadow-lg'
						: 'bg-neutral-200 text-neutral-600'}"
				>
					{i + 1}
				</button>
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
	<div class="mt-4 flex justify-between text-xs text-neutral-600">
		<span>Πωλήσεις</span>
		<span>Προμηθευτές</span>
		<span>Έξοδα</span>
		<span>Μετρητά</span>
		<span>Επισκόπηση</span>
	</div>
</div>

