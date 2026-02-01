<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import { ChevronLeft, ChevronRight, Calendar } from 'lucide-svelte';

    // Matches your exact data structure
    interface ScheduleOverview {
        idx: number;
        id: number;
        org_id: number;
        week_start_date: string; // "2026-02-09"
        week_end_date: string;
        year: number;
        status: string;
    }

    interface Props {
        schedules: ScheduleOverview[];
        currentYear: number;
        onYearChange: (year: number) => void;
        onWeekClick: (scheduleId: number) => void;
        onEmptyWeekClick: (weekStart: string) => void;
    }

    let { schedules, currentYear, onYearChange, onWeekClick, onEmptyWeekClick }: Props = $props();

    const monthNames = [
        'Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν',
        'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'
    ];

    // FIX: Helper to format date as YYYY-MM-DD using LOCAL time, not UTC.
    // This prevents "2026-02-09" becoming "2026-02-08" due to timezone.
    function toLocalDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let weeksInYear = $derived.by(() => {
        const weeks = [];

        // Find first Monday of the year
        const firstDay = new Date(currentYear, 0, 1);
        const firstMonday = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const diff = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
        firstMonday.setDate(firstDay.getDate() + diff);

        // Generate all weeks
        let weekStart = new Date(firstMonday);
        let weekNum = 1;

        while (weekStart.getFullYear() <= currentYear && weekNum <= 53) {
            // FIX: Use the local date string helper
            const weekStartStr = toLocalDateString(weekStart);
            
            // FIX: Direct string comparison (Your data "2026-02-09" === Generated "2026-02-09")
            const schedule = schedules.find((s) => s.week_start_date === weekStartStr);

            weeks.push({
                weekNum,
                startDate: new Date(weekStart),
                month: weekStart.getMonth(),
                hasSchedule: !!schedule,
                scheduleId: schedule?.id,
                status: schedule?.status
            });

            weekStart.setDate(weekStart.getDate() + 7);
            weekNum++;

            if (weekStart.getFullYear() > currentYear && weekStart.getMonth() > 0) break;
        }

        return weeks;
    });

    let weeksByMonth = $derived.by(() => {
        const grouped: Map<number, typeof weeksInYear> = new Map();
        for (const week of weeksInYear) {
            if (!grouped.has(week.month)) grouped.set(week.month, []);
            grouped.get(week.month)!.push(week);
        }
        return grouped;
    });

    let currentWeek = $derived.by(() => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const days = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    });

    let isCurrentYear = $derived(currentYear === new Date().getFullYear());

    function getStatusColor(status?: string): string {
        switch (status) {
            case 'published': return 'bg-emerald-500';
            case 'draft': return 'bg-amber-500';
            case 'archived': return 'bg-zinc-500';
            default: return 'bg-primary';
        }
    }

    function handleWeekClick(week: (typeof weeksInYear)[0]) {
        if (week.hasSchedule && week.scheduleId) {
            onWeekClick(week.scheduleId);
        } else {
            // Pass the local string back up
            onEmptyWeekClick(toLocalDateString(week.startDate));
        }
    }

    function formatWeekDate(date: Date): string {
        return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
    }
</script>

<div
    class="animate-in fade-in slide-in-from-top-4 rounded-xl border border-border bg-card p-4 shadow-sm duration-500 dark:border-white/5 dark:bg-card dark:shadow-none"
>
    <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-semibold text-foreground">Ημερολόγιο Προγραμμάτων</span>
        </div>

        <div class="flex items-center gap-1">
            <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-foreground" onclick={() => onYearChange(currentYear - 1)}>
                <ChevronLeft class="h-4 w-4" />
            </Button>
            <span class="min-w-[60px] text-center text-sm font-bold text-foreground">{currentYear}</span>
            <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-foreground" onclick={() => onYearChange(currentYear + 1)}>
                <ChevronRight class="h-4 w-4" />
            </Button>
        </div>
    </div>

    <div class="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-12">
        {#each Array(12) as _, monthIndex}
            {@const monthWeeks = weeksByMonth.get(monthIndex) ?? []}
            <div class="space-y-1.5">
                <span class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {monthNames[monthIndex]}
                </span>
                <div class="flex flex-wrap gap-1">
                    {#each monthWeeks as week (week.weekNum)}
                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <button
                                        type="button"
                                        onclick={() => handleWeekClick(week)}
                                        class="group relative flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 
                                        {week.hasSchedule ? 'hover:scale-110' : 'hover:bg-muted'} 
                                        {isCurrentYear && week.weekNum === currentWeek ? 'ring-1 ring-primary' : ''}"
                                    >
                                        {#if week.hasSchedule}
                                            <span class="h-2.5 w-2.5 rounded-full transition-transform duration-200 group-hover:scale-125 {getStatusColor(week.status)}"></span>
                                        {:else}
                                            <span class="h-2 w-2 rounded-full border border-dashed border-muted-foreground/30 bg-transparent transition-all duration-200 group-hover:border-primary/50"></span>
                                        {/if}
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="top">
                                    <div class="text-xs">
                                        <p class="font-semibold">Εβδομάδα {week.weekNum}</p>
                                        <p class="text-muted-foreground">{formatWeekDate(week.startDate)}</p>
                                        <p class="mt-1 {week.hasSchedule ? 'text-primary' : 'text-muted-foreground'}">
                                            {week.hasSchedule ? 'Κλικ για επεξεργασία' : 'Κλικ για δημιουργία'}
                                        </p>
                                    </div>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <div class="mt-4 flex items-center justify-center gap-4 border-t border-border pt-3">
        <div class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-[10px] text-muted-foreground">Δημοσιευμένο</span>
        </div>
        <div class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span class="text-[10px] text-muted-foreground">Πρόχειρο</span>
        </div>
        <div class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-zinc-500"></span>
            <span class="text-[10px] text-muted-foreground">Αρχείο</span>
        </div>
        <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full border border-dashed border-muted-foreground/40"></span>
            <span class="text-[10px] text-muted-foreground">Κενό</span>
        </div>
    </div>
</div>