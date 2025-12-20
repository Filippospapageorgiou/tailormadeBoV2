<script lang="ts">
	import {
		Pencil,
		Building,
		Phone,
		MapPin,
		Globe,
		CheckCircle,
		XCircle,
		IdCard,
		Mail,
		PhoneCall
	} from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateProfile } from './data.remote.js';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { Label } from '$lib/components/ui/label';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let { data } = $props();

	const profileStore = getProfileContext();

	let isUpdating = $state(false);
	let isUpdatingAvatar = $state(false);

	let profile = $derived(data.profile);
	let organization = $derived(data.organization);
	let managers = $derived(data.managers);

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	let username = $state('');
	let phone = $state('');
	let backgroundImage = $state('');
	let editingBackgroundImage = $state('');

	$effect(() => {
		username = profile.username;
		phone = profile.phone || '';
		backgroundImage = profile.image_url;
		editingBackgroundImage = profile.image_url;
	});

	let files: FileList | undefined = $state();

	$effect(() => {
		if (files && files[0]) {
			const reader = new FileReader();
			reader.onload = () => {
				editingBackgroundImage = reader.result?.toString() || '';
			};
			reader.readAsDataURL(files[0]);
		} else {
			editingBackgroundImage = profile.image_url;
		}
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('el-GR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div>
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<div class="mx-auto max-w-5xl">
			<!-- Header -->
			<div class="mb-12">
				<h1 class="font-mono text-4xl tracking-wider text-neutral-900">PROFILE</h1>
				<p class="mt-2 text-neutral-600">Manage your account and organization details</p>
			</div>

			<!-- Profile Header Section -->
			<div class="mb-12">
				<div class="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
					<!-- Avatar & Info -->
					<div class="flex flex-col gap-6 md:flex-row md:items-start">
						<!-- Avatar Upload -->
						<div>
							<Avatar.Root class="h-40 w-40">
								<Avatar.Image src={backgroundImage} alt={username} />
								<Avatar.Fallback>{username?.charAt(0)}</Avatar.Fallback>
							</Avatar.Root>
						</div>

						<!-- Name & Email -->
						<div class="flex-1 space-y-2">
							<div>
								<h2 class="text-2xl font-semibold text-neutral-900">{profile.username}</h2>
								<div class="mt-3 space-y-2">
									<p class="flex items-center gap-2 text-neutral-700">
										<Mail class="h-4 w-4 text-neutral-500" />
										{profile.email}
									</p>
									{#if profile.phone}
										<p class="flex items-center gap-2 text-neutral-700">
											<PhoneCall class="h-4 w-4 text-neutral-500" />
											{profile.phone}
										</p>
									{/if}
								</div>
							</div>
							<Modal.Root>
								<Modal.Trigger
									class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-transparent px-1.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
								>
									Edit Profile
								</Modal.Trigger>
								<Modal.Content>
									<Modal.Header>
										<Modal.Title>Edit Profile</Modal.Title>
										<Modal.Description>
											Make changes to your profile here. Click save when you're done.
										</Modal.Description>
									</Modal.Header>
									<form
										{...updateProfile.enhance(async ({ form, data, submit }) => {
											try {
												isUpdating = true;
												await submit();
												if (updateProfile.result?.success) {
													showSuccessToast('Επιτυχία', updateProfile.result.message);
													profileStore.updateUsername(username);
													profileStore.updatePhone(phone);
													profileStore.updateAvatar(editingBackgroundImage);
												} else {
													showFailToast(
														'Σφάλμα',
														updateProfile.result?.message ||
															'Ένα σφάλμα προέκυψε κάτα την ενημέρωση προσπάθησε ξάνα'
													);
													isUpdating = false;
													return;
												}
												form.reset();
												isUpdating = false;
											} catch (error) {
												showFailToast(
													'Σφάλμα',
													'Ένα σφάλμα προέκυψε κάτα την ενημέρωση προσπάθησε ξάνα'
												);
											}
										})}
										enctype="multipart/form-data"
										class="flex flex-col gap-2"
									>
										<div class="flex flex-col items-center justify-center">
											<!-- Avatar with Pencil Overlay -->
											<div class="relative inline-block">
												<Avatar.Root class="h-40 w-40">
													<Avatar.Image src={editingBackgroundImage} alt={username} />
													<Avatar.Fallback>{username?.charAt(0)}</Avatar.Fallback>
												</Avatar.Root>
												<Label
													for="avatar-input"
													class="absolute right-0 bottom-0 cursor-pointer rounded-full p-2.5 transition-all hover:bg-primary hover:text-white"
													title="Change avatar"
												>
													<Pencil class="h-4 w-4" />
												</Label>
											</div>
											<Input
												id="avatar-input"
												bind:files
												type="file"
												accept="image/png,image/jpeg"
												name={updateProfile.field('avatar')}
												class="hidden"
												disabled={isUpdating}
											/>
										</div>
										<div class="space-y-2">
											<Label for="username">Username</Label>
											<Input
												id="username"
												name={updateProfile.field('username')}
												bind:value={username}
												placeholder={profile.username}
												disabled={isUpdating}
											/>
										</div>
										<div class="space-y-2">
											<Label for="phone">Phone</Label>
											<PhoneInput
												country="GR"
												name={updateProfile.field('phone')}
												bind:value={phone}
												placeholder={profile.phone ?? 'πρόσθεσε κίνητο'}
												disabled={isUpdating}
											/>
										</div>
										<Modal.Footer>
											<Button type="submit" disabled={isUpdating}>
												{#if isUpdating}
													<Spinner /> Saving...
												{:else}
													Save Changes
												{/if}
											</Button>
										</Modal.Footer>
									</form>
								</Modal.Content>
							</Modal.Root>
						</div>
					</div>
				</div>

				<!-- Account Details -->
				<div class="mt-8 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-8 md:grid-cols-3">
					<div>
						<p class="mb-1 text-sm text-neutral-500">User ID</p>
						<p class="font-mono text-sm font-medium text-neutral-900">
							{profile.id.slice(0, 8)}...
						</p>
					</div>

					<div>
						<p class="mb-1 text-sm text-neutral-500">Role</p>
						<p class="text-sm font-medium text-neutral-900">
							{profileStore.role_name}
						</p>
					</div>

					<div>
						<p class="mb-1 text-sm text-neutral-500">Member Since</p>
						<p class="text-sm font-medium text-neutral-900">{formatDate(profile.created_at)}</p>
					</div>
				</div>
			</div>

			<!-- Organization & Team Section -->
			<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
				<!-- Organization Info -->
				<div>
					<div class="mb-6 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<Building class="h-5 w-5 text-neutral-900" />
							<h3 class="text-lg font-bold text-neutral-900">Organization</h3>
						</div>
						{#if organization.status}
							<Badge class="bg-green-100 text-green-700 hover:bg-green-100">
								<CheckCircle class="mr-1 h-3 w-3" />
								Active
							</Badge>
						{:else}
							<Badge class="bg-red-100 text-red-700 hover:bg-red-100">
								<XCircle class="mr-1 h-3 w-3" />
								Inactive
							</Badge>
						{/if}
					</div>

					<div class="space-y-6">
						<!-- Store Name -->
						<div>
							<p class="mb-1 text-sm text-neutral-500">Store Name</p>
							<p class="font-medium text-neutral-900">
								{organization.store_name || 'Not specified'}
							</p>
						</div>

						<!-- Phone -->
						<div>
							<p class="mb-1 text-sm text-neutral-500">Phone</p>
							<div class="flex items-center gap-2">
								<Phone class="h-4 w-4 text-neutral-500" />
								<p class="font-medium text-neutral-900">
									{organization.phone || 'Not specified'}
								</p>
							</div>
						</div>

						<!-- Location -->
						<div>
							<p class="mb-1 text-sm text-neutral-500">Location</p>
							<div class="flex items-center gap-2">
								<MapPin class="h-4 w-4 text-neutral-500" />
								<p class="font-medium text-neutral-900">
									{organization.location || 'Not specified'}
								</p>
							</div>
						</div>

						<!-- Country -->
						<div>
							<p class="mb-1 text-sm text-neutral-500">Country</p>
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4 text-neutral-500" />
								<p class="font-medium text-neutral-900">
									{organization.country || 'Not specified'}
								</p>
							</div>
						</div>
					</div>
				</div>

				<section>
					<div class="mb-8">
						<h2 class="text-lg font-medium text-neutral-900">Management Team</h2>
						<p class="mt-1 text-sm text-neutral-500">Get in touch with your team for support</p>
					</div>

					{#if managers.length > 0}
						<div class="space-y-4">
							{#each managers as manager (manager.id)}
								<div
									class="group rounded-xl p-5 shadow-sm ring-1 ring-neutral-900/5 transition-all hover:shadow-md"
								>
									<div class="flex gap-5">
										<!-- Avatar -->
										<Avatar.Root class="h-16 w-16 shrink-0 ring-2 ring-neutral-100">
											<Avatar.Image src={manager.image_url} alt={manager.username} />
											<Avatar.Fallback class="text-lg"
												>{getInitials(manager.username)}</Avatar.Fallback
											>
										</Avatar.Root>

										<!-- Info -->
										<div class="min-w-0 flex-1">
											<div class="flex items-start justify-between gap-4">
												<div>
													<h3 class="text-base font-semibold text-neutral-900">
														{manager.username}
													</h3>
													<p
														class="mt-0.5 text-xs font-medium tracking-wide text-neutral-400 uppercase"
													>
														Store Manager
													</p>
												</div>
											</div>

											<!-- Contact Details - All visible -->
											<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
												<a
													href={`mailto:${manager.email}`}
													class="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
												>
													<Mail class="h-4 w-4 text-neutral-400" />
													<span>{manager.email}</span>
												</a>
												{#if manager.phone}
													<a
														href={`tel:${manager.phone}`}
														class="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
													>
														<Phone class="h-4 w-4 text-neutral-400" />
														<span>{manager.phone}</span>
													</a>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center">
							<p class="text-sm text-neutral-500">No managers assigned yet</p>
						</div>
					{/if}
				</section>
			</div>
		</div>
	</main>
</div>
