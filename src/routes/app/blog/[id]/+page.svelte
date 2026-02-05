<script lang="ts">
	import type { PageData } from './$types';
	import type { Blog } from '$lib/models/database.types';
	import { goto } from '$app/navigation';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { readBlog } from '../data.remote';
	import { onMount } from 'svelte';
	import { ArrowLeft, Calendar, Clock } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	let { data }: { data: PageData } = $props();
	const { blog } = $derived(data) as { blog: Blog };

	onMount(() => {
		readBlog(blog.id);
	});

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('el-GR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			return '';
		}
	}

	function estimateReadTime(content: string): number {
		const wordsPerMinute = 200;
		const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
		return Math.max(1, Math.ceil(words / wordsPerMinute));
	}

</script>

{#if blog}
	<div class="min-h-screen bg-background">
		<!-- Back Button - Fixed at top -->
		<div class="container mx-auto px-4 md:px-6 pt-4">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto('/app/blog')}
				class="gap-2 text-muted-foreground hover:text-foreground -ml-2"
			>
				<ArrowLeft class="h-4 w-4" />
				Πίσω
			</Button>
		</div>

		<main class="container mx-auto px-4 md:px-6 pt-4 pb-20">
			<article class="mx-auto max-w-3xl">
				<!-- Header -->
				<header class="mb-8">
					<!-- Title -->
					<h1 class="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
						{blog.title}
					</h1>

					<!-- Description -->
					{#if blog.description}
						<p class="text-lg text-muted-foreground leading-relaxed">
							{blog.description}
						</p>
					{/if}

					<!-- Author & Meta -->
					<div class="flex items-center gap-4 mt-6 pt-6 border-t border-border/50 dark:border-white/10">
						<img
							src={blog.profile.image_url}
							alt={blog.profile.username}
							class="h-10 w-10 rounded-full object-cover ring-2 ring-background"
						/>
						<div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
							<span class="font-medium text-foreground">{blog.profile.username}</span>
							<div class="flex items-center gap-3 text-sm text-muted-foreground">
								<span class="flex items-center gap-1">
									<Calendar class="h-3.5 w-3.5" />
									{formatDate(blog.created_at)}
								</span>
								<span class="hidden sm:inline text-border">•</span>
							</div>
						</div>
					</div>
				</header>

				<!-- Image Carousel -->
				{#if blog.images && blog.images.length > 0}
					<div class="my-8">
						<Carousel.Root class="w-full">
							<Carousel.Content>
								{#each blog.images as image, i}
									<Carousel.Item>
										<div class="overflow-hidden rounded-2xl bg-muted">
											<img
												src={image}
												alt={`${blog.title} - εικόνα ${i + 1}`}
												class="w-full h-[300px] md:h-[450px] object-cover"
											/>
										</div>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							{#if blog.images.length > 1}
								<Carousel.Previous class="left-3" />
								<Carousel.Next class="right-3" />
							{/if}
						</Carousel.Root>
						<!-- Image counter (only if multiple) -->
						{#if blog.images.length > 1}
							<p class="text-center text-sm text-muted-foreground mt-3">
								{blog.images.length} εικόνες
							</p>
						{/if}
					</div>
				{/if}

				{#if blog.content}
					<div
						class="preview-content overflow-auto p-4"
						role="document"
						aria-label="Markdown preview"
					>
						{#if blog.content.trim()}
							{@html blog.content}
						{:else}
							<p class="text-muted-foreground italic">Nothing to preview</p>
						{/if}
					</div>
				{/if}

				<!-- Footer -->
				<footer class="mt-12 pt-8 border-t border-border/50 dark:border-white/10">
					<!-- Tags at bottom -->
					{#if blog.tags && blog.tags.length > 0}
						<div class="flex flex-wrap items-center gap-2 mb-8">
							{#each blog.tags as tag}
								<Badge 
									variant="outline" 
									class="text-xs cursor-pointer hover:bg-muted transition-colors"
								>
									#{tag}
								</Badge>
							{/each}
						</div>
					{/if}

					<!-- Back Button -->
					<div class="flex justify-center">
						<Button
							variant="outline"
							onclick={() => goto('/app/blog')}
							class="gap-2"
						>
							<ArrowLeft class="h-4 w-4" />
							Πίσω στα Άρθρα
						</Button>
					</div>
				</footer>
			</article>
		</main>
	</div>
{/if}


<style>
	/* Preview content styling */
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