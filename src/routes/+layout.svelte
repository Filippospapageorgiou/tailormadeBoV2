<script lang="ts">
  import "../app.css"
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
	import CustomAlert from "$lib/components/custom/customAlert.svelte";
  let { data, children } = $props()
  let { session, supabase } = $derived(data)
  
  let favicon = '/logo.png'

  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth')
      }
    })
    return () => data.subscription.unsubscribe()
  })
</script>

<svelte:head>
	<link rel="logo" href={favicon} />
</svelte:head>

<CustomAlert />
{@render children?.()}
