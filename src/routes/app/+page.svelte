<script lang="ts">
	import { CardBodyImg, CardImg1 } from '$lib/components/custom/cardBodyImgs/index.js';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import type { Blog } from '$lib/models/database.types';
	import Hero from '$lib/components/custom/hero/hero.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Search } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let { data, form } = $props();
	let blog = $derived(data.blog as Blog);
	let tosFlag: any = $derived(data?.tos);

	function getFirstImage(images: any) {
		if (images && Array.isArray(images) && images.length > 0) {
			const firstImage = images[0];
			if (typeof firstImage === 'string') return firstImage;
			if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
		}
	}

	function truncateText(text: string | null | undefined, maxLength: number = 120) {
		if (!text || typeof text !== 'string') return '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	// Helper function to format date
	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('el-GR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			return '';
		}
	}

	let value: DateValue[] | undefined = $state([today(getLocalTimeZone())]);

	let loading = $state(false);
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-2">
	<div class="grid auto-rows-min gap-4 pt-0 md:grid-cols-3 md:pt-9">
		<Hero />

		<a href="/app/recipes/" class="aspect-video rounded-2xl bg-muted/50">
			<CardImg1>
				<CardBodyImg
					class="absolute inset-x-0 bottom-2 flex size-full flex-col justify-end px-4 pb-0.5 md:pb-10"
				/>
			</CardImg1>
		</a>
		<a
			href="/app/schedule/"
			class="group relative flex aspect-video cursor-pointer flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-t from-slate-500 to-orange-50"
		>
			<Calendar
				type="multiple"
				bind:value
				class="absolute top-4 right-0 origin-top rounded-md [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-105"
			/>

			<div
				class="relative z-10 px-3 py-3 pt-10 text-left text-gray-100 [text-shadow:0_2px_4px_rgb(0_0_0_/_0.5)] sm:px-4 sm:py-4 lg:px-6 lg:py-6"
			>
				<h3 class="mb-3 text-lg font-bold tracking-tighter sm:mb-1 sm:text-xl lg:text-2xl">
					Το Πρόγραμμά μου
				</h3>

				<div class="flex flex-col gap-1 sm:flex-col sm:items-start sm:justify-between sm:gap-0">
					<p
						class="max-w-none flex-1 text-sm leading-relaxed sm:max-w-md sm:text-base sm:leading-6 lg:max-w-lg lg:text-lg lg:leading-7"
					>
						Δες τις βάρδιές σου για αυτή την εβδομάδα
					</p>
					<p
						class="max-w-none flex-1 text-sm leading-relaxed sm:max-w-md sm:text-base sm:leading-6 lg:max-w-lg lg:text-lg lg:leading-7"
					>
						Ενήμερωσου για άδειες και συντονίσου με τον υπεύθυνο καταστήματος
					</p>
				</div>
			</div>
		</a>

		{#if blog}
			<a href="/app/blog/{blog.id}" class="group relative aspect-video overflow-hidden rounded-2xl">
				<div class="absolute inset-0">
					<img
						src={getFirstImage(blog.images)}
						alt={blog.title || 'Blog post'}
						class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"
					></div>
				</div>

				<div class="relative z-10 flex h-full flex-col justify-end p-4 text-white">
					{#if blog.profile && blog.profile.username}
						<div
							class="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm"
						>
							<img
								src={blog.profile.image_url}
								alt={blog.profile.username}
								class="h-5 w-5 rounded-full object-cover"
							/>
							<span class="text-xs font-medium text-white">{blog.profile.username}</span>
						</div>
					{/if}

					<!-- Date -->
					<div class="mb-2">
						<span class="text-xs font-light tracking-wide text-gray-300">
							{formatDate(blog.created_at)}
						</span>
					</div>

					<!-- Title -->
					<h3
						class="mb-2 line-clamp-2 text-lg leading-tight font-bold tracking-tight text-white sm:text-xl lg:text-2xl"
					>
						{blog.title}
					</h3>

					<!-- Description -->
					{#if blog.content}
						<p class="line-clamp-2 text-sm leading-relaxed text-gray-200 opacity-90 sm:text-base">
							{truncateText(blog.content)}
						</p>
					{/if}

					<!-- Tags -->
					{#if blog.tags && blog.tags.length > 0}
						<div class="mt-3 flex flex-wrap gap-1">
							{#each blog.tags.slice(0, 3) as tag}
								<span
									class="rounded-full bg-white/20 px-2 py-1 text-xs text-white backdrop-blur-sm"
								>
									#{tag}
								</span>
							{/each}
						</div>
					{/if}

					<div
						class="absolute right-4 bottom-4 opacity-0 transition-all duration-300 group-hover:opacity-100"
					>
						<div class="rounded-full bg-white/20 p-2 backdrop-blur-sm">
							<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
						</div>
					</div>
				</div>
			</a>
		{:else}
			<Empty.Root class="h-full bg-gradient-to-b from-muted/50 from-30% to-background">
				<Empty.Header>
					<Empty.Media variant="icon">
						<Search />
					</Empty.Media>
					<Empty.Title>No Blog available</Empty.Title>
					<Empty.Description>No blog available for readind wait for news...</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{/if}
	</div>
</div>

{#if !tosFlag}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
		<div class="relative w-[90%] max-w-md rounded-2xl bg-white p-6 text-gray-800 shadow-2xl">
			<h2 class="mb-3 text-center text-lg font-bold text-primary">Όροι Χρήσης Εφαρμογής</h2>

			<div
				class="max-h-[300px] space-y-2 overflow-y-auto text-sm leading-relaxed text-muted-foreground"
			>
				<p>Η εφαρμογή προορίζεται αποκλειστικά για εργαζομένους του καταστήματος.</p>
				<p>
					Τα προσωπικά δεδομένα (όνομα, πρόγραμμα εργασίας, αιτήματα βάρδιας κ.λπ.) χρησιμοποιούνται
					μόνο για εσωτερική οργάνωση και δεν κοινοποιούνται εκτός εταιρείας.
				</p>
				<p>
					Απαγορεύεται αυστηρά η κοινοποίηση πληροφοριών ή δεδομένων της εφαρμογής σε τρίτους ή
					εξωτερικούς συνεργάτες χωρίς έγκριση της διοίκησης.
				</p>
				<p>
					Η χρήση της εφαρμογής συνεπάγεται την τήρηση εμπιστευτικότητας και την αποφυγή
					διαμοιρασμού εσωτερικού περιεχομένου (εκπαιδευτικά άρθρα, προγράμματα, πληροφορίες
					καταστήματος) με τρίτους.
				</p>
				<p>
					Με την είσοδό σας αποδέχεστε την αποθήκευση βασικών στοιχείων για σκοπούς διαχείρισης
					λογαριασμού και βελτίωσης της εφαρμογής.
				</p>
			</div>

			<form
				method="POST"
				action="?/acceptTerms"
				use:enhance={({}) => {
					loading = true;
				}}
				class="mt-6 flex justify-center"
			>
				<input class="hidden" name="accept" id="accept" value="accept" />
				<button
					type="submit"
					disabled={loading}
					class="relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-10 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-lg disabled:hover:scale-100"
				>
					{#if loading}
						<Spinner />
						<span>Laoding...</span>
					{:else}
						<span>Accept</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}
