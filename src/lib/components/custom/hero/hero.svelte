<script lang="ts">
	
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
			<h1
				class="font-display mb-4 text-3xl font-light tracking-wider text-balance sm:mb-6 sm:text-4xl lg:mb-8 lg:text-5xl"
			>
				TAILORMADE COFFEE ROASTERS
			</h1>

			<div
				class="font-display mt-5 mb-8 text-xl font-light tracking-wide sm:mb-10 sm:text-2xl lg:mb-12 overflow-hidden"
			>
				<p>SEE THE WORLD THROUGH COFFEE</p>
			</div>

			<div class="mx-auto max-w-3xl">
				<p
					class="text-sm leading-relaxed font-light text-pretty sm:text-base md:text-lg"
				>
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
		background-image: linear-gradient(rgba(139, 69, 19, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(139, 69, 19, 0.03) 1px, transparent 1px);
		background-size: 50px 50px;
		animation: grid-move 20s linear infinite;
	}

	/* Keyframes */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		25% {
			transform: translateY(-10px) rotate(90deg);
		}
		50% {
			transform: translateY(-5px) rotate(180deg);
		}
		75% {
			transform: translateY(-15px) rotate(270deg);
		}
	}

	@keyframes grid-move {
		0% {
			transform: translate(0, 0);
		}
		100% {
			transform: translate(50px, 50px);
		}
	}

	@keyframes pulse-glow {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 0 10px rgba(139, 69, 19, 0.3));
		}
		50% {
			transform: scale(1.1);
			filter: drop-shadow(0 0 20px rgba(139, 69, 19, 0.5));
		}
	}
</style>