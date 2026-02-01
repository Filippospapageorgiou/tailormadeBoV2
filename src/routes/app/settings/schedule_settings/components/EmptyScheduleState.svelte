<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Plus, Copy, Sparkles } from 'lucide-svelte';

	interface Props {
		hasSchedules: boolean;
		onCreateNew: () => void;
		onCopyPrevious?: () => void;
	}

	let { hasSchedules, onCreateNew, onCopyPrevious }: Props = $props();
</script>

<div
	class="animate-in fade-in slide-in-from-bottom-6 duration-700"
>
	<div
		class="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-8 backdrop-blur-sm md:p-12"
	>
		<!-- Background decoration -->
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<!-- Grid pattern -->
			<div
				class="absolute inset-0 opacity-[0.02]"
				style="background-image: linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px); background-size: 40px 40px;"
			></div>

			<!-- Floating gradient orbs -->
			<div
				class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
			></div>
			<div
				class="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
			></div>
		</div>

		<div class="relative flex flex-col items-center text-center">
			<!-- Illustration -->
			<div class="relative mb-8">
				<!-- Calendar base -->
				<div
					class="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-2xl"
				>
					<!-- Calendar icon with animation -->
					<Calendar
						class="h-16 w-16 text-primary/60 transition-transform duration-500 hover:scale-110"
					/>

					<!-- Sparkle decorations -->
					<div class="absolute -top-2 -right-2 animate-pulse">
						<Sparkles class="h-5 w-5 text-primary/50" />
					</div>
					<div class="absolute -bottom-1 -left-1 animate-pulse" style="animation-delay: 300ms;">
						<Sparkles class="h-4 w-4 text-primary/30" />
					</div>

					<!-- Floating dots representing shifts -->
					<div
						class="absolute -top-4 right-4 h-3 w-3 animate-bounce rounded-full"
						style="background: var(--shift-morning); animation-delay: 0ms;"
					></div>
					<div
						class="absolute -right-4 top-4 h-2.5 w-2.5 animate-bounce rounded-full"
						style="background: var(--shift-afternoon); animation-delay: 150ms;"
					></div>
					<div
						class="absolute -bottom-3 right-8 h-2 w-2 animate-bounce rounded-full"
						style="background: var(--shift-evening); animation-delay: 300ms;"
					></div>
				</div>
			</div>

			<!-- Text content -->
			{#if !hasSchedules}
				<h3 class="mb-2 text-2xl font-bold tracking-tight">
					Δημιουργήστε το πρώτο σας πρόγραμμα
				</h3>
				<p class="mb-8 max-w-md text-muted-foreground">
					Ξεκινήστε να οργανώνετε τις βάρδιες της ομάδας σας. Δημιουργήστε ένα εβδομαδιαίο πρόγραμμα
					και προσθέστε τους εργαζόμενους.
				</p>
			{:else}
				<h3 class="mb-2 text-2xl font-bold tracking-tight">
					Δεν βρέθηκαν προγράμματα
				</h3>
				<p class="mb-8 max-w-md text-muted-foreground">
					Τα φίλτρα που εφαρμόσατε δεν επιστρέφουν αποτελέσματα. Δοκιμάστε να αλλάξετε τα κριτήρια
					αναζήτησης ή δημιουργήστε ένα νέο πρόγραμμα.
				</p>
			{/if}

			<!-- Action buttons -->
			<div class="flex flex-col items-center gap-3 sm:flex-row">
				<Button
					onclick={onCreateNew}
					size="lg"
					class="group gap-2 bg-primary px-6 text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
				>
					<Plus class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
					Νέο Πρόγραμμα
				</Button>

				{#if onCopyPrevious}
					<Button
						onclick={onCopyPrevious}
						variant="outline"
						size="lg"
						class="gap-2 border-white/10 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
					>
						<Copy class="h-4 w-4" />
						Αντιγραφή από προηγούμενο
					</Button>
				{/if}
			</div>

			<!-- Quick tip -->
			<div class="mt-8 flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2">
				<Sparkles class="h-4 w-4 text-primary/60" />
				<p class="text-xs text-muted-foreground">
					<span class="font-medium text-primary/80">Συμβουλή:</span> Αντιγράψτε ένα παλιό πρόγραμμα
					για να ξεκινήσετε πιο γρήγορα
				</p>
			</div>
		</div>
	</div>
</div>
