<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { GalleryVerticalEndIcon, Eye, EyeOff } from 'lucide-svelte';
	import { resetPasswordForm } from './data.remote';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	let loading: boolean = $state(false);
	let password: string = $state('');
	let confirmPassword: string = $state('');
	let showPassword: boolean = $state(false);
	let showConfirmPassword: boolean = $state(false);
	let passwordStrength: 'weak' | 'medium' | 'strong' = $state('weak');

	// Get email from URL query params
	let email: string = $state('');

	$effect(() => {
		email = page.url.searchParams.get('email') || '';
	});

	// Calculate password strength
	$effect(() => {
		const strength = calculatePasswordStrength(password);
		passwordStrength = strength;
	});

	// Derived state for form validation
	const isPasswordsMatch = $derived(password === confirmPassword && password.length > 0);
	const isFormValid = $derived(
		isPasswordsMatch && passwordStrength !== 'weak' && password.length >= 8
	);

	function calculatePasswordStrength(pwd: string): 'weak' | 'medium' | 'strong' {
		if (!pwd) return 'weak';

		let strength = 0;

		// Check length
		if (pwd.length >= 8) strength++;
		if (pwd.length >= 12) strength++;

		// Check for uppercase
		if (/[A-Z]/.test(pwd)) strength++;

		// Check for lowercase
		if (/[a-z]/.test(pwd)) strength++;

		// Check for numbers
		if (/\d/.test(pwd)) strength++;

		// Check for special characters
		if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++;

		if (strength <= 2) return 'weak';
		if (strength <= 4) return 'medium';
		return 'strong';
	}

	function getStrengthColor(strength: string): string {
		switch (strength) {
			case 'weak':
				return 'bg-red-500';
			case 'medium':
				return 'bg-yellow-500';
			case 'strong':
				return 'bg-green-500';
			default:
				return 'bg-gray-300';
		}
	}

	function getStrengthLabel(strength: string): string {
		switch (strength) {
			case 'weak':
				return 'Weak';
			case 'medium':
				return 'Medium';
			case 'strong':
				return 'Strong';
			default:
				return '';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="mx-4 w-full max-w-md px-4">
		<div class="flex items-center gap-2 py-4 font-medium">
			<div
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<GalleryVerticalEndIcon class="size-4" />
			</div>
			TailorMade.
		</div>

		<div transition:fly={{ x: 200, duration: 300 }}>
			<Field.Group>
				<form
					class="space-y-4"
					{...resetPasswordForm.enhance(async ({ form, data, submit }) => {
						try {
							loading = true;
							await submit();
							form.reset();
							if (resetPasswordForm.result?.success) {
								showSuccessToast('Success', resetPasswordForm?.result?.message || '');
								// Redirect to login
								await goto('/auth/login');
							} else {
								showFailToast('Error', resetPasswordForm?.result?.message || '');
							}
							loading = false;
						} catch (error) {
							showFailToast('Error', 'An error occurred while resetting password');
							loading = false;
						}
					})}
				>
					<Field.Set>
						<Field.Legend>Reset Password</Field.Legend>
						<Field.Description>Create a new password for your account</Field.Description>

						<Field.Group>
							<Field.Field>
								<Field.Label for="email">Email</Field.Label>
								<Input
									name="email"
									id="email"
									type="email"
									placeholder="example@gmail.com"
									value={email}
									readonly
									class="bg-muted"
								/>
							</Field.Field>
						</Field.Group>

						<Field.Group>
							<Field.Field>
								<Field.Label for="password">New Password</Field.Label>
								<div class="relative">
									<Input
										name="password"
										id="password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Enter new password"
										required
										bind:value={password}
									/>
									<button
										type="button"
										onclick={() => (showPassword = !showPassword)}
										class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{#if showPassword}
											<EyeOff class="size-4" />
										{:else}
											<Eye class="size-4" />
										{/if}
									</button>
								</div>

								{#if password}
									<div class="mt-2 space-y-2">
										<div class="flex items-center gap-2">
											<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
												<div
													class={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
													style={`width: ${passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'}`}
												></div>
											</div>
											<span class="text-xs text-muted-foreground">
												{getStrengthLabel(passwordStrength)}
											</span>
										</div>
										<p class="text-xs text-muted-foreground">
											Password must be at least 8 characters with uppercase, lowercase, numbers and
											symbols
										</p>
									</div>
								{/if}
							</Field.Field>
						</Field.Group>

						<Field.Group>
							<Field.Field>
								<Field.Label for="confirmPassword">Confirm Password</Field.Label>
								<div class="relative">
									<Input
										name="confirmPassword"
										id="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder="Confirm password"
										required
										bind:value={confirmPassword}
									/>
									<button
										type="button"
										onclick={() => (showConfirmPassword = !showConfirmPassword)}
										class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{#if showConfirmPassword}
											<EyeOff class="size-4" />
										{:else}
											<Eye class="size-4" />
										{/if}
									</button>
								</div>

								{#if confirmPassword && !isPasswordsMatch}
									<p class="mt-2 text-xs text-red-500">Passwords do not match</p>
								{:else if confirmPassword && isPasswordsMatch}
									<p class="mt-2 text-xs text-green-500">Passwords match</p>
								{/if}
							</Field.Field>
						</Field.Group>
					</Field.Set>

					<Field.Separator />

					<Field.Field class="py-4" orientation="horizontal">
						{#if loading}
							<Button type="submit" disabled={loading} class="w-full">
								<Spinner />
								Resetting...
							</Button>
						{:else}
							<Button type="submit" class="w-full">Reset Password</Button>
						{/if}
					</Field.Field>
				</form>
			</Field.Group>
		</div>
	</div>
</div>
