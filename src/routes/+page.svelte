<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { CardBodyImg, CardImg1 } from '$lib/components/custom/cardBodyImgs/index.js';
	
	let { data } = $props();

	// State for the image carousel
	const images: string[] = $state([
		'/TAILOR MADE PRESENTATION 2024_page-0002.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0003.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0004.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0005.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0006.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0007.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0008.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0009.jpg',
		'/TAILOR MADE PRESENTATION 2024_page-0010.jpg'
	]);
	let currentImageIndex: number = $state(0);

	onMount(() => {
		const interval = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % images.length;
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="grid auto-rows-min gap-4 md:grid-cols-3">

		<div class="aspect-video rounded-2xl bg-muted/50">
			<CardImg1>
				<CardBodyImg class="absolute pb-0.5 px-4 md:pb-10 inset-x-0 bottom-2 flex flex-col justify-end size-full"/>
			</CardImg1>
		</div>

		<div class="aspect-video rounded-2xl bg-muted/50">
		</div>

		<div class="relative aspect-video row-span-2 overflow-hidden rounded-2xl">
			{#each images as image, index}
				{#if index === currentImageIndex}
					<div transition:fade={{ duration: 1500 }} class="absolute inset-0 h-full w-full">
						<img src={image} alt="Tailor Made Cafe Scenery" class="h-full w-full object-cover" />
					</div>
				{/if}
			{/each}
			<div class="relative flex h-full flex-col justify-end p-6 text-white">
				<p class="text-shadow-sm">Φοτωγραφίες του καταστημάτος μας</p>
			</div>
		</div>

		<!-- New grid item for the main content -->
		<div class="relative col-span-full overflow-hidden rounded-xl bg-muted/50">
			<div class="relative z-20 flex min-h-[40vh] sm:min-h-[50vh] flex-col items-center justify-center text-black p-4 sm:p-6 lg:p-8">
				<div class="mx-auto max-w-4xl px-2 sm:px-4 text-center">
					<div class="text-shadow">
						<h1 class="font-display mb-4 sm:mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wider sm:tracking-widest">
							TAILOR MADE COFFEE ROASTERS
						</h1>
						<p class="font-display mb-6 sm:mb-8 lg:mb-12 text-lg sm:text-xl md:text-2xl font-light tracking-wide sm:tracking-wider">
							SEE THE WORLD THROUGH COFFEE
						</p>
					</div>
					<div class="mx-auto max-w-xs sm:max-w-lg lg:max-w-2xl text-shadow-sm">
						<p class="text-sm sm:text-base md:text-lg lg:text-xl font-light leading-relaxed">
							Καλώς ήρθατε στο back office του Tailor Made. Η πλατφόρμα αυτή είναι για αποκλειστική  
							χρήση από τους υπαλλήλους και τους υπεύθυνους των καταστημάτων. Παρακαλούμε, να είστε
							προσεκτικοί και να μην μοιράζεστε με τρίτους τις πληροφορίες και οποιαδήποτε ευαίσθητα
							δεδομένα που αφορούν το κατάστημά σας.
						</p>
					</div>
				</div>
			</div>
			<div class="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-1/2 z-20 w-full -translate-x-1/2 transform text-center text-black text-shadow-sm px-4">
				<p class="text-xs sm:text-sm lg:text-base font-light tracking-wide sm:tracking-widest">ⓒTAILORMADE</p>
				<p class="text-xs sm:text-sm lg:text-base font-light tracking-wide sm:tracking-widest">CRAFTING EXCEPTIONAL COFFEE EXPERIENCES</p>
			</div>
		</div>

	</div>
</div>