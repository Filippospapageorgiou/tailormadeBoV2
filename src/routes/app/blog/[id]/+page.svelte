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

				<!-- Content -->
				<div
					class="prose prose-lg dark:prose-invert max-w-none
						   prose-headings:font-bold prose-headings:tracking-tight
						   prose-p:text-muted-foreground prose-p:leading-relaxed
						   prose-a:text-primary prose-a:no-underline hover:prose-a:underline
						   prose-img:rounded-xl
						   prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 
						   prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
						   prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
						   prose-code:before:content-none prose-code:after:content-none"
				>
					{@html blog.content}
				</div>

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