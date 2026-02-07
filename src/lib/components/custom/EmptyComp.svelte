<script lang="ts">
	import { Calendar, Sparkles, Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet, Component } from 'svelte';

	interface Props {
		// Content
		title: string;
		description: string;
		tip?: string;

		// Icon - can be a Lucide component
		icon?: Component<{ class?: string }>;

		// Primary action
		primaryLabel: string;
		onPrimaryClick?: () => void;
		primaryIcon?: Component<{ class?: string }>;

		// Secondary action (optional)
		secondaryLabel?: string;
		onSecondaryClick?: () => void;
		secondaryIcon?: Component<{ class?: string }>;

		// Visual customization
		showFloatingDots?: boolean;
		dotColors?: [string, string, string];

		// Custom content slot
		children?: Snippet;
	}

	let {
		title,
		description,
		tip,
		icon: Icon = Calendar as any,
		primaryLabel,
		onPrimaryClick,
		primaryIcon: PrimaryIcon = Plus as any,
		secondaryLabel,
		onSecondaryClick,
		secondaryIcon: SecondaryIcon,
		showFloatingDots = false,
		dotColors = ['var(--shift-morning)', 'var(--shift-afternoon)', 'var(--shift-evening)'],
		children
	}: Props = $props();
</script>

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
			<!-- Illustration -->
			<div class="relative mb-8">
				<!-- Icon container -->
				<div
					class="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-muted to-transparent shadow-lg dark:shadow-2xl"
				>
					<!-- Main icon with animation -->
					<Icon class="h-16 w-16 text-primary/80 dark:text-primary/60 transition-transform duration-500 hover:scale-110" />

					<!-- Sparkle decorations -->
					<div class="absolute -top-2 -right-2 animate-pulse">
						<Sparkles class="h-5 w-5 text-primary/70 dark:text-primary/50" />
					</div>
					<div class="absolute -bottom-1 -left-1 animate-pulse" style="animation-delay: 300ms;">
						<Sparkles class="h-4 w-4 text-primary/50 dark:text-primary/30" />
					</div>

					<!-- Floating dots (optional) -->
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
			<p class="mb-8 max-w-md text-muted-foreground">
				{description}
			</p>

			<!-- Custom content slot -->
			{#if children}
				{@render children()}
			{/if}

			<!-- Action buttons -->
			<div class="flex flex-col items-center gap-3 sm:flex-row">
				<Button
					onclick={onPrimaryClick}
					size="lg"
					class="group gap-2 bg-primary px-6 text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
				>
					{#if PrimaryIcon}
						<PrimaryIcon class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
					{/if}
					{primaryLabel}
				</Button>

				{#if secondaryLabel && onSecondaryClick}
					<Button
						onclick={onSecondaryClick}
						variant="outline"
						size="lg"
						class="gap-2 border-border transition-all duration-300 hover:border-border/80 hover:bg-muted"
					>
						{#if SecondaryIcon}
							<SecondaryIcon class="h-4 w-4" />
						{/if}
						{secondaryLabel}
					</Button>
				{/if}
			</div>

			<!-- Quick tip (optional) -->
			{#if tip}
				<div class="mt-8 flex items-center gap-2 rounded-lg bg-muted/50 dark:bg-muted/30 px-4 py-2">
					<Sparkles class="h-4 w-4 text-primary/80 dark:text-primary/60" />
					<p class="text-xs text-muted-foreground">
						<span class="font-medium text-primary">Συμβουλή:</span>
						{tip}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>