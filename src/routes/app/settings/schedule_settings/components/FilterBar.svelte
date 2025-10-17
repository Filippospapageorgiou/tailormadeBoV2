<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import { RefreshCcw, X, Plus } from "lucide-svelte";
    import { SCHEDULE_STATUS } from "$lib/models/schedule.types";

    interface Props {
        statusFilter: string;
        yearFilter: string;
        searchQuery: string;
        isRefreshing: boolean;
        availableYears: number[];
        onStatusChange: (value: string) => void;
        onYearChange: (value: string) => void;
        onSearchChange: (value: string) => void;
        onRefresh: () => void;
        onClearFilters: () => void;
        onCreate: () => void;
    }

    let {
        statusFilter,
        yearFilter,
        searchQuery,
        isRefreshing,
        availableYears,
        onStatusChange,
        onYearChange,
        onSearchChange,
        onRefresh,
        onClearFilters,
        onCreate
    }: Props = $props();

    // Derive if filters are active
    let hasActiveFilters = $derived(
        statusFilter !== '' || yearFilter !== '' || searchQuery !== ''
    );

    // Status options
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: SCHEDULE_STATUS.DRAFT, label: 'Draft' },
        { value: SCHEDULE_STATUS.PUBLISHED, label: 'Published' },
        { value: SCHEDULE_STATUS.ARCHIVED, label: 'Archived' }
    ];

    // Year options
    let yearOptions = $derived([
        { value: '', label: 'All Years' },
        ...availableYears.map(year => ({ value: String(year), label: String(year) }))
    ]);

    // Get current label for selects
    let statusLabel = $derived(
        statusOptions.find(opt => opt.value === statusFilter)?.label ?? 'All Status'
    );

    let yearLabel = $derived(
        yearOptions.find(opt => opt.value === yearFilter)?.label ?? 'All Years'
    );
</script>

<div class="space-y-4">
    <!-- Top Row: Create Button & Refresh -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <Button onclick={onCreate}>
                <Plus class="mr-2 h-4 w-4" />
                Create Schedule
            </Button>
        </div>

        <Button
            variant="outline"
            size="sm"
            onclick={onRefresh}
            disabled={isRefreshing}
        >
            <RefreshCcw class={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin-clockwise' : ''}`} />
            Refresh
        </Button>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <!-- Status Filter -->
        <Select.Root type="single" name="statusFilter" value={statusFilter} onValueChange={onStatusChange}>
            <Select.Trigger class="w-full sm:w-[180px]">
                {statusLabel}
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.Label>Status</Select.Label>
                    {#each statusOptions as option}
                        <Select.Item value={option.value} label={option.label}>
                            {option.label}
                        </Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>

        <!-- Year Filter -->
        <Select.Root type="single" name="yearFilter" value={yearFilter} onValueChange={onYearChange}>
            <Select.Trigger class="w-full sm:w-[180px]">
                {yearLabel}
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.Label>Year</Select.Label>
                    {#each yearOptions as option}
                        <Select.Item value={option.value} label={option.label}>
                            {option.label}
                        </Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>

        <!-- Search Input -->
        <div class="relative flex-1">
            <Input
                bind:value={searchQuery}
                oninput={(e) => onSearchChange(e.currentTarget.value)}
                placeholder="Search schedules..."
                class="w-full pr-8"
            />
            {#if searchQuery}
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => onSearchChange('')}
                    class="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                >
                    <X class="h-3 w-3" />
                </Button>
            {/if}
        </div>

        <!-- Clear Filters Button -->
        {#if hasActiveFilters}
            <Button
                variant="outline"
                size="sm"
                onclick={onClearFilters}
                class="whitespace-nowrap"
            >
                <X class="mr-2 h-3 w-3" />
                Clear Filters
            </Button>
        {/if}
    </div>

    <!-- Active Filters Display -->
    {#if hasActiveFilters}
        <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-muted-foreground">Active filters:</span>
            {#if statusFilter}
                <div class="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                    <span>Status: {statusLabel}</span>
                    <button
                        onclick={() => onStatusChange('')}
                        class="ml-1 hover:text-destructive"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/if}
            {#if yearFilter}
                <div class="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                    <span>Year: {yearLabel}</span>
                    <button
                        onclick={() => onYearChange('')}
                        class="ml-1 hover:text-destructive"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/if}
            {#if searchQuery}
                <div class="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
                    <span>Search: "{searchQuery}"</span>
                    <button
                        onclick={() => onSearchChange('')}
                        class="ml-1 hover:text-destructive"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>