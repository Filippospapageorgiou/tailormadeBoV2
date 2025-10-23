<script lang="ts">
	import { goto } from "$app/navigation";

    let {children} = $props();
</script>

<button onclick={()=>{goto("/app/recipes/")}}>
<div
  class="rounded-2xl relative aspect-video overflow-hidden group cursor-pointer">
  <img
    src="/drink.jpg"
    placeholder="blur"
    alt="don corleone"
    class="w-full object-cover object-center m-0 transition-all duration-300 ease-out group-hover:scale-110"
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
</button>