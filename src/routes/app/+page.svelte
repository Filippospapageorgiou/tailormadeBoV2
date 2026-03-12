<script lang="ts">
	import type { Blog } from '$lib/models/database.types';
	import Hero from '$lib/components/custom/hero/hero.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Search, Sparkles, ArrowRight, Calendar as CalendarIcon } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { format } from 'date-fns';
	import { el } from 'date-fns/locale';

	let { data, form } = $props();
	let blog = $derived(data.blog as Blog);
	let count = $derived(data.count);
	let tosFlag = $derived(data?.tos ?? false);

	function getFirstImage(images: any) {
		if (images && Array.isArray(images) && images.length > 0) {
			const firstImage = images[0];
			if (typeof firstImage === 'string') return firstImage;
			if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
		}
		return '/placeholder.jpg';
	}

	function truncateText(text: string | null | undefined, maxLength: number = 120) {
		if (!text || typeof text !== 'string') return '';
		// Remove markdown syntax for preview
		const plainText = text.replace(/[#*_~`\[\]]/g, '');
		return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
	}

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		return format(new Date(dateString), 'dd MMMM yyyy', { locale: el });
	}

	let loading = $state(false);
	let termsAccepted = $state(false);
</script>

<div class="flex flex-1 flex-col gap-4 bg-background p-4 pt-6">
	<!-- Hero Section -->
	<Hero />

	<!-- Main Cards Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<!-- Recipes Card -->
		<a
			href="/app/recipes/"
			style="animation-delay: 220ms; animation-fill-mode: backwards;"
			class="group relative animate-fade-in cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
		>
			<!-- Image -->
			<div class="relative h-40 overflow-hidden">
				<div
					class="absolute inset-0 z-10 bg-gradient-to-t from-card via-transparent to-transparent"
				></div>
				<img
					src="/drink.jpg"
					alt="Coffee recipes"
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<!-- Badge -->
				<div
					class="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
				>
					<Sparkles class="h-3 w-3" />
					{count} Συνταγές
				</div>
			</div>

			<!-- Content -->
			<div class="p-5">
				<h3
					class="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
				>
					Οι συνταγές μας
				</h3>
				<p class="mb-4 text-sm leading-relaxed text-muted-foreground">
					Μελέτησε τις συνταγές μας για να είσαι πάντα προετοιμασμένος για το επόμενο ρόφημα.
				</p>
				<div
					class="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
				>
					Εξερεύνησε <ArrowRight class="h-4 w-4" />
				</div>
			</div>
		</a>

		<!-- Schedule Card -->
		<a
			href="/app/schedule/"
			style="animation-delay: 280ms; animation-fill-mode: backwards;"
			class="group relative animate-fade-in cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
		>
			<!-- Calendar Visual Header -->
			<div class="relative h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-4">
				<!-- Background Icon -->
				<div class="absolute top-3 right-3">
					<CalendarIcon class="h-8 w-8 text-primary/20" />
				</div>

				<!-- Mini Calendar Preview -->
				<div class="absolute right-4 bottom-4 left-4">
					<div class="mb-2 text-xs text-muted-foreground">Ιανουάριος 2026</div>
					<div class="grid grid-cols-7 gap-1">
						{#each ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'] as day}
							<div class="text-center text-[10px] text-muted-foreground/60">{day}</div>
						{/each}
						{#each [27, 28, 29, 30, 31, 1, 2] as day}
							<div
								class="rounded py-1 text-center text-xs {day === 31
									? 'bg-primary font-semibold text-primary-foreground'
									: day > 26 && day < 32
										? 'text-muted-foreground'
										: 'text-muted-foreground/40'}"
							>
								{day}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-5">
				<h3
					class="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
				>
					Το Πρόγραμμά μου
				</h3>
				<p class="mb-4 text-sm leading-relaxed text-muted-foreground">
					Δες τις βάρδιές σου και συντονίσου με την ομάδα.
				</p>
				<div
					class="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
				>
					Δες πρόγραμμα <ArrowRight class="h-4 w-4" />
				</div>
			</div>
		</a>

		<!-- Blog Card -->
		{#if blog}
			<a
				style="animation-delay: 300ms; animation-fill-mode: backwards;"
				href="/app/blog/{blog.id}"
				class="group relative animate-fade-in cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
			>
				<!-- Image -->
				<div class="relative h-40 overflow-hidden">
					<div
						class="absolute inset-0 z-10 bg-gradient-to-t from-card via-transparent to-transparent"
					></div>
					<img
						src={getFirstImage(blog.images)}
						alt={blog.title}
						class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
					<!-- Date Badge -->
					<div
						class="absolute top-3 left-3 z-20 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm"
					>
						{formatDate(blog.created_at)}
					</div>
				</div>

				<!-- Content -->
				<div class="p-5">
					<h3
						class="mb-2 line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
					>
						{blog.title}
					</h3>
					{#if blog.content}
						<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{truncateText(blog.content, 120)}
						</p>
					{/if}
					<div
						class="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
					>
						Διάβασε περισσότερα <ArrowRight class="h-4 w-4" />
					</div>
				</div>
			</a>
		{:else}
			<div class="flex items-center justify-center rounded-2xl border border-border/50 bg-card">
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><Search class="text-primary" /></Empty.Media>
						<Empty.Title class="text-foreground">Δεν υπάρχουν νέα</Empty.Title>
						<Empty.Description class="text-muted-foreground"
							>Μείνετε συντονισμένοι.</Empty.Description
						>
					</Empty.Header>
				</Empty.Root>
			</div>
		{/if}
	</div>
</div>

<!-- Terms Dialog -->
<Dialog.Root open={tosFlag}>
	<Dialog.Content class="max-w-[460px] overflow-hidden border-border/50 p-0">
		<Dialog.Header class="border-b border-border/50 bg-muted px-5 py-3">
			<Dialog.Title class="text-lg text-foreground">Όροι και Προϋποθέσεις</Dialog.Title>
		</Dialog.Header>
		<div class="max-h-[350px] space-y-3 overflow-y-auto bg-card p-5">
			<!-- Beta Notice -->
			<div
				class="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
			>
				<strong>⚠ Beta:</strong> Η εφαρμογή είναι σε πιλοτική φάση, χωρίς εγγυήσεις λειτουργίας. Επιβεβαιώνετε
				κρίσιμες πληροφορίες με τη διοίκηση.
			</div>
			<div class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
				<div class="flex gap-2">
					<span class="font-bold text-primary">1.</span>
					<p>Αποκλειστικά για εργαζομένους της Tailor Made & Venetis Enterprise.</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">2.</span>
					<p>
						Τα δεδομένα σας επεξεργάζονται στο πλαίσιο της σύμβασης εργασίας και δεν κοινοποιούνται
						σε τρίτους.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">3.</span>
					<p>
						Απαγορεύεται η κοινοποίηση εσωτερικού περιεχομένου (συνταγές, εκπαιδεύσεις, προγράμματα)
						χωρίς έγκριση.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">4.</span>
					<p>Έχετε δικαίωμα πρόσβασης, διόρθωσης και διαγραφής των δεδομένων σας (GDPR).</p>
				</div>
			</div>
			<div class="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/50 p-3">
				<Checkbox
					id="terms"
					bind:checked={termsAccepted}
					class="border-primary data-[state=checked]:bg-primary"
				/>
				<div class="grid gap-1 leading-none">
					<Label for="terms" class="text-xs font-semibold text-foreground"
						>Έχω διαβάσει και αποδέχομαι τους όρους</Label
					>
				</div>
			</div>
		</div>
		<Dialog.Footer
			class="flex items-center justify-between border-t border-border/50 bg-muted/30 px-5 py-3 sm:justify-between"
		>
			<!--<a href="/legal" class="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">Αναλυτικοί Όροι</a>-->
			<form
				method="POST"
				action="?/acceptTerms"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<input type="hidden" name="accept" value="accept" />
				<Button
					type="submit"
					disabled={!termsAccepted || loading}
					class="min-w-[100px] bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{#if loading}
						<Spinner class="mr-2 h-4 w-4" />
						Φόρτωση...
					{:else}
						Έχω διαβάσει και αποδέχομαι
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
