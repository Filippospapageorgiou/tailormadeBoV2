<script lang="ts">
  import type { PageData } from "./$types";
  import type { Blog } from "$lib/models/database.types";
  import { goto } from "$app/navigation";

  let { data }: { data: PageData } = $props();
  const { blog } = $derived(data) as { blog: Blog };

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "";
    }
  }
</script>

{#if blog}
  <div class="min-h-screen bg-white">
    <main class="container mx-auto px-4 md:px-6 pt-8 pb-20">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-mono tracking-wider text-neutral-800">{blog.title}</h1>
          {#if blog.description}
            <p class="text-neutral-600 mt-2 text-lg">{blog.description}</p>
          {/if}
          <div class="mt-4 flex items-center">
            <img
              src={blog.profile.image_url}
              alt={blog.profile.username}
              class="w-10 h-10 rounded-full object-cover mr-4"
            />
            <div>
              <p class="text-base font-medium text-neutral-800">{blog.profile.username}</p>
              <p class="text-sm text-neutral-600">{formatDate(blog.created_at)}</p>
            </div>
          </div>
        </div>

        <div class="prose lg:prose-xl max-w-none">
          {@html blog.content}
        </div>

        <div class="flex justify-center mt-12">
          <button
            onclick={() => goto("/app/blog")}
            class="inline-flex items-center px-6 py-2 text-sm font-medium text-[#8B6B4A] bg-white cursor-pointer border border-[#8B6B4A] rounded-lg hover:bg-[#8B6B4A] hover:text-white transition-colors duration-300"
          >
            Back to Blog
          </button>
        </div>
      </div>
    </main>
  </div>
{/if}