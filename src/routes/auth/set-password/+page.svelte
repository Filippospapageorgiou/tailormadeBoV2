<script lang="ts">
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from '$lib/stores/toast.svelte';
	import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-svelte';
	import { setPassword } from './data.remote';
	import { Spinner } from '$lib/components/ui/spinner';

	let { data } = $props();

	let password: string = $state('');
	let confirmPassword: string = $state('');
	let loading: boolean = $state(false);
	let showPassword: boolean = $state(false);
	let showConfirmPassword: boolean = $state(false);
	let errors = $state<{ password?: string; confirmPassword?: string }>({});

	// Password strength indicator
	let passwordStrength = $derived.by(() => {
		if (!password) return { level: 0, text: '', color: '' };

		let strength = 0;
		if (password.length >= 8) strength++;
		if (/[A-Z]/.test(password)) strength++;
		if (/[a-z]/.test(password)) strength++;
		if (/[0-9]/.test(password)) strength++;
		if (/[^A-Za-z0-9]/.test(password)) strength++;

		if (strength <= 2) return { level: strength, text: 'Weak', color: 'text-red-500' };
		if (strength === 4) return { level: strength, text: 'Good', color: 'text-green-700' };
		return { level: strength, text: 'Strong', color: 'text-green-600' };
	});

	function handleError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Error';
		toast.text = text;
	}
</script>

{#if data.needsAuth}
	<div class="min-h-svh bg-muted/30 flex items-center justify-center p-4">
		<Card.Root class="max-w-md">
			<Card.Header class="text-center">
				<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
					<ShieldCheck class="size-6 text-destructive" />
				</div>
				<Card.Title>Invalid Access</Card.Title>
				<Card.Description>
					Please use the invitation link sent to your email to access this page.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/auth/login" class="w-full">Go to Login</Button>
			</Card.Content>
		</Card.Root>
	</div>
{:else}
<div class="min-h-svh bg-muted/30 flex items-center justify-center p-4 text-bro">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="flex justify-center mb-8">
			<div class="flex items-center gap-2 font-medium text-lg">
				<div
					class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					<GalleryVerticalEndIcon class="size-5" />
				</div>
				TailorMade.
			</div>
		</div>
		<!-- Card -->
		<Card.Root>
			<Card.Header class="text-center">
				<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
					<ShieldCheck class="size-6 text-primary" />
				</div>
				<Card.Title class="text-2xl">Set Your Password</Card.Title>
				<Card.Description>
					Welcome to the team! Create a secure password to complete your account setup.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form {...setPassword.enhance(async ({ form, submit}) =>{
					loading = true;
					await submit();

					if(setPassword.result?.success === false){
						handleError(setPassword.result?.message || 'An unexpected error occurred.');
					}
					loading = false;
					form.reset();
				})}>
					<div class="grid gap-6">
						<!-- Password Field -->
						<div class="grid gap-3">
							<Label for="password">Password</Label>
							<div class="relative">
								<Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									id="password"
									{...setPassword.fields.password.as('password')}
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									bind:value={password}
									class="pl-10 pr-10"
									required
									disabled={loading}
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									disabled={loading}
								>
									{#if showPassword}
										<EyeOff class="size-4" />
									{:else}
										<Eye class="size-4" />
									{/if}
								</button>
							</div>

							<!-- Password Strength Indicator -->
							{#if password}
								<div class="space-y-2">
									<p class="text-xs">
										Password strength: <span class="font-medium {passwordStrength.color}">{passwordStrength.text}</span>
									</p>
								</div>
							{/if}

							{#if errors.password}
								<p class="text-xs text-destructive">{errors.password}</p>
							{/if}
						</div>

						<!-- Confirm Password Field -->
						<div class="grid gap-3">
							<Label for="confirmPassword">Confirm Password</Label>
							<div class="relative">
								<Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									id="confirmPassword"
									{...setPassword.fields.confirmPassword.as('password')}
									type={showConfirmPassword ? 'text' : 'password'}
									placeholder="Confirm your password"
									bind:value={confirmPassword}
									class="pl-10 pr-10"
									required
									disabled={loading}
								/>
								<button
									type="button"
									onclick={() => (showConfirmPassword = !showConfirmPassword)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									disabled={loading}
								>
									{#if showConfirmPassword}
										<EyeOff class="size-4" />
									{:else}
										<Eye class="size-4" />
									{/if}
								</button>
							</div>
							{#if errors.confirmPassword}
								<p class="text-xs text-destructive">{errors.confirmPassword}</p>
							{/if}
						</div>

						<!-- Password Requirements -->
						<div class="rounded-lg bg-muted p-4">
							<p class="text-sm font-medium mb-2">Password must contain:</p>
							<ul class="space-y-1.5 text-xs text-muted-foreground">
								<li class="flex items-center gap-2">
									<span class="size-1.5 rounded-full {password.length >= 8 ? 'bg-green-500' : 'bg-muted-foreground/30'}"></span>
									At least 8 characters
								</li>
								<li class="flex items-center gap-2">
									<span class="size-1.5 rounded-full {/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-muted-foreground/30'}"></span>
									One uppercase letter
								</li>
								<li class="flex items-center gap-2">
									<span class="size-1.5 rounded-full {/[a-z]/.test(password) ? 'bg-green-500' : 'bg-muted-foreground/30'}"></span>
									One lowercase letter
								</li>
								<li class="flex items-center gap-2">
									<span class="size-1.5 rounded-full {/[0-9]/.test(password) ? 'bg-green-500' : 'bg-muted-foreground/30'}"></span>
									One number
								</li>
							</ul>
						</div>

						<Button
							type="submit"
							class="w-full cursor-pointer"
							disabled={loading}
						>
							{#if loading}
								<Spinner />
								Setting password...
							{:else}
								Complete Setup
							{/if}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Footer -->
		<div class="mt-4 text-center text-xs text-muted-foreground">
			Having trouble? Contact your administrator for assistance.
		</div>
	</div>
</div>
{/if}