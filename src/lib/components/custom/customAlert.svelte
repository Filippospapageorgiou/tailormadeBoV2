<script lang="ts">
    import * as Alert from "$lib/components/ui/alert/index.js";
    import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import { toast } from "$lib/stores/toast.svelte";
    
    let timeoutId: ReturnType<typeof setTimeout>;
    let isExiting = $state(false);

    $effect(() => {
        if (toast.show) {
            isExiting = false;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                isExiting = true;
                setTimeout(() => {
                    toast.show = false;
                }, 300); // Match this to your animation duration
            }, 2000);
        }
    });

    $effect(() => {
        return () => {
            clearTimeout(timeoutId);
        };
    });
</script>

{#if toast.show}
    <div 
        class="z-[52] fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 {isExiting ? 'animate-fade-out-up' : 'animate-fade-in-down'}"
    >
        {#if toast.status}
            <Alert.Root class="shadow-lg border-green-200 bg-green-50">
                <CheckCircle2Icon class="text-green-600" />
                <Alert.Title class="text-green-800">{toast.title}</Alert.Title>
                <Alert.Description class="text-green-700">{toast.text}</Alert.Description>
            </Alert.Root>
        {:else}
            <Alert.Root variant="destructive" class="shadow-lg">
                <AlertCircleIcon class="size-4" />
                <Alert.Title>{toast.title}</Alert.Title>
                <Alert.Description>{toast.text}</Alert.Description>
            </Alert.Root>
        {/if}
    </div>
{/if}