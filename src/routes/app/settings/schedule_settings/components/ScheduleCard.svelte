<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import {
        Calendar,
        Pencil,
        Trash2,
        Users,
        Copy,
        Sun,
        Sunset,
        Moon,
        MoreHorizontal,
        Clock
    } from 'lucide-svelte';
    import { SCHEDULE_STATUS } from '$lib/models/schedule.types';
    import type { ScheduleWithMetrics } from '../data.remote';

    interface Props {
        schedule: ScheduleWithMetrics;
        onEdit: (scheduleId: number) => void;
        onDelete: (schedule: ScheduleWithMetrics) => void;
        onPreview: (scheduleId: number) => void;
        onStatusChange: (scheduleId: number, status: string) => void;
        onCopy?: (schedule: ScheduleWithMetrics) => void;
        index?: number;
    }

    let { schedule, onEdit, onDelete, onPreview, onStatusChange, onCopy, index = 0 }: Props = $props();

    let isChangingStatus = $state(false);

    // Get status badge styling (Updated for Light/Dark Contrast)
    function getStatusBadge(status: string) {
        switch (status) {
            case SCHEDULE_STATUS.DRAFT:
                return {
                    label: 'Πρόχειρο',
                    class: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
                };
            case SCHEDULE_STATUS.PUBLISHED:
                return {
                    label: 'Δημοσιευμένο',
                    class: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                };
            case SCHEDULE_STATUS.ARCHIVED:
                return {
                    label: 'Αρχειοθετημένο',
                    class: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30'
                };
            default:
                return { label: status, class: 'bg-muted text-muted-foreground' };
        }
    }

    // Format date for display in Greek
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
    }

    function formatDateLong(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Get week number
    function getWeekNumber(dateString: string): number {
        const date = new Date(dateString);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    }

    let statusBadge = $derived(getStatusBadge(schedule.status));
    let weekNumber = $derived(getWeekNumber(schedule.week_start_date));

    // Status options for dropdown
    const statusOptions = [
        { value: SCHEDULE_STATUS.DRAFT, label: 'Πρόχειρο' },
        { value: SCHEDULE_STATUS.PUBLISHED, label: 'Δημοσιευμένο' },
        { value: SCHEDULE_STATUS.ARCHIVED, label: 'Αρχειοθετημένο' }
    ];

    async function handleStatusChange(newStatus: string) {
        if (newStatus === schedule.status) return;
        isChangingStatus = true;
        await onStatusChange(schedule.id, newStatus);
        isChangingStatus = false;
    }

    // Animation delay based on index
    let animationDelay = $derived(`${index * 50}ms`);
</script>

<div
    class="animate-in fade-in slide-in-from-bottom-4 duration-500"
    style="animation-delay: {animationDelay};"
>
    <Card.Card
        class="group relative overflow-hidden border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent dark:hover:shadow-black/20"
    >
        <div
            class="absolute top-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary via-primary/70 to-transparent transition-all duration-500 group-hover:w-full"
        ></div>

        <div
            class="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-primary/5"
        ></div>

        <Card.CardHeader class="pb-3">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-muted-foreground">Εβδομάδα {weekNumber}</span>
                        <span class="text-muted-foreground/50">·</span>
                        <span class="text-xs text-muted-foreground">{schedule.year}</span>
                    </div>

                    <Card.CardTitle class="text-lg font-bold tracking-tight">
                        {formatDate(schedule.week_start_date)} - {formatDate(schedule.week_end_date)}
                    </Card.CardTitle>
                </div>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="ghost" size="sm" class="h-auto p-0 hover:bg-transparent">
                            <Badge
                                variant="outline"
                                class="{statusBadge.class} cursor-pointer border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-105 hover:brightness-95 dark:hover:brightness-110"
                            >
                                {statusBadge.label}
                            </Badge>
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Label class="text-xs">Αλλαγή κατάστασης</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        {#each statusOptions as option}
                            <DropdownMenu.Item
                                onclick={() => handleStatusChange(option.value)}
                                disabled={isChangingStatus || option.value === schedule.status}
                                class="cursor-pointer text-sm"
                            >
                                {option.label}
                                {#if option.value === schedule.status}
                                    <span class="ml-auto text-xs text-muted-foreground">(τρέχον)</span>
                                {/if}
                            </DropdownMenu.Item>
                        {/each}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        </Card.CardHeader>

        <Card.CardContent class="space-y-4">
            <div class="flex items-center gap-4">
                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div class="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-transparent px-2.5 py-1.5 transition-colors group-hover:border-border/50 dark:bg-white/5">
                                <Users class="h-3.5 w-3.5 text-primary/80" />
                                <span class="text-sm font-semibold">{schedule.employee_count}</span>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p class="text-xs">{schedule.employee_count} εργαζόμενοι</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>

                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div class="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-transparent px-2.5 py-1.5 transition-colors group-hover:border-border/50 dark:bg-white/5">
                                <Clock class="h-3.5 w-3.5 text-muted-foreground" />
                                <span class="text-sm font-semibold">{schedule.shift_count}</span>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p class="text-xs">{schedule.shift_count} βάρδιες συνολικά</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>
            </div>

            {#if schedule.shift_count > 0}
                <div class="flex items-center gap-2">
                    {#if schedule.morning_shifts > 0}
                        <div
                            class="flex items-center gap-1 rounded-md px-2 py-1"
                            style="background: var(--shift-morning-bg);"
                        >
                            <Sun class="h-3 w-3" style="color: var(--shift-morning);" />
                            <span class="text-xs font-medium" style="color: var(--shift-morning);">
                                {schedule.morning_shifts}
                            </span>
                        </div>
                    {/if}
                    {#if schedule.afternoon_shifts > 0}
                        <div
                            class="flex items-center gap-1 rounded-md px-2 py-1"
                            style="background: var(--shift-afternoon-bg);"
                        >
                            <Sunset class="h-3 w-3" style="color: var(--shift-afternoon);" />
                            <span class="text-xs font-medium" style="color: var(--shift-afternoon);">
                                {schedule.afternoon_shifts}
                            </span>
                        </div>
                    {/if}
                    {#if schedule.evening_shifts > 0}
                        <div
                            class="flex items-center gap-1 rounded-md px-2 py-1"
                            style="background: var(--shift-evening-bg);"
                        >
                            <Moon class="h-3 w-3" style="color: var(--shift-evening);" />
                            <span class="text-xs font-medium" style="color: var(--shift-evening);">
                                {schedule.evening_shifts}
                            </span>
                        </div>
                    {/if}
                </div>
            {:else}
                <p class="text-xs text-muted-foreground italic">Δεν υπάρχουν βάρδιες</p>
            {/if}

            <div class="flex items-center gap-2 pt-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => onEdit(schedule.id)}
                    class="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                    <Pencil class="h-3.5 w-3.5" />
                    Επεξεργασία
                </Button>

                <Tooltip.Provider>
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                onclick={() => onCopy?.(schedule)}
                                class="h-9 w-9 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Copy class="h-4 w-4" />
                            </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                            <p class="text-xs">Αντιγραφή προγράμματος</p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                </Tooltip.Provider>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-9 w-9 text-muted-foreground transition-all duration-200 hover:bg-secondary dark:hover:bg-white/10"
                        >
                            <MoreHorizontal class="h-4 w-4" />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Item
                            onclick={() => onDelete(schedule)}
                            class="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                            <Trash2 class="h-4 w-4" />
                            <span>Διαγραφή</span>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>
        </Card.CardContent>
    </Card.Card>
</div>