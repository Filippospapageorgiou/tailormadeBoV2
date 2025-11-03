<script lang="ts">
	import { ChevronLeft, ChevronRight, CheckCheck } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import {
		authenticatedAccess,
		checkRegisterToday,
		dailyRegisterForm,
		getOpeningFloat,
		getActiveSuppliers
	} from './data.remote';
	import NoAccess from '$lib/components/custom/register/noAccess.svelte';
	import RegisterProgressBar from '$lib/components/custom/register/RegisterProgressBar.svelte';
	import SuppliersStep from '$lib/components/custom/register/steps/SuppliersStep.svelte';
	import ExpensesStep from '$lib/components/custom/register/steps/ExpensesStep.svelte';
	import { getSalesRegister, setSalesRegister } from '$lib/stores/register.svelte';
	import Summarize from '$lib/components/custom/register/steps/Summarize.svelte';
	import SalesStep from '$lib/components/custom/register/steps/SalesStep.svelte';
	import FinalStep from '$lib/components/custom/register/steps/FinalStep.svelte';
	

	let auth = authenticatedAccess();
	let query = checkRegisterToday();
	let queryOpeningFloat = getOpeningFloat();
	let queryGetAllSupliers = getActiveSuppliers();

	let suppliers = $derived(queryGetAllSupliers?.current?.suppliers || []);
	let suppliersLoading = $derived(queryGetAllSupliers.loading);
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

	let sales = setSalesRegister({
		totalSales: 0,
		cardSales: 0,
		woltSales: 0,
		efoodSales: 0,
		otherDigitalSales: 0,
		actualCashCounted: 0,
		openingFloat: queryOpeningFloat?.current?.openingFloat || 0.0,
		supplierPayments: [],
		expenses: [],
		totalExpenses: 0,
		totalSupplierPayments: 0
	});

	$effect(() => {
		$inspect(sales.supplierPayments);
		$inspect(sales.expenses);
	})
	let currentStep = $state(1);
	const totalSteps = 4;

	// Step functions
	function handleNextStep() {
		if (validateCurrentStep()) {
			currentStep++;
		}
	}

	function handlePrevStep() {
		currentStep--;
	}

	function validateCurrentStep(): boolean {
		switch (currentStep) {
			case 1:
				if(sales.totalSales <= 0 || sales.cardSales <= 0){
					showFailToast('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία του τάμιου');
					return false;
				}
				return true;
			case 2:
				if (sales.supplierPayments.some((p) => !p.supplier_name || p.amount <= 0)) {
					showFailToast('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία προμηθευτών');
					return false;
				}
				return true;
			case 3:
				if (sales.expenses.some((e) => !e.description || e.amount <= 0)) {
					showFailToast('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία εξόδων');
					return false;
				}
				return true;
			case 4:
				return true;
			default:
				return true;
		}
	}

	async function refreshSuppliers() {
		await queryGetAllSupliers.refresh();
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
				<p class="mt-2 text-sm text-[#8B6B4A]">
					Καταγραφή ημερήσιας χρηματικής διακίνησης {date || ''}
				</p>
			</div>

			<RegisterProgressBar bind:currentStep {totalSteps} />

			<!-- Form Container -->
			<div class="grid gap-8 px-4 lg:grid-cols-3">
				<!-- Main Form Area -->
				<div class="lg:col-span-2">
					{#if currentStep === 1}
						<SalesStep />
					{:else if currentStep === 2}
						<SuppliersStep
							{suppliers}
							{suppliersLoading}
							onSuccess={refreshSuppliers}
						/>
					{:else if currentStep === 3}
						<ExpensesStep />
					{:else if currentStep === 4}
						<FinalStep />
					{/if}
				</div>
				<Summarize />
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
