<script lang="ts">
	import {
		Search,
		Calendar,
		Clock,
		UserCircle,
		Check,
		Plus,
		ListChecks,
		Users,
		LayoutTemplate,
		PencilIcon,
		Trash2,
		Loader2, // Added for the spinner
		Trash,
		Trash2Icon,

		Camera,

		X


	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { TaskTemplateWithTasks } from '$lib/models/tasks.types';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { deleteTaskTemplate, getAllTemplatesTask } from '../data.remote';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Spinner } from '$lib/components/ui/spinner';
	import { toast } from 'svelte-sonner';
	import * as Modal from '$lib/components/ui/modal';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { addTaskTemplateWithTasks } from '../data.remote';

	let { taskTemplatesWithTasks }: { taskTemplatesWithTasks: TaskTemplateWithTasks[] } = $props();

	// State for Dialog and Loading
	let openDeleteDialogTemplate = $state<boolean>(false);
	let isDeleting = $state<boolean>(false);
	let templateToDelete = $state<string | null>(null);

	function confirmDelete(id: string) {
		templateToDelete = id;
		openDeleteDialogTemplate = true;
	}

	async function handleDeleteTemplate() {
		if (!templateToDelete) return;

		isDeleting = true;
		try {
			await deleteTaskTemplate({ id: templateToDelete }).updates(getAllTemplatesTask());
			openDeleteDialogTemplate = false;
			toast.success('Το προτύπων διαγραφθήκε με επιτυχία');
		} catch (err) {
			console.error('Delete failed:', err);
			toast.error('Σφάλμα κάτα την διαγραφή');
		} finally {
			isDeleting = false;
			templateToDelete = null;
		}
	}

	let openAddTemplateTask = $state<boolean>(false);
	let isUpdating = $state(false);
	let openEditTemplateTask = $state<boolean>(false);

	let ItemTasks = [
		{
			id:1,
			title:'Clean machine',
			description:'Quick',
			requires_photo:true,
			estimated_minutes:10
		},
		{
			id:2,
			title:'Clean machine',
			description:'Quick',
			requires_photo:true,
			estimated_minutes:10
		},
		{
			id:3,
			title:'Clean machine',
			description:'Quick',
			requires_photo:true,
			estimated_minutes:10
		}
	]
</script>

