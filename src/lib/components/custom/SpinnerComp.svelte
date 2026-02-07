<script lang="ts">
	import { Loader2, Sparkles } from 'lucide-svelte';
	import type { Component } from 'svelte';

	interface Props {
		// Content
		title?: string;
		description?: string;

		// Size variant
		size?: 'sm' | 'md' | 'lg';

		// Icon - can be a Lucide component
		icon?: Component<{ class?: string }>;

		// Visual customization
		showFloatingDots?: boolean;
		dotColors?: [string, string, string];

		// Minimal mode (just spinner, no decorations)
		minimal?: boolean;
	}

	let {
		title = 'Φόρτωση...',
		description,
		size = 'md',
		icon: Icon = Loader2 as any,
		showFloatingDots = true,
		dotColors = ['var(--shift-morning)', 'var(--shift-afternoon)', 'var(--shift-evening)'],
		minimal = false
	}: Props = $props();

	const sizeClasses = {
		sm: 'h-8 w-8',
		md: 'h-16 w-16',
		lg: 'h-24 w-24'
	};

	const containerSizeClasses = {
		sm: 'h-16 w-16',
		md: 'h-32 w-32',
		lg: 'h-48 w-48'
	};
</script>

{#if minimal}
	<!-- Minimal spinner -->
	<div class="flex items-center justify-center p-8">
		<Icon class="h-8 w-8 animate-spin text-primary" />
	</div>
{:else}
	<!-- Full loading state -->
	<div class="animate-in fade-in slide-in-from-bottom-6 duration-700">
		<div
			class="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-transparent p-8 backdrop-blur-sm md:p-12"
		>
			<!-- Background decoration -->
			<div class="pointer-events-none absolute inset-0 overflow-hidden">
				<!-- Grid pattern -->
				<div
					class="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
					style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 40px 40px;"
				></div>

				<!-- Floating gradient orbs -->
				<div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 dark:bg-primary/10 blur-3xl"></div>
				<div class="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl"></div>
			</div>

			<div class="relative flex flex-col items-center text-center">
				<!-- Spinner container -->
				<div class="relative mb-8">
					<!-- Spinner background -->
					<div
						class="relative flex {containerSizeClasses[size]} items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-muted to-transparent shadow-lg dark:shadow-2xl"
					>
						<!-- Spinning icon -->
						<Icon class="{sizeClasses[size]} animate-spin-clockwise repeat-infinite text-primary/80 dark:text-primary/60" />

						<!-- Sparkle decorations -->
						<div class="absolute -top-2 -right-2 animate-pulse">
							<Sparkles class="h-5 w-5 text-primary/70 dark:text-primary/50" />
						</div>
						<div class="absolute -bottom-1 -left-1 animate-pulse" style="animation-delay: 300ms;">
							<Sparkles class="h-4 w-4 text-primary/50 dark:text-primary/30" />
						</div>

						<!-- Floating dots -->
						{#if showFloatingDots}
							<div
								class="absolute -top-4 right-4 h-3 w-3 animate-bounce rounded-full"
								style="background: {dotColors[0]}; animation-delay: 0ms;"
							></div>
							<div
								class="absolute -right-4 top-4 h-2.5 w-2.5 animate-bounce rounded-full"
								style="background: {dotColors[1]}; animation-delay: 150ms;"
							></div>
							<div
								class="absolute -bottom-3 right-8 h-2 w-2 animate-bounce rounded-full"
								style="background: {dotColors[2]}; animation-delay: 300ms;"
							></div>
						{/if}
					</div>
				</div>

				<!-- Text content -->
				<h3 class="mb-2 text-2xl font-bold tracking-tight">
					{title}
				</h3>
				{#if description}
					<p class="max-w-md text-muted-foreground">
						{description}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}