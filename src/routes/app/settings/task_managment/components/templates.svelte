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
		Loader2,
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
	import type { TaskItem, TaskTemplateWithTasks } from '$lib/models/tasks.types';
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
	import { addTaskTemplateWithTasks, updateTemplateWithTasks } from '../data.remote';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { string } from 'zod';

	let { taskTemplatesWithTasks }: { taskTemplatesWithTasks: TaskTemplateWithTasks[] } = $props();

	// State for Dialog and Loading
	let addIsActive = $state(false);
	let editIsActive = $state(false);
	let openDeleteDialogTemplate = $state<boolean>(false);
	let isDeleting = $state<boolean>(false);
	let templateToDelete = $state<string | null>(null);
	let openAddTemplateTask = $state<boolean>(false);
	let isUpdating = $state(false);
	let openEditTemplateTask = $state<boolean>(false);

	function toggleAddRequiresPhoto(index: number) {
		const current = addValues.task_items[index].requires_photo === 'true';
		addValues.task_items[index].requires_photo = String(!current);
	}

	// For EDIT form - toggle requires_photo
	function toggleEditRequiresPhoto(index: number) {
		const current = editValues.task_items[index].requires_photo === 'true';
		editValues.task_items[index].requires_photo = String(!current);
	}

	// SEPARATE state for ADD form
	let addValues = $state({
		name: '',
		description: '',
		is_active: 'false', // Sync boolean state
		task_items: [] as any[]
	});

	// SEPARATE state for EDIT form
	let editValues = $state({
		id: '',
		name: '',
		description: '',
		is_active: 'false',
		task_items: [] as any[]
	});

	// Sync ADD form
	$effect(() => {
		if (addTaskTemplateWithTasks?.fields) {
			addTaskTemplateWithTasks.fields.set(addValues);
		}
	});

	// Sync EDIT form
	$effect(() => {
		if (updateTemplateWithTasks?.fields) {
			updateTemplateWithTasks.fields.set(editValues);
		}
	});

	function openEditDialog(templateTask: TaskTemplateWithTasks) {
		editValues = {
			id: templateTask.id,
			name: templateTask.name || '',
			description: templateTask.description || '',
			is_active: String(templateTask.is_active),
			task_items: templateTask.task_items.map((t) => ({
				id: t.id,
				title: t.title,
				description: t.description || '',
				scheduled_time: t.scheduled_time,
				estimated_minutes: String(t.estimated_minutes ?? 0),
				position: String(t.position ?? 0),
				requires_photo: String(t.requires_photo)
			}))
		};
		editIsActive = templateTask.is_active;
		openEditTemplateTask = true;
	}

	function closeEditDialog() {
		openEditTemplateTask = false;
		// Reset edit form
		editValues = {
			id: '',
			name: '',
			description: '',
			is_active: String(false),
			task_items: []
		};
	}

	function closeAddDialog() {
		openAddTemplateTask = false;
		addValues = {
			name: '',
			description: '',
			is_active: String(false),
			task_items: []
		};
	}

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

	// ADD form: add task
	function addTaskItemToAdd() {
		addValues.task_items.push({
			id: crypto.randomUUID(),
			title: '',
			description: '',
			estimated_minutes: '0',
			scheduled_time: '00:00:00',
			position: String(addValues.task_items.length),
			requires_photo: String(false)
		});
	}

	// ADD form: remove task
	function removeTaskItemFromAdd(index: number) {
		addValues.task_items.splice(index, 1);
	}

	// EDIT form: add task
	function addTaskItemToEdit() {
		editValues.task_items.push({
			id: crypto.randomUUID(),
			title: '',
			description: '',
			estimated_minutes: '0',
			scheduled_time: '00:00:00',
			position: String(editValues.task_items.length),
			requires_photo: String(false)
		});
	}

	// EDIT form: remove task
	function removeTaskItemFromEdit(index: number) {
		editValues.task_items.splice(index, 1);
	}
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
							onclick={() => openEditDialog(template)}
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

