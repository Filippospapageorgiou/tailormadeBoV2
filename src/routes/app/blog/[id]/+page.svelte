<script lang="ts">
	import type { PageData } from './$types';
	import type { Blog } from '$lib/models/database.types';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	let { data }: { data: PageData } = $props();
	const { blog } = $derived(data) as { blog: Blog };

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			return '';
		}
	}
</script>

{#if blog}
	<div class="min-h-screen bg-white">
		<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
			<div class="mx-auto max-w-4xl">
				<div class="mb-8">
					<h1 class="font-mono text-4xl tracking-wider text-neutral-800">{blog.title}</h1>
					{#if blog.description}
						<p class="mt-2 text-lg text-neutral-600">{blog.description}</p>
					{/if}
					<div class="mt-4 flex items-center">
						<img
							src={blog.profile.image_url}
							alt={blog.profile.username}
							class="mr-4 h-10 w-10 rounded-full object-cover"
						/>
						<div>
							<p class="text-base font-medium text-neutral-800">{blog.profile.username}</p>
							<p class="text-sm text-neutral-600">{formatDate(blog.created_at)}</p>
						</div>
					</div>
				</div>

				{#if blog.images}
          <Carousel.Root class="w-full max-w-xl mx-auto my-4">
            <Carousel.Content>
              {#each blog.images as image, i}
                <Carousel.Item>
                  <div class="p-1">
                        <img
                          src={image}
                          alt={'Blog image'}
                          class="h-full w-full object-cover rounded-2xl"
                        />
                  </div>
                </Carousel.Item>
              {/each}
            </Carousel.Content>
            <Carousel.Previous />
            <Carousel.Next />
          </Carousel.Root>
        {/if}

				<div class="prose lg:prose-xl max-w-none">
					{@html blog.content}
				</div>

				<div class="mt-12 flex justify-center">
					<button
						onclick={() => goto('/app/blog')}
						class="inline-flex cursor-pointer items-center rounded-lg border border-[#8B6B4A] bg-white px-6 py-2 text-sm font-medium text-[#8B6B4A] transition-colors duration-300 hover:bg-[#8B6B4A] hover:text-white"
					>
						Back to Blog
					</button>
				</div>
			</div>
		</main>
	</div>
{/if}
