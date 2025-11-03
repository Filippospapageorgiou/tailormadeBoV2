<!-- AddSupplierDialog.svelte -->
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { showProgress, hideProgress } from '$lib/stores/progress.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Building2, Plus } from 'lucide-svelte';
	import { createSupplierForm } from '../data.remote'; // Adjust path as needed

	let {
		open = $bindable(),
		onSuccess
	}: {
		open: boolean;
		onSuccess: (supplierName: string) => Promise<void>;
	} = $props();

	let formData = $state({
		name: '',
		afm: '',
		phone: '',
		email: '',
		address: '',
		contact_person: '',
		payment_terms: '',
		notes: ''
	});

	async function handleSuccess(text: string, supplierName: string) {
		await onSuccess(supplierName);
		toast.show = true;
		toast.status = true;
		toast.title = 'Επιτυχία';
		toast.text = text;
	}

	function handleError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Σφάλμα';
		toast.text = text;
	}

	function resetForm() {
		formData = {
			name: '',
			afm: '',
			phone: '',
			email: '',
			address: '',
			contact_person: '',
			payment_terms: '',
			notes: ''
		};
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
		<Dialog.Header>
			<div class="flex items-center gap-2">
				<div class="rounded-full bg-[#8B6B4A]/10 p-2">
					<Building2 class="h-5 w-5 text-[#8B6B4A]" />
				</div>
				<div>
					<Dialog.Title>Προσθήκη Προμηθευτή</Dialog.Title>
					<Dialog.Description>Συμπληρώστε τα στοιχεία του νέου προμηθευτή</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<form
			class="space-y-4 py-4"
			{...createSupplierForm.enhance(async ({ form, submit }) => {
				open = false;
				showProgress('Προσθήκη προμηθευτή....');
				await submit();

				if (createSupplierForm.result?.success) {
					const supplierName = formData.name;
					handleSuccess(
						createSupplierForm.result?.message || 'Επιτυχής προσθήκη προμηθευτή',
						supplierName
					);
					resetForm();
				} else {
					handleError(createSupplierForm.result?.message || 'Παρουσιάστηκε σφάλμα.');
				}
				hideProgress();
				form.reset();
			})}
		>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- Name -->
				<div class="space-y-2 sm:col-span-2">
					<Label for="supplier-name">Όνομα Προμηθευτή *</Label>
					<Input
						id="supplier-name"
						name={createSupplierForm.field('name')}
						bind:value={formData.name}
						placeholder="π.χ. Καφές Λουμίδης"
						required
					/>
				</div>

				<!-- AFM -->
				<div class="space-y-2">
					<Label for="supplier-afm">ΑΦΜ *</Label>
					<Input
						id="supplier-afm"
						name={createSupplierForm.field('afm')}
						bind:value={formData.afm}
						placeholder="π.χ. 123456789"
						required
					/>
				</div>

				<!-- Phone -->
				<div class="space-y-2">
					<Label for="supplier-phone">Τηλέφωνο</Label>
					<Input
						id="supplier-phone"
						name={createSupplierForm.field('phone')}
						bind:value={formData.phone}
						placeholder="π.χ. 210 1234567"
					/>
				</div>

				<!-- Email -->
				<div class="space-y-2 sm:col-span-2">
					<Label for="supplier-email">Email</Label>
					<Input
						id="supplier-email"
						type="email"
						name={createSupplierForm.field('email')}
						bind:value={formData.email}
						placeholder="π.χ. info@supplier.gr"
					/>
				</div>

				<!-- Address -->
				<div class="space-y-2 sm:col-span-2">
					<Label for="supplier-address">Διεύθυνση</Label>
					<Input
						id="supplier-address"
						name={createSupplierForm.field('address')}
						bind:value={formData.address}
						placeholder="π.χ. Οδός 123, Αθήνα"
					/>
				</div>

				<!-- Contact Person -->
				<div class="space-y-2">
					<Label for="supplier-contact">Υπεύθυνος Επικοινωνίας</Label>
					<Input
						id="supplier-contact"
						name={createSupplierForm.field('contact_person')}
						bind:value={formData.contact_person}
						placeholder="π.χ. Γιάννης Παπαδόπουλος"
					/>
				</div>

				<!-- Payment Terms -->
				<div class="space-y-2">
					<Label for="supplier-payment">Όροι Πληρωμής</Label>
					<Input
						id="supplier-payment"
						name={createSupplierForm.field('payment_terms')}
						bind:value={formData.payment_terms}
						placeholder="π.χ. 30 ημέρες"
					/>
				</div>

				<!-- Notes -->
				<div class="space-y-2 sm:col-span-2">
					<Label for="supplier-notes">Σημειώσεις</Label>
					<Textarea
						id="supplier-notes"
						name={createSupplierForm.field('notes')}
						bind:value={formData.notes}
						placeholder="Πρόσθετες πληροφορίες..."
						rows={3}
						class="resize-none"
					/>
				</div>
			</div>

			<div class="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
				<p class="font-medium">Σημείωση:</p>
				<ul class="mt-1 list-disc space-y-1 pl-4">
					<li>* Υποχρεωτικά πεδία</li>
					<li>Το ΑΦΜ πρέπει να είναι μοναδικό</li>
				</ul>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Ακύρωση</Button>
				<Button type="submit" class="cursor-pointer">
					<Plus class="mr-2 h-4 w-4" />
					Προσθήκη
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>