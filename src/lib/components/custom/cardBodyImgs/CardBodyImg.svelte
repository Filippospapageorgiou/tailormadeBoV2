<script>
  import Button from "$lib/components/ui/button/button.svelte";
  import { cn } from "$lib/utils";
  
  let className = "";
  export { className as class };
  
  let card = {
    title: "Οι συντάγες μας.",
    desc: "Μέλετησε της συντάγες μας για να είσαι πάντα προετοιμάσμενος για το επόμενο ρόφημα.",
  };
</script>

<div class={cn("px-3 sm:px-4 lg:px-6 text-gray-100 py-3 sm:py-4 lg:py-6 text-left", className)}>
  <h3 class="text-lg sm:text-xl lg:text-2xl font-bold tracking-tighter mb-3 sm:mb-4">
    {card.title}
  </h3>
  
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
    <p class="text-sm sm:text-base lg:text-lg leading-relaxed sm:leading-6 lg:leading-7 flex-1 max-w-none sm:max-w-md lg:max-w-lg">
      {card.desc}
    </p>
    
    <div class="flex-shrink-0">
      <Button 
        variant="secondary" 
        class="w-full sm:w-auto px-6 py-2 text-sm sm:text-base font-medium"
      >
        Δες όλες →
      </Button>
    </div>
  </div>
</div>