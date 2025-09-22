<script lang="ts">
	import { onMount } from 'svelte';
	import { CardBodyImg, CardImg1 } from '$lib/components/custom/cardBodyImgs/index.js';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	

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

	let value: DateValue[] | undefined = $state([today(getLocalTimeZone())]);
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="grid auto-rows-min gap-4 md:grid-cols-3">
		<div class="relative col-span-full overflow-hidden rounded-2xl">
			<div
				class="relative z-20 flex flex-col items-center justify-center p-4 py-16 text-black sm:p-6 sm:py-20 lg:py-28"
			>
				<div class="mx-auto max-w-4xl text-center">
					<h1
						class="font-display mb-4 text-3xl font-light tracking-wider text-balance sm:mb-6 sm:text-4xl lg:mb-8 lg:text-5xl"
					>
						TAILOR MADE COFFEE ROASTERS
					</h1>
					<p
						class="font-display mb-8 text-xl font-light tracking-wide sm:mb-10 sm:text-2xl lg:mb-12"
					>
						SEE THE WORLD THROUGH COFFEE
					</p>

					<div class="mx-auto max-w-3xl">
						<p class="text-sm leading-relaxed font-light text-pretty sm:text-base md:text-lg">
							Καλώς ήρθατε στο back office του Tailor Made. Η πλατφόρma αυτή είναι για αποκλειστική
							χρήση από τους υπαλλήλους και τους υπεύθυνους των καταστημάτων. Παρακαλούμε, να είστε
							προσεκτικοί και να μην μοιράζεστε με τρίτους τις πληροφορίες και οποιαδήποτε ευαίσθητα
							δεδομένα που αφορούν το κατάστημά σας.
						</p>
					</div>
				</div>
			</div>

			<div
				class="absolute bottom-4 left-1/2 z-20 w-full -translate-x-1/2 transform px-4 text-center text-black sm:bottom-6 lg:bottom-8"
			>
				<p class="text-xs font-light tracking-wide sm:text-sm lg:text-base">ⓒ TAILORMADE</p>
				<p class="text-xs font-light tracking-wide sm:text-sm lg:text-base">
					CRAFTING EXCEPTIONAL COFFEE EXPERIENCES
				</p>
			</div>
		</div>

		<div class="aspect-video rounded-2xl bg-muted/50">
			<CardImg1>
				<CardBodyImg
					class="absolute inset-x-0 bottom-2 flex size-full flex-col justify-end px-4 pb-0.5 md:pb-10"
				/>
			</CardImg1>
		</div>

		<div
			class="group relative flex aspect-video flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-t from-slate-500 to-orange-50"
		>
			<Calendar
				type="multiple"
				bind:value
				class="absolute right-0 top-4 origin-top rounded-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
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
		</div>

		<div class="aspect-video rounded-2xl bg-muted/50"></div>
	</div>
</div>
