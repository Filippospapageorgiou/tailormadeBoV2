<script lang="ts">
	import BlurIn from '../blurIn/BlurIn.svelte';
</script>

<div
	class="relative col-span-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
>
	<div class="absolute inset-0 overflow-hidden">
		<div class="grid-pattern"></div>
	</div>

	<div
		class="relative z-20 flex flex-col items-center justify-center p-4 py-16 text-black transition-transform duration-200 ease-out sm:p-6 sm:py-20 lg:py-28"
	>
		<div class="mx-auto max-w-4xl text-center">
			<BlurIn
				word="TAILOR MADE COFFEE ROASTERS"
				class="scroll-m-20 text-4xl font-extrabold tracking-tight text-primary lg:text-5xl"
			/>
			<div
				class="font-display mt-5 mb-8 overflow-hidden text-xl font-light tracking-wide sm:mb-10 sm:text-2xl lg:mb-12"
			>
				<p>SEE THE WORLD THROUGH COFFEE</p>
			</div>

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
		class="absolute bottom-7 left-1/2 z-20 w-full -translate-x-1/2 translate-y-5 transform px-4 text-center text-black sm:bottom-6 lg:bottom-8"
	>
		<p class="text-xs font-light tracking-wide sm:text-sm lg:text-base">ⓒ TAILORMADE</p>
		<p class="text-xs font-light tracking-wide sm:text-sm lg:text-base">
			CRAFTING EXCEPTIONAL COFFEE EXPERIENCES
		</p>
	</div>
</div>

<style>
	/* Grid Pattern */
	.grid-pattern {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image:
			linear-gradient(rgba(139, 69, 19, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(139, 69, 19, 0.03) 1px, transparent 1px);
		background-size: 50px 50px;
		animation: grid-move 20s linear infinite;
	}
</style>
