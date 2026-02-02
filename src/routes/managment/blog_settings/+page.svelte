<script lang="ts">
	import { getAllBlogs } from '../../../lib/api/blog/data.remote';
	import { authenticatedAccess } from '$lib/api/bonus_managment/data.remote';
	import type { Blog } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { X, RefreshCcw, Plus, FileText } from 'lucide-svelte';
	import BlogCard from './components/BlogCard.svelte';
	import AddBlogDialog from './components/AddBlogDialog.svelte';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { toast } from 'svelte-sonner';

	let auth = authenticatedAccess();
	let query = getAllBlogs();
	let allBlogs = $derived(query.current?.blogs ?? []);
	let totalBlogs = $derived(query.current?.total ?? 0);

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	// Filter states
	let searchQuery = $state('');
	let categoryFilter = $state('');
	let publishedFilter = $state<string>('');

	let page = $state(1);
	const perPage = 10;

	let creatingBlog = $state(false);

	let categories = $derived([...new Set(allBlogs.map((b) => b.category).filter(Boolean))]);

	// Refresh state
	let refreshAction = $state(false);

	// Filtered blogs
	let filteredBlogs = $derived(() => {
		let blogs = allBlogs;

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

	let hasActiveFilters = $derived(searchQuery || categoryFilter || publishedFilter);
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen bg-background">
		<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
			<!-- Header Section -->
			<div class="mb-8 space-y-4">
				<div class="flex flex-col gap-2">
					<h1 class="font-mono text-3xl tracking-wider text-foreground md:text-4xl">
						Blog Management
					</h1>
					<p class="text-xs text-primary md:text-sm">
						Create, edit, and manage all blog posts from this dashboard
					</p>
					<div class="flex items-center gap-2">
						<p class="text-xs text-muted-foreground md:text-sm">
							Showing: 
							<span class="font-semibold text-foreground">{filteredBlogs().length}</span> 
							/ {totalBlogs} posts
						</p>
						{#if hasActiveFilters}
							<Button
								variant="secondary"
								size="sm"
								onclick={clearAllFilters}
								class="h-6 cursor-pointer px-2 text-xs"
							>
								<X class="mr-1 h-3 w-3" />
								Clear filters
							</Button>
						{/if}
					</div>
				</div>

				<!-- Filters & Actions Section -->
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<!-- Published Status Filter -->
						<Select.Root type="single" bind:value={publishedFilter}>
							<Select.Trigger class="w-full sm:w-[150px]">
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
								<Select.Trigger class="w-full sm:w-[160px]">
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
					<div class="flex items-center gap-2">
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
										class="h-8 cursor-pointer px-3"
									>
										<RefreshCcw
											class={`h-4 w-4 ${refreshAction ? 'animate-spin-clockwise' : ''}`}
										/>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Refresh Blogs</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>

						<!-- Search Input -->
						<div class="relative">
							<Input
								bind:value={searchQuery}
								class="w-full py-1 pr-8 sm:w-64"
								placeholder="Search posts..."
							/>
							{#if searchQuery}
								<Button
									variant="ghost"
									size="icon"
									onclick={clearSearch}
									class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer"
								>
									<X class="h-3 w-3" />
								</Button>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Content -->
			{#if query.loading}
				<div class="space-y-3">
					{#each Array(5) as _}
						<div class="rounded-xl border border-border/50 dark:border-white/10 bg-card p-4 shadow-sm">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-3">
									<div class="flex items-start gap-4">
										<Skeleton class="h-20 w-32 flex-shrink-0 rounded-lg" />
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
								<div class="flex gap-1">
									<Skeleton class="h-8 w-8 rounded-lg" />
									<Skeleton class="h-8 w-8 rounded-lg" />
									<Skeleton class="h-8 w-8 rounded-lg" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if filteredBlogs().length === 0}
				<!-- Empty State -->
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
						<FileText class="h-8 w-8 text-muted-foreground" />
					</div>
					<p class="mb-2 text-lg font-medium text-foreground">No blogs found</p>
					{#if hasActiveFilters}
						<p class="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
						<Button variant="outline" onclick={clearAllFilters} class="cursor-pointer gap-2">
							<RefreshCcw class="h-4 w-4" />
							Clear Filters
						</Button>
					{:else}
						<p class="text-sm text-muted-foreground mb-4">Start by creating your first blog post</p>
						<Button
							variant="default"
							onclick={() => (creatingBlog = true)}
							class="cursor-pointer gap-2"
						>
							<Plus class="h-4 w-4" />
							Create Blog
						</Button>
					{/if}
				</div>
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
{/if}

<!-- Add Blog Dialog -->
<AddBlogDialog bind:open={creatingBlog} onSuccess={refresh} />