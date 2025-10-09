<script lang="ts">
 import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
 import { Button } from "$lib/components/ui/button/index.js";
 import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
 import { Pencil, Trash } from "lucide-svelte";
 
 let { id, username }: { id: string, username:string } = $props();

 function handleEdit() {
    console.log("Edit user:", id);
    // Your edit logic here
  }

  function handleDelete() {
    console.log("Delete user:", id);
    // Your delete logic here
  }
</script>
 
<DropdownMenu.Root>
 <DropdownMenu.Trigger>
  {#snippet child({ props })}
   <Button
    {...props}
    variant="ghost"
    size="icon"
    class="relative size-8 p-0"
   >
    <span class="sr-only">Open menu</span>
    <EllipsisIcon />
   </Button>
  {/snippet}
 </DropdownMenu.Trigger>
 <DropdownMenu.Content>
    <DropdownMenu.Item onclick={handleEdit}>
      <Pencil class="mr-2 h-4 w-4" />
      Edit Permisions
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={handleDelete}>
      <Trash class="mr-2 h-4 w-4" />
      Delete User
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>