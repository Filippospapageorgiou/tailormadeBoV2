<script lang="ts">
  import { cn } from "$lib/utils";
  
  let className = "";
  export { className as class };
  
  let card = {
    title: "Οι συντάγες μας.",
    desc: "Μέλετησε της συντάγες μας για να είσαι πάντα προετοιμάσμενος για το επόμενο ρόφημα.",
  };
</script>

<div class={cn("px-3 [text-shadow:0_2px_4px_rgb(0_0_0_/_0.5)] sm:px-4 lg:px-6 text-gray-200 py-3 sm:py-4 lg:py-6 text-left", className)}>
  <h3 class="text-lg sm:text-xl lg:text-2xl font-bold tracking-tighter mb-3 sm:mb-4">
    {card.title}
  </h3>
  
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
    <p class="text-sm sm:text-base lg:text-lg leading-relaxed sm:leading-6 lg:leading-7 flex-1 max-w-none sm:max-w-md lg:max-w-lg">
      {card.desc}
    </p>
  </div>
</div>