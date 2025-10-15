<script lang="ts">
	import { getAllBlogs, authenticatedAccess } from './data.remote';
	import type { Blog } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		X,
		RefreshCcw,
		Plus,
		Search,
	} from 'lucide-svelte';
	import * as Empty from "$lib/components/ui/empty/index.js";
  import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
	import BlogCard from './components/BlogCard.svelte';
	import AddBlogDialog from './components/AddBlogDialog.svelte';

	authenticatedAccess();
	let query = getAllBlogs();
	let allBlogs = $derived(query.current?.blogs ?? []);
	let totalBlogs = $derived(query.current?.total ?? 0);

	// Filter states
	let searchQuery = $state('');
	let categoryFilter = $state('');
	let publishedFilter = $state<string>(''); // 'all', 'published', 'draft'

	let page = $state(1);
	const perPage = 10;
	
	let creatingBlog = $state(false);

	let categories = $derived([...new Set(allBlogs.map((b) => b.category).filter(Boolean))]);

	// Refresh state
	let refreshAction = $state(false);

	// Filtered blogs
	let filteredBlogs = $derived(() => {
		let blogs = allBlogs;

		// Filter by category
		if (categoryFilter) {
			blogs = blogs.filter((b) => b.category === categoryFilter);
		}

		if (publishedFilter === 'published') {
			blogs = blogs.filter((b) => b.published === true);
		} else if (publishedFilter === 'draft') {
			blogs = blogs.filter((b) => b.published === false);
		}

		if (searchQuery) {
			blogs = blogs.filter(
				(blog) =>
					blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(blog.description &&
						blog.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
					blog.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return blogs;
	});

	let paginatedBlogs = $derived(() => {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return filteredBlogs().slice(start, end);
	});

	// Reset page when filters change
	$effect(() => {
		if (searchQuery || categoryFilter || publishedFilter) {
			page = 1;
		}
	});

	async function refresh() {
		refreshAction = true;
		await query.refresh();
		clearAllFilters();
		refreshAction = false;
	}

	function clearSearch() {
		searchQuery = '';
	}

	function clearAllFilters() {
		searchQuery = '';
		categoryFilter = '';
		publishedFilter = '';
		page = 1;
	}

</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					Blog Management
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Create, edit, and manage all blog posts from this dashboard
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Showing: <span class="font-semibold">{filteredBlogs().length}</span> / {totalBlogs}
						posts
					</p>
				</div>
			</div>
			<!-- Filters & Actions Section -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<!-- Published Status Filter -->
					<Select.Root type="single" bind:value={publishedFilter}>
						<Select.Trigger class="w-full sm:w-[180px]">
							{publishedFilter === 'published'
								? 'Published'
								: publishedFilter === 'draft'
									? 'Draft'
									: 'All Status'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Status</Select.Label>
								<Select.Item value="" label="All Status">All Status</Select.Item>
								<Select.Item value="published" label="Published">Published</Select.Item>
								<Select.Item value="draft" label="Draft">Draft</Select.Item>
							</Select.Group>
						</Select.Content>
					</Select.Root>

					<!-- Category Filter -->
					{#if categories.length > 0}
						<Select.Root type="single" bind:value={categoryFilter}>
							<Select.Trigger class="w-full sm:w-[180px]">
								{categoryFilter || 'All Categories'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Categories</Select.Label>
									<Select.Item value="" label="All Categories">All Categories</Select.Item>
									{#each categories as category}
										<Select.Item value={category ?? ''} label={category}>
											{category}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/if}
				</div>

				<!-- Search Input & Actions -->
				<div class="relative flex items-center gap-2">
					<!-- Add Button -->
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="default"
									size="sm"
									class="h-8 cursor-pointer gap-2 px-3"
									onclick={() => (creatingBlog = true)}
								>
									<Plus class="h-4 w-4" />
									<span class="hidden sm:inline">Create Blog</span>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Create Blog</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<!-- Refresh Button -->
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="secondary"
									size="sm"
									onclick={refresh}
									disabled={refreshAction}
									class="h-6 cursor-pointer px-2 text-xs"
								>
									<RefreshCcw class={`mr-2 h-4 w-4 ${refreshAction ? 'animate-spin' : ''}`} />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Refresh Blogs</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<!-- Search Input -->
					<Input
						bind:value={searchQuery}
						class="w-full py-1 pr-8 sm:w-72"
						placeholder="Filter posts..."
					/>
					{#if searchQuery}
						<Button
							variant="ghost"
							size="icon"
							onclick={clearSearch}
							class="absolute right-1 h-7 w-7 cursor-pointer"
						>
							<X class="h-3 w-3" />
						</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if query.loading}
			<div class="space-y-3">
				{#each Array(5) as _}
					<div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
						<div class="flex items-start justify-between gap-1">
							<div class="flex-1 space-y-3">
								<div class="flex items-start gap-3">
									<Skeleton class="h-20 w-32 flex-shrink-0 rounded" />
									<div class="flex-1 space-y-2">
										<Skeleton class="h-5 w-3/4" />
										<Skeleton class="h-4 w-full" />
										<Skeleton class="h-4 w-2/3" />
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Skeleton class="h-6 w-20 rounded-full" />
									<Skeleton class="h-6 w-24 rounded-full" />
									<Skeleton class="h-4 w-32" />
								</div>
							</div>
							<div class="flex flex-col gap-1 md:flex-row">
								<Skeleton class="h-8 w-8 rounded" />
								<Skeleton class="h-8 w-8 rounded" />
								<Skeleton class="h-8 w-8 rounded" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredBlogs().length === 0}
			<Empty.Root class=" h-48 bg-gradient-to-b pb-4 from-muted/50 from-30% to-background">
				<Empty.Header>
					<Empty.Media variant="icon">
						<Search />
					</Empty.Media>
					<Empty.Title>No Blogs Found</Empty.Title>
					<Empty.Description>
						You're all caught up, Adjust your filters.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button variant="outline" onclick={clearAllFilters} size="sm" class="cursor-pointer">
            Clear Filters
						<RefreshCcwIcon />
					</Button>
				</Empty.Content>
			</Empty.Root>
		{:else}
			<!-- Blogs List -->
			<div class="space-y-3">
				{#each paginatedBlogs() as blog (blog.id)}
					<BlogCard {blog} onUpdate={refresh} />
				{/each}
			</div>

			<!-- Pagination -->
			{#if filteredBlogs().length > perPage}
				<div class="mt-8 flex justify-center">
					<Pagination.Root count={filteredBlogs().length} bind:page {perPage}>
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton />
							</Pagination.Item>
							{#each Array(Math.ceil(filteredBlogs().length / perPage)) as _, i}
								<Pagination.Item>
									<Pagination.Link
										page={{ value: i + 1, type: 'page' }}
										isActive={page === i + 1}
									/>
								</Pagination.Item>
							{/each}
							<Pagination.Item>
								<Pagination.NextButton />
							</Pagination.Item>
						</Pagination.Content>
					</Pagination.Root>
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Add Blog Dialog -->
<AddBlogDialog bind:open={creatingBlog} onSuccess={refresh} />
