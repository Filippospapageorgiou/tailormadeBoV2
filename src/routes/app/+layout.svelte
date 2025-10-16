<script lang="ts">
  import { page } from '$app/state';
  import CustomAlert from "$lib/components/custom/customAlert.svelte";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { setProfileContext } from '$lib/stores/profile.svelte.js';
  
  let { data,children } = $props()
  
  let profile = $derived(data.profile || null);  

  // svelte-ignore state_referenced_locally
  setProfileContext(profile);

  $effect(() => {
    profile = data.profile || null;
  });
  
  let breadcrumbs = $derived(() => {
    const pathSegments = page.url.pathname.split('/').filter(Boolean);
    let cumulativePath = '';
    return pathSegments.map(segment => {
      cumulativePath += `/${segment}`;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { name, href: cumulativePath };
    });
  });

</script>


<Sidebar.Provider>
  <AppSidebar/>
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2">
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        
        <Breadcrumb.Root>
          <Breadcrumb.List>  
            {#if breadcrumbs().length > 0}
              <Breadcrumb.Separator />
            {/if}

            {#each breadcrumbs() as segment, i}
              <Breadcrumb.Item>
                {#if i === breadcrumbs().length - 1}
                  <Breadcrumb.Page>{segment.name}</Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link href={segment.href}>{segment.name}</Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
              {#if i < breadcrumbs().length - 1}
                <Breadcrumb.Separator />
              {/if}
            {/each}
          </Breadcrumb.List>
        </Breadcrumb.Root>
        </div>
    </header>
    {@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>