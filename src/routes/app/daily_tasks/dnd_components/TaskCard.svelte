<script lang="ts">
    import { useSortable } from "@dnd-kit-svelte/svelte/sortable";

    // Props we receive - following YOUR example structure
    let { task, isOverlay = false, id, index, ...rest } = $props();

    // The magic hook that makes this draggable
    const {ref, isDragging} = useSortable({id, index, ...rest});
</script>

<div class="relative select-none" {@attach ref}>
    <!-- Original element - becomes invisible during drag but maintains dimensions -->
    <div class:invisible={isDragging.current && !isOverlay}>
        <div class="glass-task-card p-5 rounded-2xl cursor-grab active:cursor-grabbing">
            <!-- Drag handle -->
            <div class="flex items-start gap-3">
                <div class="text-muted-foreground mt-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
                    </svg>
                </div>

                <div class="flex-1">
                    <!-- Task Title -->
                    <h3 class="font-semibold text-foreground text-lg mb-2 flex items-center gap-2">
                        {#if task.completed}
                            <span class="text-green-500">✓</span>
                        {:else}
                            <span class="text-muted-foreground">○</span>
                        {/if}
                        {task.task_items.title}
                    </h3>
                    
                    <!-- Task Description -->
                    <p class="text-sm text-muted-foreground mb-3">
                        {task.task_items.description}
                    </p>
                    
                    <!-- Badges -->
                    <div class="flex gap-2 items-center flex-wrap">
                        {#if task.task_items.scheduled_time}
                            <span class="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                                ⏰ {task.task_items.scheduled_time.slice(0, 5)}
                            </span>
                        {/if}
                        
                        {#if task.task_items.estimated_minutes > 0}
                            <span class="text-xs bg-chart-2/20 text-chart-2 px-3 py-1 rounded-full font-medium">
                                ⏱️ {task.task_items.estimated_minutes} min
                            </span>
                        {/if}
                        
                        {#if task.task_items.requires_photo}
                            <span class="text-xs bg-blue-500/20 text-blue-600 px-3 py-1 rounded-full font-medium">
                                📷 Photo
                            </span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Drag placeholder - shows in original position while dragging -->
    {#if !isOverlay && isDragging.current}
        <div class="flex items-center justify-center absolute inset-0">
            <div class="w-full h-full bg-primary/10 rounded-2xl border-2 border-primary border-dashed flex items-center justify-center">
                <span class="text-primary font-semibold">Moving: {task.task_items.title}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .glass-task-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .glass-task-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(212, 165, 116, 0.3);
    }
</style>