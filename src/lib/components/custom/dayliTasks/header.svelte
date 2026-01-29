<script lang="ts">

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
</script>

<header class="w-full p-4">
    <div class="relative glass-card rounded-2xl p-6 overflow-hidden backdrop-blur-xl">
        
        <!-- Glassy gradient background -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-card/80 to-secondary/30 -z-10"></div>
        
        <!-- Ambient glow effect -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl -z-10"></div>
        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-chart-2/20 rounded-full blur-3xl -z-10"></div>

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            
            <div class="space-y-1">
                <p class="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Τρέχουσα Αποστολή
                </p>
                <h1 class="text-3xl font-bold text-primary uppercase tracking-tight glow-text">
                    Καθημερινές Εργασίες
                </h1>
                <div class="flex items-center gap-2 text-muted-foreground font-medium">
                    <span class="text-sm">{today}</span>
                </div>
            </div>

            <div class="flex-1 max-w-md w-full space-y-2">
                <div class="flex justify-between items-end">
                    <span class="text-sm font-semibold uppercase text-foreground">
                        Πρόοδος
                    </span>
                    <span class="text-2xl font-bold text-primary glow-text">
                        {completedTasks}<span class="text-muted-foreground text-lg">/{totalTasks}</span>
                    </span>
                </div>

                <div class="h-6 w-full bg-muted/50 backdrop-blur-sm rounded-full relative overflow-hidden shadow-inner">
                    <!-- Progress bar with gradient -->
                    <div 
                        class="h-full bg-gradient-to-r from-primary via-primary to-chart-7 transition-all duration-500 ease-out flex items-center justify-end pr-3 rounded-full shadow-lg relative"
                        style="width: {progressPercentage}%"
                    >
                        <!-- Shimmer effect -->
                        <div class="absolute inset-0 shimmer"></div>
                        
                        {#if progressPercentage > 15}
                            <span class="text-[10px] font-bold text-primary-foreground uppercase relative z-10">
                                {progressPercentage}%
                            </span>
                        {/if}
                    </div>
                </div>
                
                <p class="text-[10px] uppercase text-right font-semibold text-muted-foreground tracking-widest">
                    {progressPercentage === 100 ? "✨ Αποστολή Ολοκληρώθηκε!" : "Συνέχισε δυνατά"}
                </p>
            </div>
        </div>
    </div>
</header>

<style>
    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.1),
            0 2px 8px 0 rgba(0, 0, 0, 0.05),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    }

    .glow-text {
        text-shadow: 0 0 20px rgba(212, 165, 116, 0.3);
    }

    .shimmer {
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
        );
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    :global(.dark) .glass-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
</style>