<!-- ADD TEMPLATE MODAL -->
<Modal.Root bind:open={openAddTemplateTask}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Δημιουργία νέου προτύπου</Modal.Title>
			<Modal.Description>Ορίστε ένα νέο πρότυπο εργασίας</Modal.Description>
		</Modal.Header>
		<ScrollArea class="h-[65dvh] w-full">
			<form
				class="space-y-6 py-4"
				{...addTaskTemplateWithTasks.enhance(async ({ form, submit }) => {
					isUpdating = true;
					await submit();

					if (addTaskTemplateWithTasks.result?.success) {
						toast.success('Επιτυχής δημιουργία');
						form.reset();
						closeAddDialog();
					} else {
						toast.error('Αποτυχία προσθήκης προσπάθησε πάλι');
					}
					isUpdating = false;
				})}
			>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="template-name">Όνομα προτύπου</Label>
						<Input
							id="template-name"
							{...addTaskTemplateWithTasks.fields.name.as('text')}
							placeholder="e.g., Morning Site Inspection"
						/>
					</div>

					<div class="space-y-2">
						<Label for="template-description">Περιγραφή</Label>
						<Textarea
							{...addTaskTemplateWithTasks.fields.description.as('text')}
							id="template-description"
							placeholder="Brief description of this template"
							rows={2}
						/>
					</div>
					<div class="flex items-center justify-between">
						<Label for="template-active">Ενεργό πρότυπο</Label>
						<Switch id="template-active" bind:checked={addIsActive} class="cursor-pointer" />
						<input
							type="hidden"
							{...addTaskTemplateWithTasks.fields.is_active.as('text')}
							value={addIsActive.toString()}
						/>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<Label class="text-base">Εργασίες ({addValues.task_items.length})</Label>
				</div>

				<div class="space-y-3">
					{#each addValues.task_items as _, index}
						<div class="flex flex-col gap-3 rounded-lg border border-border p-3">
							<div class="flex items-center justify-between">
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
								>
									{index + 1}
								</div>
								<Button
									variant="ghost"
									size="sm"
									type="button"
									onclick={() => removeTaskItemFromAdd(index)}
									class="text-destructive"
								>
									<X class="h-4 w-4" />
								</Button>
							</div>

							<div class="space-y-2">
								<Input
									{...addTaskTemplateWithTasks.fields.task_items[index].title.as('text')}
									placeholder="Τίτλος εργασίας"
								/>

								<Textarea
									{...addTaskTemplateWithTasks.fields.task_items[index].description.as('text')}
									placeholder="Περιγραφή (προαιρετικά)"
									rows={2}
								/>

								<div class="grid grid-cols-2 gap-2">
									<div class="space-y-1">
										<Input
											{...addTaskTemplateWithTasks.fields.task_items[index].estimated_minutes.as(
												'text'
											)}
											type="number"
											placeholder="Λεπτά"
										/>
									</div>
									<Input
										{...addTaskTemplateWithTasks.fields.task_items[index].scheduled_time.as('time')}
										type="time"
										step="1"
									/>
								</div>
								<div class="flex items-center justify-between">
									<Label for="template-active">Απαιτείται φοτωγραφία</Label>
									<Switch
										id="add-photo-{index}"
										checked={addValues.task_items[index].requires_photo === 'true'}
										onCheckedChange={() => toggleAddRequiresPhoto(index)}
										class="cursor-pointer"
									/>
									<input
										type="hidden"
										{...addTaskTemplateWithTasks.fields.task_items[index].requires_photo.as('text')}
										value={addValues.task_items[index].requires_photo}
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<Button
					type="button"
					variant="outline"
					class="w-full border-dashed border-primary bg-muted/50"
					onclick={addTaskItemToAdd}
				>
					<Plus class="mr-2 h-4 w-4" />
					Προσθήκη Εργασίας
				</Button>

				<Modal.Footer class="py-2">
					<Button type="submit" disabled={isUpdating}>
						{#if isUpdating}
							<Spinner /> Προσθήκη...
						{:else}
							Προσθήκη προτύπου
						{/if}
					</Button>
					<Button variant="outline" type="button" onclick={closeAddDialog}>Κλείσιμο</Button>
				</Modal.Footer>
			</form>
		</ScrollArea>
	</Modal.Content>
</Modal.Root>

<!-- EDIT TEMPLATE MODAL -->
<Modal.Root bind:open={openEditTemplateTask}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Επεξεργασία προτύπου</Modal.Title>
			<Modal.Description
				>Επεξεργασία προτύπου για αλλαγές και ενημέρωση των εργασιών</Modal.Description
			>
		</Modal.Header>
		<ScrollArea class="h-[65dvh] w-full">
			<form
				class="space-y-6 py-4"
				{...updateTemplateWithTasks.enhance(async ({ submit }) => {
					isUpdating = true;
					await submit().updates(getAllTemplatesTask());

					if (updateTemplateWithTasks.result?.success) {
						toast.success('Το πρότυπο ενημερώθηκε');
						closeEditDialog();
					} else {
						toast.error('Αποτυχία ενημέρωσης');
					}
					isUpdating = false;
				})}
			>
				<input type="hidden" {...updateTemplateWithTasks.fields.id.as('text')} />

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="edit-name">Όνομα προτύπου</Label>
						<Input id="edit-name" {...updateTemplateWithTasks.fields.name.as('text')} />
					</div>

					<div class="space-y-2">
						<Label for="edit-desc">Περιγραφή</Label>
						<Textarea
							id="edit-desc"
							{...updateTemplateWithTasks.fields.description.as('text')}
							rows={2}
						/>
					</div>
					<div class="flex items-center justify-between">
						<Label for="template-active">Ενεργό πρότυπο</Label>
						<Switch id="template-active" bind:checked={editIsActive} class="cursor-pointer" />
						<input
							type="hidden"
							{...updateTemplateWithTasks.fields.is_active.as('text')}
							value={editIsActive.toString()}
						/>
					</div>
				</div>

				<Label class="text-base">Εργασίες ({editValues.task_items.length})</Label>

				<div class="space-y-3">
					{#each editValues.task_items as _, index}
						<div class="flex flex-col gap-3 rounded-lg border border-border p-3">
							<input
								type="hidden"
								{...updateTemplateWithTasks.fields.task_items[index].id.as('text')}
							/>

							<div class="flex items-center justify-between">
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
								>
									{index + 1}
								</div>
								<Button
									variant="ghost"
									size="sm"
									type="button"
									onclick={() => removeTaskItemFromEdit(index)}
									class="text-destructive"
								>
									<X class="h-4 w-4" />
								</Button>
							</div>

							<div class="space-y-2">
								<Input {...updateTemplateWithTasks.fields.task_items[index].title.as('text')} />
								<Textarea
									{...updateTemplateWithTasks.fields.task_items[index].description.as('text')}
									rows={2}
								/>
								<div class="grid grid-cols-2 gap-2">
									<Input
										{...updateTemplateWithTasks.fields.task_items[index].estimated_minutes.as(
											'text'
										)}
										type="number"
										placeholder="Λεπτά"
									/>
									<Input
										{...updateTemplateWithTasks.fields.task_items[index].scheduled_time.as('time')}
										type="time"
										step="1"
									/>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<Label for="edit-photo-{index}">Απαιτείται φωτογραφία</Label>
								<Switch
									id="edit-photo-{index}"
									checked={editValues.task_items[index].requires_photo === 'true'}
									onCheckedChange={() => toggleEditRequiresPhoto(index)}
									class="cursor-pointer"
								/>
								<input
									type="hidden"
									{...updateTemplateWithTasks.fields.task_items[index].requires_photo.as('text')}
									value={editValues.task_items[index].requires_photo}
								/>
							</div>
						</div>
					{/each}
				</div>

				<Button
					type="button"
					variant="outline"
					class="w-full border-dashed border-primary bg-muted/50"
					onclick={addTaskItemToEdit}
				>
					<Plus class="mr-2 h-4 w-4" /> Προσθήκη Εργασίας
				</Button>

				<Modal.Footer class="py-2">
					<Button type="submit" disabled={isUpdating}>
						{#if isUpdating}
							<Spinner /> Ενημέρωση...
						{:else}
							Αποθήκευση αλλαγών
						{/if}
					</Button>
					<Button variant="outline" type="button" onclick={closeEditDialog}>Κλείσιμο</Button>
				</Modal.Footer>
			</form>
		</ScrollArea>
	</Modal.Content>
</Modal.Root>
