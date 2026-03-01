<script lang="ts">
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from '$lib/stores/toast.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { updateGlobalProfile } from '$lib/stores/profile.svelte.js';

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
				TAILORMADE - VENETIS ENTEPRISE.
			</div>
		</div>
		<div class="relative flex flex-1 items-center justify-center overflow-hidden py-4">
			<div class="py-4 md:w-7/12">
				<Card.Root
					class="rounded-2xl border border-border/50 bg-background/70 shadow-xl backdrop-blur-xl dark:bg-background/50 dark:shadow-2xl"
				>
					<!-- Animated gradient background blobs -->
					<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
						<div
							class="absolute -top-24 -left-24 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
							style="animation-duration: 6s;"
						></div>
						<div
							class="absolute -right-24 -bottom-24 h-96 w-96 animate-pulse rounded-full bg-primary/15 blur-3xl dark:bg-primary/8"
							style="animation-duration: 8s;"
						></div>
					</div>
					<Card.Header class="text-center">
						<Card.Title class="text-2xl font-semibold tracking-tight">Καλώς Ήρθατε</Card.Title>
						<Card.Description class="text-muted-foreground/80">
							Είμαστε πολύ χαρούμενοι που γίνατε μέλος της ομάδας μας. Συνδεθείτε και ξεκινήστε το
							ταξίδι σας.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							action="?/loginWithEmail"
							method="POST"
							use:enhance={() => {
								loading = true;
								return async ({ result, update }) => {
									if (result.type === 'success' && result.data) {
										const data = result.data as {
											success?: boolean;
											profile?: any;
											redirectTo?: string;
										};
										if (data.success && data.profile) {
											updateGlobalProfile(data.profile);
											await goto(data.redirectTo || '/app/');
											return;
										}
										loading = false;
									}
									loading = false;
									await update();
								};
							}}
						>
							<div class="grid gap-6">
								<div class="grid gap-5">
									<div class="grid gap-2">
										<Label for="email" class="text-sm font-medium">Email</Label>
										<Input
											disabled={loading}
											id="email"
											name="email"
											type="email"
											placeholder="m@example.com"
											class="h-11 rounded-lg border-border/60 bg-muted/40 transition-colors focus:bg-background"
											required
										/>
									</div>
									<div class="grid gap-2">
										<div class="flex items-center">
											<Label for="password" class="text-sm font-medium">Password</Label>

											<a
												href="/auth/forgot_password/"
												class="ml-auto text-xs text-muted-foreground transition-colors hover:text-primary"
											>
												Ξεχάσατε τον κωδικό σας;
											</a>
										</div>
										<Input
											disabled={loading}
											id="password"
											placeholder="********"
											name="password"
											type="password"
											class="h-11 rounded-lg border-border/60 bg-muted/40 transition-colors focus:bg-background"
											required
										/>
									</div>
									<Button
										type="submit"
										class="btn-coffee h-11 w-full cursor-pointer rounded-lg font-medium transition-all hover:shadow-md"
										disabled={loading}
									>
										{#if loading}
											<div
												class="mr-2 h-4 w-4 animate-spin-clockwise rounded-full border-2 border-primary-foreground border-t-transparent repeat-infinite"
											></div>
											logging in....
										{:else}
											Login
										{/if}
									</Button>
								</div>
							</div>
						</form>
					</Card.Content>
				</Card.Root>
				<div class="py-5 text-center text-xs text-muted-foreground/70">
					<div class="flex flex-wrap justify-center text-balance">
						By clicking continue, you agree to our
						<span
							class="cursor-alias px-1 underline underline-offset-4 transition-colors hover:text-primary"
						>
							Terms of Service
						</span>
						and
						<span
							class="cursor-alias px-1 underline underline-offset-4 transition-colors hover:text-primary"
						>
							Privacy Policy
						</span>.
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="relative hidden w-full items-center justify-center bg-white md:flex">
		<div class="max-h-96 max-w-96 bg-transparent">
			<img
				src="/tailor_venetis.png"
				alt="Tailor Made Coffee Roasters"
				class="object-fit-contain h-full w-full"
			/>
		</div>
	</div>
</div>
