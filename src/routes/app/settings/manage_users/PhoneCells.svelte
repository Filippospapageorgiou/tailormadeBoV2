<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Modal from '$lib/components/ui/modal';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import {
		Plus,
		RefreshCw,
		Search,
		Phone,
		Mail,
		Building2,
		User,
		Briefcase,
		StickyNote,
		Pencil,
		Trash2,
		PhoneCall,
		Copy,
		Check,
		X,
		Filter,
		ExternalLink
	} from 'lucide-svelte';
	import {
		getAllPhoneContacts,
		addPhoneContact,
		updatePhoneContact,
		deletePhoneContact,
		toggleContactActive
	} from './data.remote';
	import type { importantPhoneCalls } from '$lib/models/database.types';
	import ScrollAreaScrollbar from '$lib/components/ui/scroll-area/scroll-area-scrollbar.svelte';

	// Query
	let contactsQuery = getAllPhoneContacts();
	let contacts = $derived(contactsQuery.current?.contacts ?? []);

	// State
	let searchQuery = $state('');
	let filterActive = $state<string>('all');
	let refreshAction = $state(false);
	let isUpdating = $state(false);
	let copiedField = $state<string | null>(null);

	// Modals
	let addModalOpen = $state(false);
	let editModalOpen = $state(false);
	let deleteModalOpen = $state(false);

	// Form state for add
	let addIsActive = $state(true);

	// Form state for edit
	let editContact = $state<importantPhoneCalls | null>(null);
	let editIsActive = $state(true);

	// Delete state
	let contactToDelete = $state<importantPhoneCalls | null>(null);

	// Filter options
	const filterOptions = [
		{ value: 'all', label: 'Όλες οι επαφές' },
		{ value: 'active', label: 'Ενεργές' },
		{ value: 'inactive', label: 'Ανενεργές' }
	];

	const filterTriggerContent = $derived(
		filterOptions.find((f) => f.value === filterActive)?.label ?? 'Όλες οι επαφές'
	);

	// Filtered contacts
	let filteredContacts = $derived.by(() => {
		let result = contacts;

		if (filterActive === 'active') {
			result = result.filter((c) => c.is_active);
		} else if (filterActive === 'inactive') {
			result = result.filter((c) => !c.is_active);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(c) =>
					c.associated_company.toLowerCase().includes(query) ||
					c.manager_full_name.toLowerCase().includes(query) ||
					c.phone.includes(query) ||
					(c.department && c.department.toLowerCase().includes(query))
			);
		}

		return result;
	});

	async function refresh() {
		refreshAction = true;
		await contactsQuery.refresh();
		refreshAction = false;
	}

	function openEditModal(contact: importantPhoneCalls) {
		editContact = { ...contact };
		editIsActive = contact.is_active;
		editModalOpen = true;
	}

	function openDeleteModal(contact: importantPhoneCalls) {
		contactToDelete = contact;
		deleteModalOpen = true;
	}

	function closeAddModal() {
		addModalOpen = false;
		addIsActive = true;
	}

	function closeEditModal() {
		editModalOpen = false;
		editContact = null;
		editIsActive = true;
	}

	async function handleDelete() {
		if (!contactToDelete) return;

		isUpdating = true;
		const result = await deletePhoneContact({ id: String(contactToDelete.id) });

		if (result.success) {
			toast.success(result.message);
			await refresh();
		} else {
			toast.error(result.message);
		}

		isUpdating = false;
		deleteModalOpen = false;
		contactToDelete = null;
	}

	async function handleToggleActive(contact: importantPhoneCalls) {
		const result = await toggleContactActive({
			id: contact.id,
			is_active: !contact.is_active
		});

		if (result.success) {
			toast.success(result.message);
			await refresh();
		} else {
			toast.error(result.message);
		}
	}

	function copyToClipboard(text: string, fieldId: string) {
		navigator.clipboard.writeText(text);
		copiedField = fieldId;
		toast.success('Αντιγράφηκε');
		setTimeout(() => {
			copiedField = null;
		}, 2000);
	}

	function callPhone(phone: string) {
		window.location.href = `tel:${phone}`;
	}

	function sendEmail(email: string) {
		window.location.href = `mailto:${email}`;
	}
