<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { GalleryVerticalEndIcon } from 'lucide-svelte';
	import { resendEmail, verifyCodeForm, verifyEmailForm } from './data.remote';
	import { showFailToast, showSuccessToast } from '$lib/stores/toast.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { fly } from 'svelte/transition';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui';
	import { goto } from '$app/navigation';

	let loading: boolean = $state(false);
	let codeSubmitted: boolean = $state(false);
	let email: string = $state('');
	let timeLeft: number = $state(60);
	let canResend: boolean = $state(false);
	let otpValue: string = $state('');

	// Timer effect
	$effect(() => {
		if (!codeSubmitted || timeLeft <= 0) return;

		const timer = setInterval(() => {
			timeLeft--;
			if (timeLeft <= 0) {
				canResend = true;
			}
		}, 1000);

		return () => clearInterval(timer);
	});

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	let loadingVerify: boolean = $state(false);
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
		{#if !codeSubmitted}
			<div transition:fly={{ x: -200, duration: 300 }}>
				<Field.Group>
					<form
						class="space-y-4"
						{...verifyEmailForm.enhance(async ({ form, data, submit }) => {
							try {
								loading = true;
								await submit();
								if (verifyEmailForm.result?.success) {
									email = data.email;
									showSuccessToast('Success', verifyEmailForm?.result?.message || '');
									codeSubmitted = true;
									timeLeft = 60;
									canResend = false;
								} else {
									showFailToast('Error', verifyEmailForm?.result?.message || '');
								}
								loading = false;
							} catch (error) {
								showFailToast('Error', verifyEmailForm?.result?.message || '');
								loading = false;
							}
						})}
					>
						<Field.Set>
							<Field.Legend>Enter email</Field.Legend>
							<Field.Description
								>Enter email to send verification OTP to reset password</Field.Description
							>
							<Field.Group>
								<Field.Field>
									<Field.Label for="email">Email</Field.Label>
									<Input
										name="email"
										id="email"
										placeholder="example@gmail.com"
										required
										bind:value={email}
									/>
								</Field.Field>
							</Field.Group>
						</Field.Set>
						<Field.Separator />
						<Field.Field class="py-4" orientation="horizontal">
							{#if loading}
								<Button type="submit" disabled={loading}>
									<Spinner />
									Submiting...
								</Button>
							{:else}
								<Button type="submit">Submit</Button>
							{/if}
						</Field.Field>
					</form>
				</Field.Group>
			</div>
		{:else}
			<div transition:fly={{ x: 200, duration: 300 }}>
				<Field.Group>
					<Field.Set>
						<Field.Legend>Enter verification code</Field.Legend>
						<Field.Description>
							We've sent a 6-digit code to <span class="font-semibold">{email}</span>
						</Field.Description>

						<form
							class="space-y-4"
							{...verifyCodeForm.enhance(async ({ form, data, submit }) => {
								try {
									loadingVerify = true;
									await submit();
									if (verifyCodeForm.result?.success) {
										showSuccessToast('Success', verifyCodeForm?.result?.message || '');
										await goto(`/auth/reset-password?email=${encodeURIComponent(email)}`);
									} else {
										showFailToast('Error', verifyCodeForm?.result?.message || '');
									}
									loadingVerify = false;
								} catch (error) {
									showFailToast('Error', 'An error occurred while verifying code');
									loadingVerify = false;
								}
							})}
						>
							<div class="flex flex-col items-center justify-center py-4">
								<InputOTP.Root
									bind:value={otpValue}
									name="code"
									maxlength={6}
									pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
								>
									{#snippet children({ cells })}
										<InputOTP.Group>
											{#each cells as cell (cell)}
												<InputOTP.Slot {cell} />
											{/each}
										</InputOTP.Group>
									{/snippet}
								</InputOTP.Root>
							</div>

							<Input name="email" type="hidden" value={email} />

							<Field.Field class="py-0" orientation="horizontal">
								{#if loadingVerify}
									<Button type="submit" disabled={loadingVerify} class="w-full">
										<Spinner />
										Verifying...
									</Button>
								{:else}
									<Button
										type="submit"
										disabled={timeLeft <= 0 || otpValue.length < 6}
										class="w-full"
									>
										Verify Code
									</Button>
								{/if}
							</Field.Field>
						</form>

						<Field.Separator />
						<!-- Timer and Resend -->
						<div class="space-y-1">
							<div class="text-center text-sm">
								{#if canResend}
									<form
										{...resendEmail.enhance(async ({ form, data, submit }) => {
											try {
												loading = true;
												await submit();
												if (resendEmail.result?.success) {
													showSuccessToast('Success', resendEmail?.result?.message || '');
													timeLeft = 60;
													canResend = false;
												} else {
													showFailToast('Error', resendEmail?.result?.message || '');
												}
												loading = false;
											} catch (error) {
												showFailToast('Error', 'Error resending code');
												loading = false;
											}
										})}
									>
										<Input name="email" type="hidden" value={email} />
										<p class="text-muted-foreground">
											Didn't receive the code?
											<button
												type="submit"
												disabled={loading}
												class="cursor-pointer font-semibold text-primary hover:underline disabled:opacity-50"
											>
												{loading ? 'Sending...' : 'Resend'}
											</button>
										</p>
									</form>
								{:else}
									<p class="text-muted-foreground">
										Didn't receive the code? <span class="text-xs"
											>Resend in {formatTime(timeLeft)}</span
										>
									</p>
								{/if}
							</div>
						</div>
					</Field.Set>
				</Field.Group>
			</div>
		{/if}
	</div>
</div>
