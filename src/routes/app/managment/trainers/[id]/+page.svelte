<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getEvaluationById, reviewEvaluation } from '$lib/api/trainers/trainer_evalution/data.remote';
	import EvaluationDetailView from '$lib/components/trainer/EvaluationDetailView.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ArrowLeft, CheckCircle2 } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';

	const evaluationId = $derived(Number(page.params.id));
	// svelte-ignore state_referenced_locally
	let evalQuery = getEvaluationById({ evaluationId });
	let result = $derived(evalQuery.current);
	let isLoading = $derived(evalQuery.current === undefined);

	// Review dialog state
	let reviewDialogOpen = $state(false);
	let adminNotes = $state('');
	let isReviewing = $state(false);

	let isAlreadyReviewed = $derived(result?.evaluation?.submit === 'reviewed');

	async function handleReview() {
		isReviewing = true;
		try {
			await reviewEvaluation({ evaluationId, admin_notes: adminNotes });
			showSuccessToast('Επιτυχία', 'Η αξιολόγηση σημάνθηκε ως εξεταστεί και ο trainer ενημερώθηκε.');
			reviewDialogOpen = false;
			adminNotes = '';
			evalQuery.refresh();
		} catch (err) {
			console.error('[handleReview] error:', err);
			showFailToast('Σφάλμα', 'Αποτυχία σήμανσης αξιολόγησης.');
		} finally {
			isReviewing = false;
		}
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pb-8 pt-4">

		<!-- Header -->
		<div class="mb-6 flex items-center gap-3">
			<Button variant="ghost" size="icon" class="h-9 w-9 shrink-0" onclick={() => goto('/trainer/evaluations')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="font-mono text-3xl tracking-wider md:text-4xl">Quality Control</h1>
				<p class="text-xs text-muted-foreground">
					#{evaluationId} · Λεπτομέρειες αξιολόγησης καταστήματος
				</p>
			</div>
		</div>

		<!-- Loading skeleton -->
		{#if isLoading}
			<div class="space-y-4">
				<div class="rounded-xl border border-border bg-card p-5">
					<div class="flex justify-between">
						<div class="space-y-2">
							<div class="h-4 w-24 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-56 animate-pulse rounded-lg bg-muted"></div>
							<div class="h-4 w-32 animate-pulse rounded-md bg-muted"></div>
						</div>
						<div class="h-20 w-20 animate-pulse rounded-full bg-muted"></div>
					</div>
					<div class="mt-4 flex gap-6 border-t border-border/40 pt-4">
						<div class="h-4 w-40 animate-pulse rounded-md bg-muted"></div>
						<div class="h-4 w-40 animate-pulse rounded-md bg-muted"></div>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{#each [1, 2] as _}
						<div class="space-y-4">
							{#each [140, 240, 180] as h}
								<div class="animate-pulse rounded-xl border border-border bg-card" style="height: {h}px"></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

		<!-- Error state -->
		{:else if !result?.evaluation}
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<div class="mb-4 rounded-full bg-muted p-4">
					<svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="font-mono text-lg tracking-wide">Δεν βρέθηκε αξιολόγηση</p>
				<p class="mt-1 text-sm text-muted-foreground">Η αξιολόγηση #{evaluationId} δεν υπάρχει.</p>
				<Button class="mt-6" onclick={() => goto('/app/managment/trainers')}>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Πίσω στις αξιολογήσεις
				</Button>
			</div>

		<!-- Detail view -->
		{:else}
			<EvaluationDetailView
				evaluation={result.evaluation}
				staffProfiles={result.staffProfiles}
				photoItemsWithUrls={result.photoItemsWithUrls}
			/>

			<!-- Review action bar -->
			<div class="mt-6 flex justify-end">
				{#if isAlreadyReviewed}
					<div class="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
						<CheckCircle2 class="h-4 w-4 shrink-0" />
						Εξεταστεί
					</div>
				{:else}
					<Button
						onclick={() => (reviewDialogOpen = true)}
						class="gap-2"
					>
						<CheckCircle2 class="h-4 w-4" />
						Εξετάστηκε
					</Button>
				{/if}
			</div>
		{/if}

	</main>
</div>

<!-- Review dialog -->
<Dialog.Root bind:open={reviewDialogOpen}>
	<Dialog.Content class="sm:max-w-[480px]">
		<Dialog.Header>
			<Dialog.Title>Σήμανση ως Εξεταστεί</Dialog.Title>
			<Dialog.Description>
				Ο trainer θα ειδοποιηθεί με email ότι η αξιολόγησή του εξετάστηκε.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-3 py-4">
			<Label for="admin-notes">Σχόλια (προαιρετικά)</Label>
			<Textarea
				id="admin-notes"
				bind:value={adminNotes}
				placeholder="Προσθέστε σχόλια ή παρατηρήσεις για τον trainer…"
				rows={5}
				disabled={isReviewing}
				class="resize-none"
			/>
			<p class="text-xs text-muted-foreground">
				Τα σχόλια θα συμπεριληφθούν στο email που θα λάβει ο trainer.
			</p>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (reviewDialogOpen = false)} disabled={isReviewing}>
				Ακύρωση
			</Button>
			<Button onclick={handleReview} disabled={isReviewing} class="gap-2">
				{#if isReviewing}
					<Spinner class="h-4 w-4" />
					Αποστολή…
				{:else}
					<CheckCircle2 class="h-4 w-4" />
					Επιβεβαίωση
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
