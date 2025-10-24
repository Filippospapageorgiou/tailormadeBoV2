<script lang="ts">
	import AuthBlock from "$lib/components/custom/AuthBlock/authBlock.svelte";
	import { showFailToast, showSuccessToast } from "$lib/stores/toast.svelte";
    import { authenticatedAccess, checkRegisterToday } from "./data.remote";

    let auth = authenticatedAccess();
    let query = checkRegisterToday();

    let hasAccess = $derived(auth.current?.hasAccess);
    let authMessage = $derived(auth.current?.message || " ");

    let checkRegister = $derived(query?.current?.hasRegisterToday);
    let date = $derived(query?.current?.date);

    $effect(() => {
        if(hasAccess){
            showSuccessToast('Επιτυχία',authMessage);
        }else{
            showFailToast('Fail',authMessage);
        }
    })

</script>

{#if auth.loading}
    <AuthBlock />
{/if}


