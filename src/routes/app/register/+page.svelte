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
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { Supplier } from '$lib/models/register.types';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import { authenticatedAccess, checkRegisterToday } from './data.remote';
	import NoAccess from '$lib/components/custom/register/noAccess.svelte';
	import RegisterProgressBar from '$lib/components/custom/register/RegisterProgressBar.svelte';

	let auth = authenticatedAccess();
	let query = checkRegisterToday();

	let hasAccess = $derived(auth.current?.hasAccess);
	let authMessage = $derived(auth.current?.message || '');

	let checkRegister = $derived(query?.current?.hasRegisterToday);
	let date = $derived(query?.current?.date);

	$effect(() => {
		if (query?.current) {
			if (hasAccess) {
				showSuccessToast('Επιτυχία', authMessage);
			} else {
				showFailToast('Fail', authMessage);
			}
		}
	});

	// Form state
	let currentStep = $state(1);
	const totalSteps = 5;
	const stepLabels = ['Πωλήσεις', 'Προμηθευτές', 'Έξοδα', 'Μετρητά', 'Επισκόπηση'];

	// Step functions
	function handleNextStep() {
		// Add validation logic here if needed
		currentStep++;
	}

	function handlePrevStep() {
		currentStep--;
	}

	function handleStepChange(step: number) {
		// Add validation for going to specific steps if needed
		currentStep = step;
	}
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
		{#if hasAccess === false}
			<NoAccess />
		{/if}
		<main class="container mx-auto px-4 py-8 md:px-6">
			<!-- Header -->
			<div class="mb-12">
				<h1 class="font-mono text-4xl tracking-wider text-neutral-800">
					ΗΜΕΡΗΣΙΟ ΚΛΕΙΣΙΜΟ ΤΑΜΕΙΟΥ
				</h1>
				<p class="mt-2 text-sm text-[#8B6B4A]">Καταγραφή ημερήσιας χρηματικής διακίνησης</p>
			</div>

			<RegisterProgressBar bind:currentStep {totalSteps} {stepLabels} />
			<!-- Form Container -->
			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Main Form Area -->
				<div class="lg:col-span-2">
					{#if currentStep === 1}

					{:else if currentStep === 2}
					
					{:else if currentStep === 3}
					
					{:else if currentStep === 4}
					
					{:else if currentStep === 5}
					
					{/if}
				</div>
			</div>
			<!-- Navigation Controls -->
				<div class="mt-12 flex items-center justify-between gap-4">
					<Button
						onclick={handlePrevStep}
						disabled={currentStep === 1}
						variant="outline"
						size="lg"
						class="gap-2 transition-all duration-300"
					>
						<ChevronLeft class="h-5 w-5" />
						Προηγούμενο
					</Button>

					<div class="text-center">
						<p class="text-sm text-neutral-600">
							Βήμα <span class="font-semibold text-[#8B6B4A]">{currentStep}</span> από
							<span class="font-semibold">{totalSteps}</span>
						</p>
					</div>

					{#if currentStep === totalSteps}
						<Button
							size="lg"
							class="transform gap-2 bg-[#8B6B4A] px-8 transition-all duration-300 hover:scale-105 hover:bg-[#6B5239]"
						>
							<CheckCheck class="h-5 w-5" />
							Υποβολή Κλεισίματος
						</Button>
					{:else}
						<Button
							onclick={handleNextStep}
							disabled={currentStep === totalSteps}
							size="lg"
							class="transform gap-2 bg-[#8B6B4A] transition-all duration-300 hover:scale-105 hover:bg-[#6B5239]"
						>
							Επόμενο
							<ChevronRight class="h-5 w-5" />
						</Button>
					{/if}
				</div>
		</main>
	</div>
{/if}
