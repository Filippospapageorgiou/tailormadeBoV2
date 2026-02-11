<script lang="ts">
 
 import { toggleMode } from "mode-watcher";
 import { Button } from "$lib/components/ui/button/index.js";
	import Sun from "$lib/animated/icons/sun.svelte";
	import Moon from "$lib/animated/icons/moon.svelte";
</script>
 
<Button onclick={toggleMode} variant="ghost" size="icon">
 <Sun
    size={36}
  class="scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
 />
 <Moon
    size={36}
  class="absolute scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
 />
 <span class="sr-only">Toggle theme</span>
</Button>