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
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		return format(new Date(dateString), 'dd MMMM yyyy', { locale: el });
	}
	let loading = $state(false);
	let termsAccepted = $state(false);
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-6 bg-background">
	<!-- Hero Section - Now compact -->
	<Hero />

	<!-- Main Cards Grid - Equal Height -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		
		<!-- Recipes Card -->
		<a 
			href="/app/recipes/"
			style="animation-delay: 220ms; animation-fill-mode: backwards;"
			class="group relative animate-fade-in overflow-hidden rounded-2xl bg-card border border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
		>
			<!-- Image -->
			<div class="relative h-40 overflow-hidden">
				<div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10"></div>
				<img 
					src="/drink.jpg" 
					alt="Coffee recipes"
					class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<!-- Badge -->
				<div class="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-xs font-medium text-primary-foreground">
					<Sparkles class="w-3 h-3" />
					{count} Συνταγές
				</div>
			</div>
			
			<!-- Content -->
			<div class="p-5">
				<h3 class="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
					Οι συνταγές μας
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed mb-4">
					Μελέτησε τις συνταγές μας για να είσαι πάντα προετοιμασμένος για το επόμενο ρόφημα.
				</p>
				<div class="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
					Εξερεύνησε <ArrowRight class="w-4 h-4" />
				</div>
			</div>
		</a>

		<!-- Schedule Card -->
		<a 
			href="/app/schedule/"
			style="animation-delay: 280ms; animation-fill-mode: backwards;"
			class="group relative animate-fade-in overflow-hidden rounded-2xl bg-card border border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
		>
			<!-- Calendar Visual Header -->
			<div class="relative h-40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-4">
				<!-- Background Icon -->
				<div class="absolute top-3 right-3">
					<CalendarIcon class="w-8 h-8 text-primary/20" />
				</div>
				
				<!-- Today indicator -->
				<div class="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
					<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
					<span class="text-xs text-green-600 dark:text-green-400 font-medium">Σήμερα</span>
				</div>

				<!-- Mini Calendar Preview -->
				<div class="absolute bottom-4 right-4 left-4">
					<div class="text-xs text-muted-foreground mb-2">Ιανουάριος 2026</div>
					<div class="grid grid-cols-7 gap-1">
						{#each ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'] as day}
							<div class="text-[10px] text-muted-foreground/60 text-center">{day}</div>
						{/each}
						{#each [27, 28, 29, 30, 31, 1, 2] as day}
							<div 
								class="text-xs text-center py-1 rounded {day === 31 
									? 'bg-primary text-primary-foreground font-semibold' 
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
				<h3 class="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
					Το Πρόγραμμά μου
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed mb-4">
					Δες τις βάρδιές σου και συντονίσου με την ομάδα.
				</p>
				<div class="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
					Δες πρόγραμμα <ArrowRight class="w-4 h-4" />
				</div>
			</div>
		</a>

		<!-- Blog Card -->
		{#if blog}
			<a 
				style="animation-delay: 300ms; animation-fill-mode: backwards;"
				href="/app/blog/{blog.id}" 
				class="group relative overflow-hidden animate-fade-in rounded-2xl bg-card border border-border/50 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
			>
				<!-- Image -->
				<div class="relative h-40 overflow-hidden">
					<div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10"></div>
					<img 
						src={getFirstImage(blog.images)}
						alt={blog.title}
						class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
					<!-- Date Badge -->
					<div class="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs text-muted-foreground border border-border/50">
						{formatDate(blog.created_at)}
					</div>
				</div>
				
				<!-- Content -->
				<div class="p-5">
					<h3 class="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
						{blog.title}
					</h3>
					<p class="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
						{truncateText(blog.content, 100)}
					</p>
					<div class="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
						Διάβασε περισσότερα <ArrowRight class="w-4 h-4" />
					</div>
				</div>
			</a>
		{:else}
			<div class="flex items-center justify-center rounded-2xl bg-card border border-border/50">
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon"><Search class="text-primary" /></Empty.Media>
						<Empty.Title class="text-foreground">Δεν υπάρχουν νέα</Empty.Title>
						<Empty.Description class="text-muted-foreground">Μείνετε συντονισμένοι.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			</div>
		{/if}
	</div>

	<!-- Footer Branding -->
	<div class="text-center pt-2">
		<p class="text-xs text-muted-foreground/50">
			ⓒ TAILORMADE · CRAFTING EXCEPTIONAL COFFEE EXPERIENCES
		</p>
	</div>
</div>

<!-- Terms Dialog - Keep as is -->
<Dialog.Root open={tosFlag}>
	<Dialog.Content class="max-w-[500px] overflow-hidden p-0 border-border/50">
		<Dialog.Header class="bg-muted px-6 py-4 border-b border-border/50">
			<Dialog.Title class="text-xl text-foreground">Όροι και Προϋποθέσεις</Dialog.Title>
		</Dialog.Header>

		<div class="max-h-[400px] space-y-4 overflow-y-auto p-6 bg-card">
			<div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
				<div class="flex gap-2">
					<span class="font-bold text-primary">1.</span>
					<p>Η εφαρμογή προορίζεται αποκλειστικά για εργαζομένους του καταστήματος.</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">2.</span>
					<p>
						Τα προσωπικά δεδομένα (όνομα, βάρδιες κ.λπ.) χρησιμοποιούνται μόνο για εσωτερική
						οργάνωση και δεν κοινοποιούνται εκτός εταιρείας.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">3.</span>
					<p>
						Απαγορεύεται αυστηρά η κοινοποίηση πληροφοριών της εφαρμογής σε τρίτους χωρίς έγκριση
						της διοίκησης.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">4.</span>
					<p>
						Η χρήση συνεπάγεται την τήρηση εμπιστευτικότητας εσωτερικού περιεχομένου (εκπαιδευτικά
						άρθρα, προγράμματα).
					</p>
				</div>
				<div class="flex gap-2">
					<span class="font-bold text-primary">5.</span>
					<p>
						Με την είσοδό σας αποδέχεστε την αποθήκευση βασικών στοιχείων για σκοπούς διαχείρισης
						και βελτίωσης.
					</p>
				</div>
			</div>

			<div class="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/30">
				<Checkbox id="terms" bind:checked={termsAccepted} class="border-primary data-[state=checked]:bg-primary" />
				<div class="grid gap-1.5 leading-none">
					<Label for="terms" class="text-sm font-semibold text-foreground">Αποδοχή όρων και προϋποθέσεων</Label>
					<p class="text-xs text-muted-foreground italic">
						Επιλέγοντας αυτό το πλαίσιο, δηλώνετε ότι συμφωνείτε με τους παραπάνω όρους.
					</p>
				</div>
			</div>
		</div>

		<Dialog.Footer class="flex items-center justify-between bg-muted/30 border-t border-border/50 px-6 py-4 sm:justify-between">
			<a href="/app/legal" class="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">Αναλυτικοί Όροι</a>

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
				<Button type="submit" disabled={!termsAccepted || loading} class="min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground">
					{#if loading}
						<Spinner class="mr-2 h-4 w-4" />
						Φόρτωση...
					{:else}
						Αποδοχή
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>