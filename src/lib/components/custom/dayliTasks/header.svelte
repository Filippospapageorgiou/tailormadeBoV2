<script lang="ts">
    import { CalendarDays, CircleCheck, ListTodo } from 'lucide-svelte';

    let {
        tasks,
        totalTasks,
        completedTasks,
        progressPercentage
    } = $props();

    const today = new Date().toLocaleDateString('el-GR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const remaining = $derived(totalTasks - completedTasks);
</script>

<header class="w-full px-4 pt-4 pb-1">
    <div class="header-card rounded-xl border border-border/50 bg-background/80 backdrop-blur-md px-5 py-4">

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <!-- Left: Title & date -->
            <div class="flex items-center gap-3.5">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <ListTodo class="w-5 h-5" />
                </div>
                <div>
                    <h1 class="text-lg font-semibold text-foreground tracking-tight leading-tight">
                        Καθημερινές Εργασίες
                    </h1>
                    <div class="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                        <CalendarDays class="w-3 h-3" />
                        <span class="text-xs capitalize">{today}</span>
                    </div>
                </div>
            </div>

            <!-- Right: Progress -->
            <div class="flex items-center gap-4">

                <!-- Progress bar -->
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-28 sm:w-36">
                        <div class="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                style="width: {progressPercentage}%"
                            ></div>
                        </div>
                    </div>
                    <span class="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                        {progressPercentage}%
                    </span>
                </div>

                <!-- Divider -->
                <div class="h-6 w-px bg-border/60 hidden sm:block"></div>

                <!-- Counter pill -->
                <div class="flex items-center gap-1.5 text-sm shrink-0">
                    <CircleCheck class="w-4 h-4 text-primary" />
                    <span class="font-semibold text-foreground tabular-nums">{completedTasks}</span>
                    <span class="text-muted-foreground">/</span>
                    <span class="text-muted-foreground tabular-nums">{totalTasks}</span>
                </div>
            </div>
        </div>

        <!-- Remaining tasks hint — only when tasks are left -->
        {#if remaining > 0 && remaining <= 3}
            <p class="text-[11px] text-muted-foreground/70 mt-2.5 text-right">
                {remaining === 1 ? 'Απομένει 1 εργασία' : `Απομένουν ${remaining} εργασίες`}
            </p>
        {/if}
    </div>
</header>

<style>
    .header-card {
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
    }
</style>