</script>

<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
	<!-- Header Section -->
	<div class="mb-8 space-y-4">
		<div class="flex flex-col gap-2">
			<h3 class="font-mono tracking-wider">
				Διαχείριση σημαντικών τηλεφώνων και επαφών για τους υπαλλήλους
			</h3>
			<p class="text-xs text-muted-foreground">
				Διαθέσιμες επαφές: <span class="font-semibold">{filteredContacts.length}</span> / {contacts.length}
			</p>
		</div>

		<!-- Actions Bar -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<!-- Filter Select -->
			<Select.Root type="single" name="filterStatus" bind:value={filterActive}>
				<Select.Trigger class="w-full sm:w-[180px]">
					{filterTriggerContent}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Κατάσταση</Select.Label>
						{#each filterOptions as option}
							<Select.Item value={option.value}>
								{option.label}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<div class="flex flex-row items-center gap-2">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="default"
								size="sm"
								class="h-6 cursor-pointer gap-2 px-2"
								onclick={() => (addModalOpen = true)}
							>
								<Plus class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Προσθήκη νέας επαφής</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>

				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="secondary"
								size="sm"
								onclick={refresh}
								disabled={refreshAction}
								class="h-6 cursor-pointer px-2 text-xs"
							>
								<RefreshCw
									class="mr-2 h-4 w-4 {refreshAction ? 'animate-spin-clockwise repeat-infinite' : ''}"
								/>
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Ανανέωση λίστας</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>

				<Input
					bind:value={searchQuery}
					class="w-full py-1 pr-8 sm:w-72"
					placeholder="Αναζήτηση επαφών..."
				/>
			</div>
		</div>
	</div>

	<!-- Contacts Grid -->
	{#if contactsQuery.loading}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _, i}
				<div class="animate-pulse rounded-xl border bg-card p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="space-y-2">
							<div class="h-5 w-32 rounded bg-muted"></div>
							<div class="h-4 w-24 rounded bg-muted"></div>
						</div>
						<div class="h-6 w-16 rounded-full bg-muted"></div>
					</div>
					<div class="space-y-3">
						<div class="h-4 w-full rounded bg-muted"></div>
						<div class="h-4 w-3/4 rounded bg-muted"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredContacts.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
			<div class="mb-4 rounded-full bg-muted p-4">
				<Phone class="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 class="mb-1 text-lg font-medium">Δεν βρέθηκαν επαφές</h3>
			<p class="mb-4 text-center text-sm text-muted-foreground">
				{searchQuery ? 'Δοκιμάστε διαφορετικούς όρους αναζήτησης' : 'Προσθέστε την πρώτη σας επαφή'}
			</p>
			{#if !searchQuery}
				<Button onclick={() => (addModalOpen = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Προσθήκη Επαφής
				</Button>
			{/if}
		</div>
	{:else}
    <ScrollArea class="h-135">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredContacts as contact, index (contact.id)}
                <div
					style="animation-delay: {index * 100}ms; animation-fill-mode: backwards;"
					class="group relative animate-fade-in-right cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg
					{!contact.is_active ? 'border-border/40 opacity-70' : 'border-border/60'}"
				>
					<!-- Top Actions Bar -->
					<div class="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
						<div class="flex gap-1">
							<Button
								onclick={() => openEditModal(contact)}
								variant="secondary"
								class="inline-flex h-7 w-7 items-center justify-center rounded-md"
								title="Επεξεργασία"
							>
								<Pencil class="h-3.5 w-3.5" />
							</Button>
							<Button
								onclick={() => openDeleteModal(contact)}
								variant="secondary"
								class="inline-flex h-7 w-7 items-center justify-center rounded-md hover:text-red-600"
								title="Διαγραφή"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						</div>

						<!-- Status Badge -->
						{#if contact.is_active}
							<Badge
								class="flex items-center justify-center gap-2 border-none bg-green-600/10 text-green-600"
							>
								<span
									class="size-1.5 animate-pulse rounded-full bg-green-600 repeat-infinite"
									aria-hidden="true"
								></span>
								Ενεργή
							</Badge>
						{:else}
							<Badge
								class="flex items-center justify-center gap-2 border-none bg-destructive/10 text-destructive"
							>
								<span class="size-1.5 rounded-full bg-destructive" aria-hidden="true"></span>
								Ανενεργή
							</Badge>
						{/if}
					</div>

					<!-- Content -->
					<div class="space-y-4 p-6 pt-14">
						<!-- Company & Manager -->
						<div>
							<h3 class="font-serif text-lg font-medium tracking-wide text-foreground">
								{contact.associated_company}
							</h3>
							<p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
								<User class="h-3.5 w-3.5" />
								{contact.manager_full_name}
							</p>
							{#if contact.department}
								<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
									<Briefcase class="h-3 w-3" />
									{contact.department}
								</p>
							{/if}
						</div>

						<!-- Contact Info -->
						<div class="space-y-2">
							<!-- Phone -->
							<div
								class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 transition-colors hover:bg-muted"
							>
								<button
									class="flex flex-1 items-center gap-2 text-left"
									onclick={() => callPhone(contact.phone)}
								>
									<Phone class="h-4 w-4 text-primary" />
									<span class="font-mono text-sm font-medium">{contact.phone}</span>
								</button>
								<button
									class="rounded p-1 transition-colors hover:bg-background"
									onclick={() => copyToClipboard(contact.phone, `phone-${contact.id}`)}
									title="Αντιγραφή"
								>
									{#if copiedField === `phone-${contact.id}`}
										<Check class="h-3.5 w-3.5 text-green-500" />
									{:else}
										<Copy class="h-3.5 w-3.5 text-muted-foreground" />
									{/if}
								</button>
							</div>

							<!-- Email -->
							<div
								class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 transition-colors hover:bg-muted"
							>
								<button
									class="flex flex-1 items-center gap-2 text-left"
									onclick={() => sendEmail(contact.email)}
								>
									<Mail class="h-4 w-4 text-primary" />
									<span class="truncate text-sm">{contact.email}</span>
								</button>
								<button
									class="rounded p-1 transition-colors hover:bg-background"
									onclick={() => copyToClipboard(contact.email, `email-${contact.id}`)}
									title="Αντιγραφή"
								>
									{#if copiedField === `email-${contact.id}`}
										<Check class="h-3.5 w-3.5 text-green-500" />
									{:else}
										<Copy class="h-3.5 w-3.5 text-muted-foreground" />
									{/if}
								</button>
							</div>
						</div>

						<!-- Notes -->
						{#if contact.notes}
							<div class="rounded-lg border border-dashed bg-muted/30 p-3">
								<p class="flex items-start gap-2 text-xs text-muted-foreground">
									<StickyNote class="mt-0.5 h-3 w-3 shrink-0" />
									<span class="line-clamp-2">{contact.notes}</span>
								</p>
							</div>
						{/if}

						<!-- Footer with Toggle -->
						<div class="flex items-center justify-between border-t pt-4">
							<div class="flex items-center gap-2">
								<Switch
									checked={contact.is_active}
									onCheckedChange={() => handleToggleActive(contact)}
									class="cursor-pointer"
								/>
								<span class="text-xs text-muted-foreground">
									{contact.is_active ? 'Ενεργή' : 'Ανενεργή'}
								</span>
							</div>
							<span class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
								ID: #{contact.id.toString().padStart(4, '0')}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
    </ScrollArea>
	{/if}
</main>

<!-- Add Contact Modal -->
<Modal.Root bind:open={addModalOpen}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Νέα Επαφή</Modal.Title>
			<Modal.Description>Προσθέστε μια νέα σημαντική επαφή για τους υπαλλήλους</Modal.Description>
		</Modal.Header>

		<form
			class="flex flex-col gap-2"
			{...addPhoneContact.enhance(async ({ form, submit }) => {
				isUpdating = true;
				await submit();

				if (addPhoneContact.result?.success) {
					toast.success(addPhoneContact.result.message);
					form.reset();
					closeAddModal();
					await refresh();
				} else {
					toast.error(addPhoneContact.result?.message || 'Σφάλμα κατά την προσθήκη');
				}
				isUpdating = false;
			})}
		>
			<ScrollArea class="h-[50dvh] max-h-[70dvh] w-full px-1">
				<div class="space-y-4 py-2">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="add-company">
								Εταιρεία <span class="text-destructive">*</span>
							</Label>
							<Input
								id="add-company"
								name="associated_company"
								placeholder="π.χ. Coffee Supplies SA"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label for="add-manager">
								Υπεύθυνος
							</Label>
							<Input
								id="add-manager"
								name="manager_full_name"
								placeholder="π.χ. Γιώργος Παπαδόπουλος"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="add-department">Τμήμα</Label>
						<Input id="add-department" name="department" placeholder="π.χ. Πωλήσεις" />
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="add-phone">
								Τηλέφωνο <span class="text-destructive">*</span>
							</Label>
							<Input
								id="add-phone"
								name="phone"
								type="tel"
								placeholder="π.χ. 210 1234567"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label for="add-email">
								Email
							</Label>
							<Input
								id="add-email"
								name="email"
								type="email"
								placeholder="π.χ. info@company.gr"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="add-notes">Σημειώσεις</Label>
						<Textarea id="add-notes" name="notes" placeholder="Επιπλέον πληροφορίες..." rows={3} />
					</div>

					<div class="flex items-center justify-between rounded-lg border p-3">
						<div class="space-y-0.5">
							<Label>Ενεργή επαφή</Label>
							<p class="text-xs text-muted-foreground">
								Οι ενεργές επαφές εμφανίζονται στους υπαλλήλους
							</p>
						</div>
						<Switch bind:checked={addIsActive} class="cursor-pointer" />
						<input type="hidden" name="is_active" value={String(addIsActive)} />
					</div>
				</div>
			</ScrollArea>

			<Modal.Footer class="pt-4">
				<Button type="submit" disabled={isUpdating}>
					{#if isUpdating}
						<Spinner class="mr-2 h-4 w-4" />
						Αποθήκευση...
					{:else}
						Προσθήκη Επαφής
					{/if}
				</Button>
				<Button variant="outline" type="button" onclick={closeAddModal}>Ακύρωση</Button>
			</Modal.Footer>
		</form>
	</Modal.Content>
</Modal.Root>

<!-- Edit Contact Modal -->
<Modal.Root bind:open={editModalOpen}>
	<Modal.Content class="flex h-[85dvh] max-h-[95dvh] flex-col sm:h-auto">
		<Modal.Header>
			<Modal.Title>Επεξεργασία Επαφής</Modal.Title>
			<Modal.Description>Ενημερώστε τα στοιχεία της επαφής</Modal.Description>
		</Modal.Header>

		{#if editContact}
			<form
				class="flex flex-col gap-2"
				{...updatePhoneContact.enhance(async ({ form, submit }) => {
					isUpdating = true;
					await submit();

					if (updatePhoneContact.result?.success) {
						toast.success(updatePhoneContact.result.message);
						closeEditModal();
						await refresh();
                        form.reset();
					} else {
						toast.error(updatePhoneContact.result?.message || 'Σφάλμα κατά την ενημέρωση');
					}
					isUpdating = false;
				})}
			>
				<input type="hidden" name="id" value={String(editContact.id)} />

				<ScrollArea class="h-[50dvh] max-h-[70dvh] w-full px-1">
					<div class="space-y-4 py-2">
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="edit-company">
									Εταιρεία <span class="text-destructive">*</span>
								</Label>
								<Input
									id="edit-company"
									name="associated_company"
									value={editContact.associated_company}
									required
								/>
							</div>

							<div class="space-y-2">
								<Label for="edit-manager">
									Υπεύθυνος
								</Label>
								<Input
									id="edit-manager"
									name="manager_full_name"
									value={editContact.manager_full_name}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="edit-department">Τμήμα</Label>
							<Input id="edit-department" name="department" value={editContact.department || ''} />
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="edit-phone">
									Τηλέφωνο <span class="text-destructive">*</span>
								</Label>
								<Input id="edit-phone" name="phone" type="tel" value={editContact.phone} required />
							</div>

							<div class="space-y-2">
								<Label for="edit-email">
									Email
								</Label>
								<Input
									id="edit-email"
									name="email"
									type="email"
									value={editContact.email}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="edit-notes">Σημειώσεις</Label>
							<Textarea id="edit-notes" name="notes" value={editContact.notes || ''} rows={3} />
						</div>

						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="space-y-0.5">
								<Label>Ενεργή επαφή</Label>
								<p class="text-xs text-muted-foreground">
									Οι ενεργές επαφές εμφανίζονται στους υπαλλήλους
								</p>
							</div>
							<Switch bind:checked={editIsActive} class="cursor-pointer" />
							<input type="hidden" name="is_active" value={String(editIsActive)} />
						</div>
					</div>
				</ScrollArea>

				<Modal.Footer class="pt-4">
					<Button type="submit" disabled={isUpdating}>
						{#if isUpdating}
							<Spinner class="mr-2 h-4 w-4" />
							Αποθήκευση...
						{:else}
							Αποθήκευση Αλλαγών
						{/if}
					</Button>
					<Button variant="outline" type="button" onclick={closeEditModal}>Ακύρωση</Button>
				</Modal.Footer>
			</form>
		{/if}
	</Modal.Content>
</Modal.Root>

<!-- Delete Confirmation Modal -->
<Modal.Root bind:open={deleteModalOpen}>
	<Modal.Content class="sm:max-w-md">
		<Modal.Header>
			<Modal.Title class="flex items-center gap-2 text-destructive">
				<Trash2 class="h-5 w-5" />
				Διαγραφή Επαφής
			</Modal.Title>
			<Modal.Description>
				Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επαφή; Αυτή η ενέργεια δεν μπορεί να
				αναιρεθεί.
			</Modal.Description>
		</Modal.Header>

		{#if contactToDelete}
			<div class="rounded-lg border bg-muted/50 p-4">
				<div class="flex items-start gap-3">
					<div class="rounded-full bg-primary/10 p-2">
						<Building2 class="h-5 w-5 text-primary" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="font-medium">{contactToDelete.associated_company}</p>
						<p class="text-sm text-muted-foreground">{contactToDelete.manager_full_name}</p>
						<p class="font-mono text-sm text-muted-foreground">{contactToDelete.phone}</p>
					</div>
				</div>
			</div>
		{/if}

		<Modal.Footer class="gap-2 pt-4">
			<Button
				variant="outline"
				onclick={() => {
					deleteModalOpen = false;
					contactToDelete = null;
				}}
				disabled={isUpdating}
			>
				Ακύρωση
			</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={isUpdating}>
				{#if isUpdating}
					<Spinner class="mr-2 h-4 w-4" />
					Διαγραφή...
				{:else}
					Διαγραφή Επαφής
				{/if}
			</Button>
		</Modal.Footer>
	</Modal.Content>
</Modal.Root>