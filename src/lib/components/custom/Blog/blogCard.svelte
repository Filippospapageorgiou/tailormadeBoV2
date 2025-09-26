<script lang="ts">
  import { goto } from "$app/navigation";
	import Badge from "$lib/components/ui/badge/badge.svelte";

  let { blog } = $props();

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

  function truncateText(text: string | null | undefined, maxLength: number = 120) {
    if (!text || typeof text !== "string") return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
</script>

<div
  role="button"
  tabindex="0"
  onclick={() => goto(`/app/blog/${blog.id}`)}
  onkeydown={(e) => e.key === "Enter" && goto(`/app/blog/${blog.id}`)}
  class="group flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden cursor-pointer"
>
  <div class="aspect-video w-full overflow-hidden">
    <img
      src={blog.images?.[0]}
      alt={blog.title}
      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  </div>
  <div class="p-4 flex flex-col flex-grow">
    <h2 class="text-lg font-medium text-neutral-800 tracking-wide mb-2">{blog.title}</h2>
    {#if blog.content}
      <p class="text-sm text-neutral-600 line-clamp-3">{truncateText(blog.content)}</p>
    {/if}

    <div class="mt-auto pt-4">
      <div class="flex items-center">
        <img
          src={blog.profile.image_url}
          alt={blog.profile.username}
          class="w-8 h-8 rounded-full object-cover mr-3"
        />
        <div>
          <p class="text-sm font-medium text-neutral-800">{blog.profile.username}</p>
          <p class="text-xs text-neutral-600">{formatDate(blog.created_at)}</p>
        </div>
      </div>
      
      <div class="mt-4 flex flex-wrap gap-2">
        {#if blog.tags && blog.tags.length}
          {#each blog.tags.slice(0,3) as tag}
            <Badge variant={"secondary"} class="text-[#8B6B4A]" >#{tag}</Badge>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>