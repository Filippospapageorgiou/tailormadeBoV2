<script lang="ts">
    let {children} = $props();
</script>

<div class="rounded-2xl relative aspect-video overflow-hidden group">
  <img
    src="/drink.jpg"
    placeholder="blur"
    alt="don corleone"
    class="w-full object-cover object-center m-0"
  />
  <div
    class="absolute inset-0 from-stone-900/90 via-stone-900/60 to-stone-900/5 bg-gradient-to-t backdrop-blur-[2px] transition-all duration-300"
  ></div>
  {#if children}
    {@render children()}
  {:else}
    <p>Fallback</p>
  {/if}
</div>