<script lang="ts">
  import type { Blog } from "$lib/models/database.types.js";
  import BlogCard from "$lib/components/custom/Blog/blogCard.svelte";
  import * as Pagination from "$lib/components/ui/pagination";

  let { data } = $props();
  let blogs = $derived(data.blogs as Blog[]);
  let page = $state(1);
  const perPage = 6;

  let paginatedBlogs = $derived(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return blogs.slice(start, end);
  });
</script>

<div class="min-h-screen bg-white">
  <main class="container mx-auto px-4 md:px-6 pt-8 pb-20">
    <div class="mb-12">
      <h1 class="text-4xl font-mono tracking-wider text-neutral-800">Our Blog</h1>
      <p class="text-sm text-[#8B6B4A]">Stay updated with our latest news and stories.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each paginatedBlogs() as blog (blog.id)}
        <BlogCard {blog} />
      {/each}
    </div>

    <div class="mt-12 flex justify-center">
      <Pagination.Root count={blogs.length} bind:page {perPage}>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.PrevButton />
          </Pagination.Item>
          {#each Array(Math.ceil(blogs.length / perPage)) as _, i}
            <Pagination.Item>
              <Pagination.Link page={{ value: i + 1, type: "page" }} isActive={page === i + 1} />
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