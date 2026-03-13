<script lang="ts">
	import type { PageData } from './$types';
	import type { ManualWithAuthor } from '$lib/models/manuals.types';
	import { MANUAL_CATEGORY_LABELS } from '$lib/models/manuals.types';
	import { goto } from '$app/navigation';
	import { markManualAsRead } from '$lib/api/manual/data.remote';
	import { onMount } from 'svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { ArrowLeft, Calendar, User, CheckCircle2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { data }: { data: PageData } = $props();
	const manual = $derived(data.manual as ManualWithAuthor);

	onMount(() => {
		markManualAsRead({ id: manual.id });
	});

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('el-GR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return '';
		}
	}

	const renderedContent = $derived(
		manual.content ? DOMPurify.sanitize(marked.parse(manual.content) as string) : ''
	);

	const categoryColors: Record<string, string> = {
		equipment: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
		cleaning: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
		sales: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
		customer_service: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
		safety: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
		inventory: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20',
		opening_closing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20',
		other: 'bg-muted text-muted-foreground ring-border'
	};
</script>

{#if manual}
	<div class="min-h-screen bg-background">
		<!-- Back Button -->
		<div class="container mx-auto px-4 pt-4 md:px-6">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto('/app/manuals')}
				class="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				Πίσω
			</Button>
		</div>

		<main class="container mx-auto px-4 pt-4 pb-20 md:px-6">
			<article class="mx-auto max-w-3xl">
				<!-- Header -->
				<header class="mb-8">
					<Badge
						class="mb-3 rounded-full border-0 text-[11px] font-semibold ring-1 {categoryColors[
							manual.category
						] || categoryColors.other}"
					>
						{MANUAL_CATEGORY_LABELS[manual.category]}
					</Badge>

					<h1 class="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
						{manual.title}
					</h1>

					{#if manual.description}
						<p class="text-lg leading-relaxed text-muted-foreground">
							{manual.description}
						</p>
					{/if}

					<div
						class="mt-6 flex items-center gap-3 border-t border-border/50 pt-6 text-sm text-muted-foreground dark:border-white/10"
					>
						{#if manual.profiles}
							<span class="flex items-center gap-1.5">
								<User class="h-3.5 w-3.5" />
								{manual.profiles.username}
							</span>
						{/if}
						<span class="flex items-center gap-1.5">
							<Calendar class="h-3.5 w-3.5" />
							{formatDate(manual.created_at)}
						</span>
					</div>
				</header>

				<!-- Image Carousel -->
				{#if manual.media && manual.media.length > 0}
					<div class="my-8">
						<Carousel.Root class="w-full">
							<Carousel.Content>
								{#each manual.media as mediaUrl, i (`${mediaUrl}-${i}`)}
									<Carousel.Item>
										<div class="overflow-hidden rounded-2xl bg-muted">
											<img
												src={typeof mediaUrl === 'string' ? mediaUrl : ''}
												alt="{manual.title} - εικόνα {i + 1}"
												class="h-[300px] w-full object-cover md:h-[450px]"
											/>
										</div>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							{#if manual.media.length > 1}
								<Carousel.Previous class="left-3" />
								<Carousel.Next class="right-3" />
							{/if}
						</Carousel.Root>
						{#if manual.media.length > 1}
							<p class="mt-3 text-center text-sm text-muted-foreground">
								{manual.media.length} εικόνες
							</p>
						{/if}
					</div>
				{/if}

				<!-- Content -->
				{#if manual.content}
					<div
						class="preview-content overflow-auto p-4"
						role="document"
						aria-label="Markdown preview"
					>
						{#if manual.content.trim()}
							{@html renderedContent}
						{:else}
							<p class="italic text-muted-foreground">Nothing to preview</p>
						{/if}
					</div>
				{/if}

				<!-- Footer -->
				<footer class="mt-12 border-t border-border/50 pt-8 dark:border-white/10">
					<div class="flex justify-center">
						<Button variant="outline" onclick={() => goto('/app/manuals')} class="gap-2">
							<ArrowLeft class="h-4 w-4" />
							Πίσω στα Εγχειρίδια
						</Button>
					</div>
				</footer>
			</article>
		</main>
	</div>
{/if}

<style>
	.preview-content :global(h1) {
		font-size: 1.875rem;
		line-height: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h2) {
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h3) {
		font-size: 1.25rem;
		line-height: 1.75rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(p) {
		margin-bottom: 1rem;
		line-height: 1.625;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(li) {
		margin-bottom: 0.25rem;
	}

	.preview-content :global(blockquote) {
		border-left-width: 4px;
		border-color: hsl(var(--muted-foreground));
		padding-left: 1rem;
		font-style: italic;
		margin-bottom: 1rem;
		color: hsl(var(--muted-foreground));
	}

	.preview-content :global(code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		color: hsl(var(--foreground));
	}

	.preview-content :global(pre) {
		background-color: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.preview-content :global(pre code) {
		background-color: transparent;
		padding: 0;
		border-radius: 0;
	}

	.preview-content :global(mark) {
		background-color: rgb(254 240 138);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}

	:global(.dark) .preview-content :global(mark) {
		background-color: rgb(133 77 14);
		color: rgb(254 243 199);
	}

	.preview-content :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	.preview-content :global(a:hover) {
		opacity: 0.8;
	}

	.preview-content :global(img) {
		max-width: 100%;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.preview-content :global(u) {
		text-decoration: underline;
	}

	.preview-content :global(del),
	.preview-content :global(s) {
		text-decoration: line-through;
	}

	.preview-content :global(hr) {
		border: none;
		border-top: 1px solid hsl(var(--border));
		margin: 1.5rem 0;
	}

	.preview-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.preview-content :global(th),
	.preview-content :global(td) {
		border: 1px solid hsl(var(--border));
		padding: 0.5rem;
		text-align: left;
	}

	.preview-content :global(th) {
		background-color: hsl(var(--muted));
		font-weight: 600;
	}
</style>
