<script lang="ts">
    import type { Shift } from '$lib/models/schedule.types';
    import { SHIFT_TYPE } from '$lib/models/schedule.types';
    import { Clock } from 'lucide-svelte';

    interface Props {
        shift: Shift;
        badgeColor: string;
        onClick?: () => void;
    }

    const { shift, badgeColor, onClick }: Props = $props();

    function formatTime(time: string | null): string {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    }

    function getShiftTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            work: 'Εργασία',
            day_off: 'Ρεπό',
            sick_leave: 'Άρρωστος',
            vacation: 'Άδεια'
        };
        return labels[type] || type;
    }

    let isWorkShift = $derived(shift.shift_type === SHIFT_TYPE.WORK);
</script>

<button
    type="button"
    onclick={onClick}
    class="group relative w-full cursor-pointer transition-transform duration-200 active:scale-95"
    aria-label={`Shift for ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
>
    <div
        class="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg border border-white/30 backdrop-blur-md transition-all duration-300 group-hover:border-white/60 group-hover:shadow-lg group-hover:shadow-white/5"
        style="background-color: {badgeColor}50;" 
    >
        <div class="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-transparent dark:from-white/20 pointer-events-none"></div>

        <div class="absolute inset-0 bg-white/5 pointer-events-none"></div>

        <div class="relative z-10 flex items-center gap-2 px-3">
            {#if isWorkShift}
                <Clock class="h-3.5 w-3.5 text-foreground/70 group-hover:text-foreground transition-colors" />
                <span class="text-sm font-medium font-sans tracking-tight text-foreground whitespace-nowrap">
                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </span>
            {:else}
                <span class="text-[11px] font-medium font-sans uppercase tracking-wider">
                    {getShiftTypeLabel(shift.shift_type)}
                </span>
            {/if}
        </div>

        <div 
            class="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20 pointer-events-none"
            style="background-color: {badgeColor};"
        ></div>
    </div>
</button>