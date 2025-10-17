<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Trash2, Plus, Calendar, Pencil } from "lucide-svelte";
    import { getSchedules, createSchedule, deleteSchedule } from "./data.remote";
    import { goto } from "$app/navigation";
    import { SCHEDULE_STATUS } from "$lib/models/schedule.types";
    import type { WeeklySchedule } from "$lib/models/schedule.types";
    import { SvelteDate } from "svelte/reactivity";
    import { showFailToast, showSuccessToast } from "$lib/stores/toast.svelte";
    import { Spinner } from "$lib/components/ui/spinner";

    // Fetch schedules
    let schedulesQuery = $state(getSchedules());

    // Modal state
    let isCreateModalOpen = $state(false);
    let isDeleteModalOpen = $state(false);
    let scheduleToDelete = $state<WeeklySchedule | null>(null);

    // Form state
    let formData = $state({
        week_start_date: "",
        week_end_date: "",
        year: new Date().getFullYear()
    });

    // Loading state
    let isCreating = $state(false);
    let isDeleting = $state(false);

    // Get status badge variant and label
    function getStatusBadge(status: string) {
        switch (status) {
            case SCHEDULE_STATUS.DRAFT:
                return { variant: "secondary" as const, label: "Draft" };
            case SCHEDULE_STATUS.PUBLISHED:
                return { variant: "default" as const, label: "Published" };
            case SCHEDULE_STATUS.ARCHIVED:
                return { variant: "outline" as const, label: "Archived" };
            default:
                return { variant: "secondary" as const, label: status };
        }
    }

    // Format date for display
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Handle create schedule
    async function handleCreateSchedule() {
        if (!formData.week_start_date || !formData.week_end_date) {
            return;
        }

        isCreating = true;
        try {
            const result = await createSchedule({
                week_start_date: formData.week_start_date,
                week_end_date: formData.week_end_date,
                year: formData.year
            });

            if (result.success && result.schedule) {
                // Close modal and reset form
                isCreateModalOpen = false;
                formData = {
                    week_start_date: "",
                    week_end_date: "",
                    year: new Date().getFullYear()
                };

                schedulesQuery.refresh();

                // Navigate to the new schedule
                goto(`/app/settings/schedule_settings/${result.schedule.id}`);
            }
        } finally {
            isCreating = false;
        }
    }

    // Handle delete schedule
    async function handleDeleteSchedule() {
        if (!scheduleToDelete) return;

        isDeleting = true;
        try {
            const result = await deleteSchedule({ scheduleId: scheduleToDelete.id });

            if (result.success) {
                isDeleteModalOpen = false;
                scheduleToDelete = null;
                showSuccessToast('Success', result.message);
                schedulesQuery.refresh();
            }else{
                showFailToast('Fail',result.message);
            }
        } finally {
            isDeleting = false;
        }
    }

    // Auto-calculate week end date (6 days after start)
    $effect(() => {
        if (formData.week_start_date) {
            const startDate = new SvelteDate(formData.week_start_date);
            const endDate = new SvelteDate(startDate);
            endDate.setDate(startDate.getDate() + 6);
            formData.week_end_date = endDate.toISOString().split('T')[0];
            formData.year = startDate.getFullYear();
        }
    });
</script>

<svelte:boundary>
    {#snippet pending()}
        <div class="flex items-center justify-center h-64">
            <p class="text-muted-foreground">Loading schedules...</p>
        </div>
    {/snippet}

    <div class="container mx-auto py-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold">Schedule Management</h1>
                <p class="text-muted-foreground">Create and manage weekly schedules for your team</p>
            </div>
            <Button onclick={() => isCreateModalOpen = true}>
                <Plus class="mr-2 h-4 w-4" />
                Create Schedule
            </Button>
        </div>

        <!-- Schedules Grid -->
        {#await schedulesQuery then result}
            {#if result.success && result.schedules.length > 0}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {#each result.schedules as schedule (schedule.id)}
                        <Card class="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <CardTitle class="text-lg">
                                            Week of {formatDate(schedule.week_start_date)}
                                        </CardTitle>
                                        <CardDescription>
                                            {formatDate(schedule.week_start_date)} - {formatDate(schedule.week_end_date)}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={getStatusBadge(schedule.status).variant}>
                                        {getStatusBadge(schedule.status).label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div class="flex items-center gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        class="flex-1"
                                        onclick={() => goto(`/app/settings/schedule_settings/${schedule.id}`)}
                                    >
                                        <Pencil class="mr-2 h-4 w-4" />
                                        Edit Schedule
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onclick={() => {
                                            scheduleToDelete = schedule;
                                            isDeleteModalOpen = true;
                                        }}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    {/each}
                </div>
            {:else}
                <Card>
                    <CardContent class="flex flex-col items-center justify-center py-12">
                        <Calendar class="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 class="text-lg font-semibold mb-2">No schedules yet</h3>
                        <p class="text-muted-foreground mb-4">Create your first weekly schedule to get started</p>
                        <Button onclick={() => isCreateModalOpen = true}>
                            <Plus class="mr-2 h-4 w-4" />
                            Create Schedule
                        </Button>
                    </CardContent>
                </Card>
            {/if}
        {/await}
    </div>

    <!-- Create Schedule Modal -->
    <Dialog bind:open={isCreateModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>
                    Select the week start date. The week will automatically span 7 days.
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4 py-4">
                <div class="space-y-2">
                    <Label for="week_start_date">Week Start Date</Label>
                    <Input
                        id="week_start_date"
                        type="date"
                        bind:value={formData.week_start_date}
                        required
                    />
                </div>

                <div class="space-y-2">
                    <Label for="week_end_date">Week End Date</Label>
                    <Input
                        id="week_end_date"
                        type="date"
                        bind:value={formData.week_end_date}
                        disabled
                    />
                    <p class="text-sm text-muted-foreground">
                        Automatically calculated as 6 days after start date
                    </p>
                </div>

                <div class="space-y-2">
                    <Label for="year">Year</Label>
                    <Input
                        id="year"
                        type="number"
                        bind:value={formData.year}
                        disabled
                    />
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => {
                        isCreateModalOpen = false;
                        formData = {
                            week_start_date: "",
                            week_end_date: "",
                            year: new Date().getFullYear()
                        };
                    }}
                    disabled={isCreating}
                >
                    Cancel
                </Button>
                <Button
                    onclick={handleCreateSchedule}
                    disabled={isCreating || !formData.week_start_date}
                >
                    {#if isCreating}
                        <Spinner />
                        is creating...
                    {:else}
                        create
                    {/if}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog bind:open={isDeleteModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Schedule</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this schedule? This will also delete all shifts associated with it. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>

            {#if scheduleToDelete}
                <div class="py-4">
                    <p class="font-medium">
                        Week of {formatDate(scheduleToDelete.week_start_date)}
                    </p>
                    <p class="text-sm text-muted-foreground">
                        {formatDate(scheduleToDelete.week_start_date)} - {formatDate(scheduleToDelete.week_end_date)}
                    </p>
                </div>
            {/if}

            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => {
                        isDeleteModalOpen = false;
                        scheduleToDelete = null;
                    }}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onclick={handleDeleteSchedule}
                    disabled={isDeleting}
                >
                    {#if isDeleting}
                        <Spinner />
                        is deleting...
                    {:else}
                        delete scedule
                    {/if}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</svelte:boundary>
