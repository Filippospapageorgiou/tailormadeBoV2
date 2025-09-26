<script lang="ts">
	import BlogCard from '$lib/components/custom/Blog/blogCard.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { getPosts } from './data.remote';
	import { Skeleton } from '$lib/components/ui/skeleton'; // <-- 1. Import Skeleton

	let query = getPosts();

	let allBlogs = $derived(query.current?.blogs ?? []);

	let page = $state(1);
	const perPage = 6;

	let paginatedBlogs = $derived(() => {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return allBlogs.slice(start, end);
	});
</script>

<div class="min-h-screen bg-white">
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<div class="mb-12">
			<h1 class="font-mono text-4xl tracking-wider text-neutral-800">Our Blog</h1>
			<p class="text-sm text-[#8B6B4A]">Stay updated with our latest news and stories.</p>
		</div>

		{#if query.loading}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(2) as _}
					<div class="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm">
						<Skeleton class="aspect-video w-full" />

						<div class="flex flex-grow flex-col p-4">
							<Skeleton class="mb-2 h-5 w-4/5" />

							<div class="space-y-2">
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-2/3" />
							</div>

							<div class="mt-auto pt-4">
								<div class="flex items-center">
									<Skeleton class="mr-3 h-8 w-8 shrink-0 rounded-full" />
									<div class="w-full space-y-1">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-3 w-32" />
									</div>
								</div>

								<div class="mt-4 flex flex-wrap gap-2">
									<Skeleton class="h-6 w-16 rounded-md" />
									<Skeleton class="h-6 w-20 rounded-md" />
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each paginatedBlogs() as blog}
					<BlogCard {blog} />
				{/each}
			</div>
		{/if}
		<div class="mt-12 flex justify-center">
			<Pagination.Root count={allBlogs.length} bind:page {perPage}>
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton />
					</Pagination.Item>
					{#each Array(Math.ceil(allBlogs.length / perPage)) as _, i}
						<Pagination.Item>
							<Pagination.Link page={{ value: i + 1, type: 'page' }} isActive={page === i + 1} />
						</Pagination.Item>
					{/each}
					<Pagination.Item>
						<Pagination.NextButton />
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		</div>
	</main>
</div>
