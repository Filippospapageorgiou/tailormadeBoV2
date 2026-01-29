<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Building2, User, Lock, Mail, CheckCircle, AlertCircle, Sparkles } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Password from '$lib/components/ui/password';

	let { data, form }: PageProps = $props();

	let invitation = $derived(data.invitation);
	let userExists = $derived(data.userExists);

	let isSubmitting = $state(false);
	let username = $state('');
	let full_name = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	// Format expiration date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Check if passwords match
	let passwordsMatch = $derived(password === confirmPassword && password.length >= 6);
	let formValid = $derived(username.trim().length >= 2 && passwordsMatch);

	// Handle form result
	$effect(() => {
		if (form?.success) {
			toast.success(form.message);
			setTimeout(() => {
				goto('/auth/login');
			}, 2000);
		} else if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<svelte:head>
	<title>Accept Invitation - TailorMade</title>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"
>
	<div class="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
		<!-- Success State -->
		{#if form?.success}
			<Card.Root
				class="relative w-full max-w-lg overflow-hidden rounded-3xl border-green-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-green-800/50 dark:bg-neutral-900/90"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br from-green-100/50 to-transparent dark:from-green-900/20"
				></div>
				<div class="relative flex flex-col items-center text-center">
					<div
						class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30"
					>
						<CheckCircle class="h-10 w-10 text-white" />
					</div>
					<h1
						class="mb-3 font-[family-name:var(--font-tailormade)] text-3xl font-bold text-green-800 dark:text-green-200"
					>
						Welcome Aboard! 🎉
					</h1>
					<p class="mb-6 text-lg text-green-700 dark:text-green-300">
						Your account has been created successfully.
					</p>
					<p class="text-sm text-muted-foreground">Redirecting you to login...</p>
					<Spinner class="mt-4 h-6 w-6" />
				</div>
			</Card.Root>
		{:else}
			<!-- Main Invitation Card -->
			<Card.Root
				class="w-full max-w-md overflow-hidden rounded-2xl bg-white/95 shadow-xl shadow-stone-900/10 backdrop-blur-sm sm:max-w-lg md:max-w-4xl md:rounded-3xl md:shadow-2xl dark:bg-stone-900/95 dark:shadow-black/30"
			>
				<div class="grid md:grid-cols-5">
					<!-- Left Column - Branding (hidden on mobile, shown on md+) -->
					<div
						class="relative hidden items-center justify-center bg-transparent p-6 md:col-span-2 md:flex lg:p-8"
					>
						<div class="absolute inset-0 opacity-10">
							<div
								class="absolute -top-10 -left-10 h-40 w-40 rounded-full border-4 border-stone-400/30"
							></div>
							<div
								class="absolute -right-10 -bottom-10 h-60 w-60 rounded-full border-4 border-stone-400/20"
							></div>
						</div>
						<div class="relative">
							<img
								src="/tailor_venetis.png"
								alt="Tailor Made Coffee Roasters"
								class="h-full w-full rounded-2xl object-contain"
							/>
						</div>
					</div>

					<!-- Right Column - Form Content -->
					<div class="flex flex-col p-5 sm:p-6 md:col-span-3 lg:p-8">
						<!-- Mobile Logo (shown only on mobile) -->
						<div class="mb-4 flex justify-center md:hidden">
							<img
								src="/logo.png"
								alt="Tailor Made Coffee Roasters"
								class="h-16 w-auto object-contain"
							/>
						</div>

						<!-- Header -->
						<div class="mb-4 sm:mb-6">
							<div
								class="mb-2 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 sm:mb-3 sm:px-3 sm:py-1.5 dark:bg-stone-800"
							>
								<Sparkles class="h-3 w-3 text-stone-600 sm:h-3.5 sm:w-3.5 dark:text-stone-400" />
								<span
									class="text-[10px] font-semibold tracking-wide text-stone-700 uppercase sm:text-xs dark:text-stone-300"
									>Invitation</span
								>
							</div>
							<h1
								class="font-[family-name:var(--font-tailormade)] text-xl font-bold text-foreground sm:text-2xl lg:text-3xl"
							>
								Join the Team
							</h1>
							<p class="mt-1 text-sm text-muted-foreground sm:text-base">
								Complete your account setup to get started
							</p>
						</div>

						<!-- Invitation Details Grid -->
						<div class="mb-4 grid gap-2 sm:mb-6 sm:grid-cols-2 sm:gap-3">
							<div
								class="flex items-center gap-2.5 rounded-lg bg-stone-50 p-3 transition-colors hover:bg-stone-100 sm:gap-3 sm:rounded-xl sm:p-4 dark:bg-stone-800/60 dark:hover:bg-stone-800"
							>
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200 sm:h-10 sm:w-10 sm:rounded-lg dark:bg-stone-700"
								>
									<Building2 class="h-4 w-4 text-stone-600 sm:h-5 sm:w-5 dark:text-stone-400" />
								</div>
								<div class="min-w-0">
									<p
										class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:text-[11px]"
									>
										Organization
									</p>
									<p class="truncate text-sm font-medium text-foreground sm:text-base">
										{invitation.organization.name}
									</p>
								</div>
							</div>

							<div
								class="flex items-center gap-2.5 rounded-lg bg-stone-50 p-3 transition-colors hover:bg-stone-100 sm:gap-3 sm:rounded-xl sm:p-4 dark:bg-stone-800/60 dark:hover:bg-stone-800"
							>
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200 sm:h-10 sm:w-10 sm:rounded-lg dark:bg-stone-700"
								>
									<Mail class="h-4 w-4 text-stone-600 sm:h-5 sm:w-5 dark:text-stone-400" />
								</div>
								<div class="min-w-0">
									<p
										class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:text-[11px]"
									>
										Your Email
									</p>
									<p class="truncate text-sm font-medium text-foreground sm:text-base">
										{invitation.email}
									</p>
								</div>
							</div>

							<div
								class="flex items-center justify-between gap-2.5 rounded-lg bg-stone-50 p-3 transition-colors hover:bg-stone-100 sm:col-span-2 sm:gap-3 sm:rounded-xl sm:p-4 dark:bg-stone-800/60 dark:hover:bg-stone-800"
							>
								<div class="flex items-center gap-2.5 sm:gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200 sm:h-10 sm:w-10 sm:rounded-lg dark:bg-stone-700"
									>
										<User class="h-4 w-4 text-stone-600 sm:h-5 sm:w-5 dark:text-stone-400" />
									</div>
									<div>
										<p
											class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:text-[11px]"
										>
											Your Role
										</p>
										<p class="text-sm font-medium text-foreground sm:text-base">
											{invitation.role.name}
										</p>
									</div>
								</div>
								<Badge
									class="border-0 bg-gradient-to-r from-stone-600 to-stone-800 text-xs text-white shadow-md sm:text-sm"
								>
									{invitation.role.name}
								</Badge>
							</div>
						</div>

						<!-- Divider -->
						<div class="relative mb-4 flex items-center sm:mb-6">
							<div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
							<span
								class="mx-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:mx-4 sm:text-xs"
								>Account Setup</span
							>
							<div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
						</div>

						<!-- User Already Exists Warning -->
						{#if userExists}
							<div
								class="rounded-lg border border-stone-300 bg-stone-100 p-4 sm:rounded-xl sm:p-5 dark:border-stone-600 dark:bg-stone-800/50"
							>
								<div class="flex items-start gap-3 sm:gap-4">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 sm:h-10 sm:w-10 dark:bg-stone-700"
									>
										<AlertCircle class="h-4 w-4 text-stone-600 sm:h-5 sm:w-5 dark:text-stone-400" />
									</div>
									<div>
										<p
											class="text-sm font-semibold text-stone-800 sm:text-base dark:text-stone-200"
										>
											Account Already Exists
										</p>
										<p class="mt-1 text-xs text-stone-600 sm:text-sm dark:text-stone-400">
											An account with this email already exists. Please
											<a
												href="/auth/login"
												class="font-medium underline underline-offset-2 hover:no-underline">login</a
											> instead.
										</p>
									</div>
								</div>
							</div>
						{:else}
							<!-- Setup Account Form -->
							<form
								method="POST"
								action="?/accept"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ update }) => {
										await update();
										isSubmitting = false;
									};
								}}
								class="space-y-3 sm:space-y-5"
							>
								<input type="hidden" name="token" value={invitation.token} />

								<div class="space-y-1.5 sm:space-y-2">
									<Label for="username" class="text-xs font-medium sm:text-sm"
										>Διαλέξε ένα Username</Label
									>
									<div class="relative">
										<User
											class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3.5"
										/>
										<Input
											id="username"
											name="username"
											type="text"
											placeholder="Your display name"
											bind:value={username}
											class="h-10 pl-9 text-sm sm:h-12 sm:pl-11 sm:text-base"
											required
											minlength={2}
											disabled={isSubmitting}
										/>
									</div>
									<Label for="username" class="text-xs font-medium sm:text-sm"
										>Βάλε το ονοματεπώνυμο σου</Label
									>
									<div class="relative">
										<User
											class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3.5"
										/>
										<Input
											id="full_name"
											name="full_name"
											type="text"
											placeholder="John Doe"
											bind:value={full_name}
											class="h-10 pl-9 text-sm sm:h-12 sm:pl-11 sm:text-base"
											required
											minlength={2}
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div class="space-y-1.5 sm:space-y-2">
									<Label for="password" class="text-xs font-medium sm:text-sm"
										>Δημίουργησε κώδικο</Label
									>
									<div class="relative">
										<Lock
											class="absolute top-6 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3.5"
										/>
										<Password.Root>
											<Password.Input
												name="password"
												required
												disabled={isSubmitting}
												bind:value={password}
												placeholder="*********"
												class="h-10 pl-9 text-sm sm:h-12 sm:pl-11 sm:text-base"
											>
												<Password.ToggleVisibility />
											</Password.Input>
											<Password.Strength />
										</Password.Root>
									</div>
								</div>

								<div class="space-y-1.5 sm:space-y-2">
									<Label for="confirmPassword" class="text-xs font-medium sm:text-sm"
										>Επαλήθευσε τοων κώδικο σου</Label
									>
									<div class="relative">
										<Lock
											class="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3.5"
										/>
										<Password.Root>
											<Password.Input
												id="confirmPassword"
												name="confirmPassword"
												placeholder="Confirm your password"
												bind:value={confirmPassword}
												class="h-10 pl-9 text-sm sm:h-12 sm:pl-11 sm:text-base"
												required
												disabled={isSubmitting}
											>
												<Password.ToggleVisibility />
											</Password.Input>
										</Password.Root>
									</div>
									{#if confirmPassword && !passwordsMatch}
										<p class="flex items-center gap-1.5 text-xs text-red-500 sm:text-sm">
											<AlertCircle class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
											Passwords do not match
										</p>
									{/if}
								</div>

								<Button
									type="submit"
									class="h-10 w-full gap-2 bg-gradient-to-r from-stone-700 to-stone-900 text-sm font-semibold text-white shadow-lg shadow-stone-500/25 transition-all hover:from-stone-800 hover:to-stone-950 hover:shadow-xl hover:shadow-stone-500/30 disabled:opacity-50 disabled:shadow-none sm:h-12 sm:text-base dark:from-stone-600 dark:to-stone-800 dark:hover:from-stone-500 dark:hover:to-stone-700"
									disabled={!formValid || isSubmitting}
								>
									{#if isSubmitting}
										<Spinner class="h-4 w-4 sm:h-5 sm:w-5" />
										<span>Creating Account...</span>
									{:else}
										<CheckCircle class="h-4 w-4 sm:h-5 sm:w-5" />
										<span>Accept & Create Account</span>
									{/if}
								</Button>
							</form>
						{/if}

						<!-- Expiration Notice -->
						<div
							class="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50/50 p-3 text-center sm:mt-6 sm:rounded-xl sm:p-4 dark:border-stone-600 dark:bg-stone-800/30"
						>
							<p class="text-xs text-muted-foreground sm:text-sm">
								This invitation expires on
								<span class="mt-0.5 block font-medium text-foreground sm:mt-1"
									>{formatDate(invitation.expires_at)}</span
								>
							</p>
						</div>

						<!-- Footer -->
						<p class="mt-4 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm">
							Already have an account?
							<a
								href="/auth/login"
								class="font-medium text-stone-700 transition-colors hover:text-stone-900 hover:underline dark:text-stone-400 dark:hover:text-stone-300"
							>
								Login here
							</a>
						</p>
					</div>
				</div>
			</Card.Root>
		{/if}
	</div>
</div>
