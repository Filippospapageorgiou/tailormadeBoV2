<script lang="ts">
    import { progress } from '$lib/stores/progress.svelte';
    import { Progress } from '$lib/components/ui/progress';
</script>

{#if progress.show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-lg text-center">
            <p class="mb-4 text-lg font-semibold">{progress.text}</p>
            <Progress value={progress.progress} />
        </div>
    </div>
{/if}