<div class="animate-fade-in-left space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Πρότυπα εργασιών</h2>
			<p class="text-sm text-muted-foreground">Δημιουργία και διαχείριση προτύπων εργασιών</p>
		</div>
		<Button
			onclick={() => {
				openAddTemplateTask = true;
			}}
		>
			<Plus class="mr-2 h-4 w-4" />
			Νέο πρότυπο
		</Button>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each taskTemplatesWithTasks as template (template.id)}
			{@const totalTime = template.task_items.reduce(
				(acc, task) => acc + (task.estimated_minutes || 0),
				0
			)}
			<Card class="flex h-full flex-col rounded-2xl bg-white hover:shadow-md">
				<CardHeader>
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<CardTitle class="truncate text-base">{template.name}</CardTitle>
							<CardDescription class="line-clamp-2 min-h-[2.5rem]">
								{template.description}
							</CardDescription>
						</div>
						{#if template.is_active}
							<Badge
								class="flex items-center justify-center gap-2 border-none bg-green-600/10 text-green-600"
							>
								<span class="size-1.5 rounded-full bg-green-600" aria-hidden="true"></span>
								Ενεργό
							</Badge>
						{:else}
							<Badge
								class="flex items-center justify-center gap-2 border-none bg-destructive/10 text-destructive"
							>
								<!-- svelte-ignore element_invalid_self_closing_tag -->
								<span class="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
								Ανενεργό
							</Badge>
						{/if}
					</div>
				</CardHeader>

				<CardContent class="flex flex-1 flex-col justify-between space-y-4">
					<div class="flex items-center gap-4 text-sm text-muted-foreground">
						<div class="flex items-center gap-1">
							<ListChecks class="h-4 w-4" />
							<span>{template.task_items.length} εργασίες</span>
						</div>
						<div class="flex items-center gap-1">
							<Clock class="h-4 w-4" />
							<span>{totalTime}λ</span>
						</div>
					</div>

					<div class="mt-auto flex gap-2">
						<Button
							onclick={() => {
								openEditTemplateTask = true;
							}}
							variant="secondary"
							size="sm"
							class="flex-1 cursor-pointer"
						>
							<PencilIcon class="mr-2 h-3 w-3" />
							Επεξεργασία
						</Button>
						<Button
							onclick={() => confirmDelete(template.id)}
							variant="outline"
							size="sm"
							class="cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground"
						>
							<Trash2Icon class="h-3 w-3" />
						</Button>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	{#if taskTemplatesWithTasks.length === 0}
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12">
				<div class="mb-4 rounded-full bg-muted p-3">
					<LayoutTemplate class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="mb-1 font-medium text-foreground">Δεν υπάρχουν ακόμη πρότυπα</h3>
				<p class="mb-4 text-center text-sm text-muted-foreground">
					Δημιουργήστε το πρώτο σας πρότυπο εργασίας για να ξεκινήσετε
				</p>
				<Button
					onclick={() => {
						openAddTemplateTask = true;
					}}
				>
					<Plus class="mr-2 h-4 w-4" />
					Δημιουργία προτύπου
				</Button>
			</CardContent>
		</Card>
	{/if}
</div>

<Dialog.Root bind:open={openDeleteDialogTemplate}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Διαγραφή προτύπου</Dialog.Title>
			<Dialog.Description>
				Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρότυπο; Αυτή η ενέργεια δεν μπορεί να
				αναιρεθεί.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex gap-2 sm:justify-end">
			<Button
				variant="outline"
				onclick={() => (openDeleteDialogTemplate = false)}
				disabled={isDeleting}
			>
				Ακύρωση
			</Button>
			<Button variant="destructive" onclick={handleDeleteTemplate} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner />
					Διαγραφή...
				{:else}
					Διαγραφή
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Modal.Root bind:open={openAddTemplateTask}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header
			><Modal.Title>Δημιουργία νέου προτύπου</Modal.Title>
			<Modal.Description>Ορίστε ένα νέο πρότυπο εργασίας</Modal.Description>
		</Modal.Header>
		<ScrollArea class="h-[65dvh] w-full">
			<form
				class="space-y-6 py-4"
				{...addTaskTemplateWithTasks.enhance(async ({ form, data, submit }) => {
					isUpdating = true;
					await submit();
					if (addTaskTemplateWithTasks.result?.success) {
						toast.success('Επιτυχής δημιουργία');
					} else {
						toast.error('Αποτυχία προσθήκης προσπάθησε πάλι');
					}
					form.reset();
					isUpdating = false;
					openAddTemplateTask = false;
				})}
			>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="template-name">Όνομα προτύπου</Label>
						<Input id="template-name" name="name" placeholder="e.g., Morning Site Inspection" />
					</div>

					<div class="space-y-2">
						<Label for="template-description">Περιγραφή</Label>
						<Textarea
							name="description"
							id="template-description"
							placeholder="Brief description of this template"
							rows={2}
						/>
					</div>

					<div class="flex items-center justify-between">
						<Label for="template-active">Ενεργό πρότυπο</Label>
						<Switch id="template-active" name="is_active" />
					</div>
				</div>
				<div class="flex items-center justify-between">
					<Label class="text-base">Εργασίες (1)</Label>
				</div>
				<div class="space-y-3">
					{#each ItemTasks as task, index (task.id)}
						<div class="flex gap-3 rounded-lg border border-border p-3">
							<div
								class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
							>
								{index + 1}
							</div>
							<div class="min-w-0 flex-1">
								<h4 class="text-sm font-medium text-foreground">{task.title}</h4>
								{#if task.description}
									<p class="mt-1 text-xs text-muted-foreground">{task.description}</p>
								{/if}
								<div class="mt-2 flex items-center gap-2">
									{#if task.requires_photo}
										<Badge variant="outline" class="text-xs">
											<Camera class="mr-1 h-3 w-3" />
											Photo
										</Badge>
									{/if}
									{#if task.estimated_minutes > 0}
										<Badge variant="secondary" class="text-xs">{task.estimated_minutes}μ</Badge>
									{/if}
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="shrink-0 text-destructive hover:text-destructive"
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					{/each}
				</div>
				<div class="w-full space-y-2">
					<Card class="border border-dashed border-primary bg-muted/50">
						<CardContent class="space-y-3 pt-4">
							<div class="space-y-2">
								<Input placeholder="Task title" />
								<Textarea placeholder="Task description (optional)" rows={2} />
								<div class="grid grid-cols-2 gap-2">
									<div class="flex items-center space-x-2">
										<Switch id="requires-photo" />
										<Label for="requires-photo" class="text-sm">Απαιτειταί φοτωγραφία</Label>
									</div>
									<div class="space-y-1">
										<Label for="estimated-minutes" class="text-sm">Λέπτα</Label>
										<Input id="estimated-minutes" type="number" min="0" />
									</div>
								</div>
							</div>
							<Button variant="outline" class="w-full bg-transparent" size="sm">
								<Plus class="mr-2 h-4 w-4" />
								Add Task
							</Button>
						</CardContent>
					</Card>
				</div>
				<Modal.Footer class="py-2">
					<Button type="submit" disabled={isUpdating}>
						{#if isUpdating}
							<Spinner /> Προσθήκη...
						{:else}
							Προσθήκη προτύπου
						{/if}
					</Button>
					<Button
						variant="outline"
						disabled={isUpdating}
						onclick={() => {
							openAddTemplateTask = false;
						}}
					>
						Κλείσιμο
					</Button>
				</Modal.Footer>
			</form>
		</ScrollArea>
	</Modal.Content>
</Modal.Root>

<Modal.Root bind:open={openEditTemplateTask}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header
			><Modal.Title>Επεξεργασία προτύπου</Modal.Title>
			<Modal.Description
				>Επεξεργασία προτύπου για αλλάγες και ενημέρωση τωβ εργασιών</Modal.Description
			>
		</Modal.Header>
		<form
			class="space-y-6 py-4"
			{...addTaskTemplateWithTasks.enhance(async ({ form, data, submit }) => {
				isUpdating = true;
				await submit();
				if (addTaskTemplateWithTasks.result?.success) {
					toast.success('Επιτυχής δημιουργία');
				} else {
					toast.error('Αποτυχία προσθήκης προσπάθησε πάλι');
				}
				form.reset();
				isUpdating = false;
				openAddTemplateTask = false;
			})}
		>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="template-name">Όνομα προτύπου</Label>
					<Input id="template-name" name="name" placeholder="e.g., Morning Site Inspection" />
				</div>

				<div class="space-y-2">
					<Label for="template-description">Περιγραφή</Label>
					<Textarea
						name="description"
						id="template-description"
						placeholder="Brief description of this template"
						rows={2}
					/>
				</div>

				<div class="flex items-center justify-between">
					<Label for="template-active">Ενεργό πρότυπο</Label>
					<Switch id="template-active" name="is_active" />
				</div>
			</div>
			<Modal.Footer class="py-2">
				<Button type="submit" disabled={isUpdating}>
					{#if isUpdating}
						<Spinner /> Προσθήκη...
					{:else}
						Προσθήκη προτύπου
					{/if}
				</Button>
				<Button
					variant="outline"
					onclick={() => {
						openEditTemplateTask = false;
					}}
				>
					Κλείσιμο
				</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>
