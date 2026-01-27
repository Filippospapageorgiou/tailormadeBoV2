<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Star, Send, MessageSquare, AlertCircle } from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { submitFeedback } from '$lib/api/feedback/data.remote';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
    import { openFeedBackModal,closeModal} from '$lib/stores/feedback.svelte';
	
    let open = $derived(openFeedBackModal.open);

	let rating = $state(0);
	let hoveredRating = $state(0);
	let comment = $state('');
	let isSubmitting = $state(false);

	// Rating labels
	const ratingLabels: Record<number, string> = {
		1: 'Πολύ Κακό',
		2: 'Κακό',
		3: 'Μέτριο',
		4: 'Καλό',
		5: 'Εξαιρετικό'
	};

	// Get current rating label
	let currentLabel = $derived(ratingLabels[hoveredRating || rating] || 'Επιλέξτε βαθμολογία');

	// Validation
	let isValid = $derived(rating >= 1 && comment.length >= 10);

	function handleStarClick(value: number) {
		rating = value;
	}

	function handleStarHover(value: number) {
		hoveredRating = value;
	}

	function handleStarLeave() {
		hoveredRating = 0;
	}

	function resetForm() {
		rating = 0;
		hoveredRating = 0;
		comment = '';
	}

	function handleClose() {
		open = false;
		// Reset form after animation
		setTimeout(resetForm, 300);
	}
</script>

<Dialog.Root bind:open onOpenChange={closeModal}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-3 text-xl">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<MessageSquare class="h-5 w-5 text-primary" />
				</div>
				Γράψτε μια Κριτική
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
                	Η γνώμη σας μετράει! Πείτε μας την εμπειρία σας και βοηθήστε μας να βελτιώσουμε την εφαρμογή. Κάθε feedback διαβάζεται προσωπικά από την ομάδα μας.
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-6 py-4"
			{...submitFeedback.enhance(async ({ form,data,submit }) => {
				isSubmitting = true;

				await submit();

				if (submitFeedback.result?.success) {
					showSuccessToast('Ευχαριστούμε!', submitFeedback.result.message);
					handleClose();
				} else {
					showFailToast('Σφάλμα', submitFeedback.result?.message || 'Αποτυχία υποβολής');
				}

				isSubmitting = false;
			})}
		>
			<!-- Hidden rating input -->
			<input type="hidden" {...submitFeedback.fields.rating.as('text')} value={rating} />

			<!-- Comment Section -->
			<div class="space-y-2">
				<Label for="feedback-comment" class="text-sm font-medium">
					Σχόλιο
				</Label>
				<Textarea
					id="feedback-comment"
					{...submitFeedback.fields.comment.as('text')}
					bind:value={comment}
					placeholder="Πείτε μας την εμπειρία σας..."
					rows={4}
					class="resize-none"
					disabled={isSubmitting}
				/>
				<div class="flex items-center justify-between text-xs text-muted-foreground">
					<span class:text-destructive={comment.length > 0 && comment.length < 10}>
						{#if comment.length > 0 && comment.length < 10}
							<AlertCircle class="mr-1 inline h-3 w-3" />
							Τουλάχιστον 10 χαρακτήρες
						{:else}
							{comment.length}/1000 χαρακτήρες
						{/if}
					</span>
				</div>
			</div>

			<!-- Star Rating Section -->
			<div class="space-y-3">
				<Label class="text-sm font-medium">Συνολική Βαθμολογία</Label>

				<div class="flex flex-col items-center gap-2">
					<!-- Stars -->
					<!-- svelte-ignore a11y_interactive_supports_focus -->
					<div
						class="flex gap-1"
						role="radiogroup"
						aria-label="Rating"
						onmouseleave={handleStarLeave}
					>
						{#each [1, 2, 3, 4, 5] as value}
							{@const isFilled = value <= (hoveredRating || rating)}
							<button
								type="button"
								role="radio"
								aria-checked={rating === value}
								aria-label={`${value} star${value > 1 ? 's' : ''}`}
								class="group relative p-1 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								onclick={() => handleStarClick(value)}
								onmouseenter={() => handleStarHover(value)}
								disabled={isSubmitting}
							>
								<Star
									class="h-8 w-8 transition-colors duration-150 {isFilled
										? 'fill-amber-400 text-amber-400'
										: 'fill-transparent text-muted-foreground/40 group-hover:text-amber-300'}"
								/>
							</button>
						{/each}
					</div>

					<!-- Rating Label -->
					<p
						class="h-5 text-sm font-medium transition-all duration-200 {rating > 0
							? 'text-foreground'
							: 'text-muted-foreground'}"
					>
						{currentLabel}
					</p>
				</div>
			</div>

			<!-- Privacy Notice -->
			<div class="rounded-lg border border-border/50 bg-muted/30 p-3">
				<p class="text-xs text-muted-foreground">
					<AlertCircle class="mr-1 inline h-3 w-3" />
					Το feedback σας <strong>δεν είναι ανώνυμο</strong>. Το όνομα και το email σας θα
					συμπεριληφθούν για να μπορέσουμε να επικοινωνήσουμε μαζί σας αν χρειαστεί.
				</p>
			</div>

			<!-- Submit Button -->
			<Button
				type="submit"
				class="w-full gap-2"
				disabled={!isValid || isSubmitting}
			>
				{#if isSubmitting}
					<Spinner class="h-4 w-4" />
					Υποβολή...
				{:else}
					<Send class="h-4 w-4" />
					Υποβολή Feedback
				{/if}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>