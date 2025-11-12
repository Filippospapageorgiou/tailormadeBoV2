<script lang="ts">
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from '$lib/stores/toast.svelte';
	import { enhance } from '$app/forms';

	let { form } = $props();
	$effect(() => {
		if (form?.error) {
			toast.show = true;
			toast.status = false;
			toast.title = 'Error';
			toast.text = form?.error ?? '';
		}
	});

	let loading: boolean = $state(false);
</script>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<div class="flex items-center gap-2 font-medium">
				<div
					class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					<GalleryVerticalEndIcon class="size-4" />
				</div>
				TailorMade.
			</div>
		</div>
		<div class="flex flex-1 items-center justify-center py-4">
			<div class="py-4 md:w-7/12">
				<Card.Root>
					<Card.Header class="text-center">
						<Card.Title class="text-xl">Welcome</Card.Title>
						<Card.Description
							>We are very happy for you becoming mebmer of our team login and begin your journey.</Card.Description
						>
					</Card.Header>
					<Card.Content>
						<form
							action="?/loginWithEmail"
							method="POST"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update();
								};
							}}
						>
							<div class="grid gap-6">
								<div class="grid gap-6">
									<div class="grid gap-3">
										<Label for="email">Email</Label>
										<Input
											id="email"
											name="email"
											type="email"
											placeholder="m@example.com"
											required
										/>
									</div>
									<div class="grid gap-3">
										<div class="flex items-center">
											<Label for="password">Password</Label>
											<a
												href="##"
												class="ml-auto text-sm text-primary underline-offset-4 hover:underline"
											>
												Forgot your password?
											</a>
										</div>
										<Input
											id="password"
											placeholder="********"
											name="password"
											type="password"
											required
										/>
									</div>
									<Button
										type="submit"
										class="btn-coffee h-10 w-full cursor-pointer font-medium"
										disabled={loading}
									>
										{#if loading}
											<div
												class="mr-2 h-4 w-4 animate-spin-clockwise rounded-full border-2 border-primary-foreground border-t-transparent"
											></div>
											login in....
										{:else}
											Login
										{/if}
									</Button>
								</div>
							</div>
						</form>
					</Card.Content>
				</Card.Root>
				<div class="space-y-2 py-6 text-center text-xs text-muted-foreground">
					<p class="text-sm font-medium text-primary">Key Points</p>
					<ul class="list-inside list-disc text-xs text-balance text-muted-foreground">
						<li>Your account is used for work-related purposes only.</li>
						<li>We collect basic data such as your name, schedule, and training progress.</li>
						<li>Your data is stored securely and not shared outside the company.</li>
						<li>Do not share internal app content with non-employees.</li>
					</ul>

					<div class="flex justify-center text-center text-xs text-balance text-muted-foreground">
						By clicking continue, you agree to our
						<span class="cursor-alias px-1 underline underline-offset-4 hover:text-primary">
							Terms of Service
						</span>
						and
						<span class="cursor-alias px-1 underline underline-offset-4 hover:text-primary">
							Privacy Policy
						</span>.
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="relative hidden items-center justify-center bg-white md:flex md:w-2/2">
		<div class="max-h-96 max-w-96">
			<img src="/auth.jpg" alt="Tailor Made Coffee Roasters" class="h-full w-full object-contain" />
		</div>
	</div>
</div>
