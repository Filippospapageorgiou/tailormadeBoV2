<script lang="ts">
	import {
		Pencil,
		Save,
		X,
		Building,
		Phone,
		MapPin,
		Globe,
		CheckCircle,
		XCircle,
		IdCard ,
		Mail,
		Calendar,
		User,
		MailIcon,
		Loader
	} from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateUsername, updateAvatar } from './data.remote';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
  	import { toast } from '$lib/stores/toast.svelte';
	import type { Profile } from '$lib/models/database.types';

	let { data } = $props();

	const profileStore = getProfileContext();

	let isUpdating = $state(false);
  	let isUpdatingAvatar = $state(false);

	let profile = $derived(data.profile);
	let organization = $derived(data.organization);

	let username = $state('');
	let backgorundImage = $state('');

	$effect(() => {
		username = profile.username;
	});

	let editing = $state(false);

  let files:FileList | undefined = $state();
  $effect(() => {
        if(editing){
          if(files && files[0]){
            const reader = new FileReader();
            reader.addEventListener('load', ()=>{
                backgorundImage = reader.result?.toString() || '';
            })
            reader.readAsDataURL(files[0])
          }
        }else{
          backgorundImage = profile.image_url;
        }
    })

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('el-GR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function handleUpdateSuccess(text: string) {
		toast.show = true;
		toast.status = true;
		toast.title = 'Success';
		toast.text = text;
		isUpdating = false;
		editing = false;
		profileStore.updateUsername(username);
	}

	function handleUpdateError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Error';
		toast.text = text;
		isUpdating = false;
		editing = false;
	}

	function handleAvatarUpdateSuccess(text: string, newImageUrl: string) {
		toast.show = true;
		toast.status = true;
		toast.title = 'Success';
		toast.text = text;
		backgorundImage = newImageUrl;
    	editing = false;
		profileStore.updateAvatar(newImageUrl);
	}

	function handleAvatarUpdateError(text: string) {
		toast.show = true;
		toast.status = false;
		toast.title = 'Error';
		toast.text = text;
		isUpdatingAvatar = false;
    	editing = false;
	}
</script>

<div class="">
	<main class="container mx-auto px-4 pt-8 pb-20 md:px-6">
		<div class="mx-auto max-w-5xl">
			<!-- Header Section -->
			<div class="mb-8">
				<h1 class="font-mono text-4xl tracking-wider text-neutral-800">PROFILE</h1>
				<p class="mt-1 text-sm text-[#8B6B4A]">Manage your account and organization details</p>
			</div>

			<!-- Main Profile Card -->
			<div class="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
				<!-- Profile Content -->
				<div class="px-8 py-8">
					<!-- Avatar & Basic Info -->
					<div class="mb-6 flex flex-col md:flex-row md:items-start md:justify-between">
						<div class="flex flex-col gap-6 md:flex-row">
							<div class="group relative">
								<form class="flex flex-col gap-2" enctype="multipart/form-data" {...updateAvatar.enhance(async ({ form, data,submit }) => {
										isUpdatingAvatar = true;
										await submit();

										if (updateAvatar.issues?.avatar) {
											handleAvatarUpdateError(updateAvatar.issues.avatar[0].message);
											return;
										}

										if (updateAvatar.result?.success && updateAvatar.result.imageUrl) {
											handleAvatarUpdateSuccess(
												'Avatar updated successfully',
												updateAvatar.result.imageUrl
											);
										} else {
											handleAvatarUpdateError(
												updateAvatar.result?.message || 'An unknown error occurred'
											);
										}
										isUpdatingAvatar = false;
										form.reset();
									})}
								>
									<Avatar.Root class="h-32 w-32 border-4 border-background">
										<Avatar.Image src={backgorundImage} alt={username} />
										<Avatar.Fallback>{username?.charAt(0)}</Avatar.Fallback>
									</Avatar.Root>
									{#if editing}
										<Input
											bind:files
											type="file"
											accept="image/png,image/jpeg"
											name="avatar"
											class="cursor-pointer text-sm w-31"
										/>
										<Button
											variant="outline"
											class="cursor-pointer"
											type="submit"
											disabled={isUpdatingAvatar}
										>
											{#if isUpdatingAvatar}
												<Loader class="mr-2 h-4 w-4 animate-spin-clockwise" />
												Saving...
											{:else}
												<Save class="mr-2 h-4 w-4" />
												Save Avatar
											{/if}
										</Button>
									{/if}
								</form>
							</div>

							<!-- Name & Email -->
							<div>
								{#if editing}
									<form
										{...updateUsername.enhance(async ({ form, data, submit }) => {
											isUpdating = true;
											await submit();
											isUpdating = false;

											if (updateUsername.issues?.username) {
												handleUpdateError(updateUsername.issues.username[0].message);
												return;
											}
											form.reset();
											handleUpdateSuccess('Username updated successfully');
										})}
										class="flex flex-row gap-2 py-2"
									>
										<Input
											id="username"
											name={updateUsername.field('username')}
											bind:value={username}
											placeholder={profile.username}
											disabled={isUpdating}
											aria-invalid={!!updateUsername.issues?.username}
										/>
										<Button
											variant="outline"
											class="cursor-pointer"
											type="submit"
											disabled={isUpdating}
										>
											{#if isUpdating}
												<Loader class="mr-2 h-4 w-4 animate-spin-clockwise" />
												Saving...
											{:else}
												<Save class="mr-2 h-4 w-4" />
												Save
											{/if}
										</Button>
									</form>
								{:else}
									<h2 class="mb-2 text-3xl font-bold text-neutral-800">{profile.username}</h2>
								{/if}
								<p class="mb-3 flex items-center gap-2 text-neutral-600">
									<Mail class="h-4 w-4" />
									{profile.email}
								</p>
								<Badge class="bg-[#8B6B4A] px-3 py-1 text-sm hover:bg-[#8B6B4A]">
									{profile.role}
								</Badge>
							</div>
						</div>

						<!-- Edit Username Button -->
						<div class="mt-4 md:mt-0">
							<Button
								variant="outline"
								size="sm"
								onclick={(()=> {editing = !editing})}
								class="cursor-pointer gap-2"
							>
								<Pencil class="h-4 w-4" />
								Edit Profile
							</Button>
						</div>
					</div>

					<!-- Account Details Grid -->
					<div class="mt-8 grid grid-cols-1 gap-6 border-t border-neutral-200 pt-6 md:grid-cols-3">
						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-neutral-100 p-2">
								<User class="h-5 w-5 text-[#8B6B4A]" />
							</div>
							<div>
								<p class="mb-1 text-sm text-neutral-500">User ID</p>
								<p class="font-mono text-sm font-medium text-neutral-800">
									{profile.id.slice(0, 8)}...
								</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-neutral-100 p-2">
								<IdCard class="h-5 w-5 text-[#8B6B4A]" />
							</div>
							<div>
								<p class="mb-1 text-sm text-neutral-500">Role</p>
								<p class="font-mono text-sm font-medium text-neutral-800">
									{profileStore.role_name}
								</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<div class="rounded-lg bg-neutral-100 p-2">
								<Calendar class="h-5 w-5 text-[#8B6B4A]" />
							</div>
							<div>
								<p class="mb-1 text-sm text-neutral-500">Member Since</p>
								<p class="font-medium text-neutral-800">{formatDate(profile.created_at)}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Organization & Manager Cards -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Organization Card -->
				<div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
					<div class="border-b border-neutral-200 px-6 py-5">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="rounded-lg bg-[#8B6B4A]/10 p-2">
									<Building class="h-5 w-5 text-[#8B6B4A]" />
								</div>
								<h3 class="text-lg font-bold text-neutral-800">Organization</h3>
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
					</div>

					<div class="px-6 py-5">
						<div class="space-y-4">
							<!-- Store Name -->
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-neutral-100 p-2">
									<Building class="h-4 w-4 text-[#8B6B4A]" />
								</div>
								<div class="flex-1">
									<p class="mb-0.5 text-sm text-neutral-500">Store Name</p>
									<p class="font-medium text-neutral-800">
										{organization.store_name || 'Not specified'}
									</p>
								</div>
							</div>

							<!-- Phone -->
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-neutral-100 p-2">
									<Phone class="h-4 w-4 text-[#8B6B4A]" />
								</div>
								<div class="flex-1">
									<p class="mb-0.5 text-sm text-neutral-500">Phone</p>
									<p class="font-medium text-neutral-800">
										{organization.phone || 'Not specified'}
									</p>
								</div>
							</div>

							<!-- Location -->
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-neutral-100 p-2">
									<MapPin class="h-4 w-4 text-[#8B6B4A]" />
								</div>
								<div class="flex-1">
									<p class="mb-0.5 text-sm text-neutral-500">Location</p>
									<p class="font-medium text-neutral-800">
										{organization.location || 'Not specified'}
									</p>
								</div>
							</div>

							<!-- Country -->
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-neutral-100 p-2">
									<Globe class="h-4 w-4 text-[#8B6B4A]" />
								</div>
								<div class="flex-1">
									<p class="mb-0.5 text-sm text-neutral-500">Country</p>
									<p class="font-medium text-neutral-800">
										{organization.country || 'Not specified'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Store Manager Card -->
				<div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
					<div class="border-b border-neutral-200 px-6 py-5">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-[#8B6B4A]/10 p-2">
								<User class="h-5 w-5 text-[#8B6B4A]" />
							</div>
							<h3 class="text-lg font-bold text-neutral-800">Store Manager</h3>
						</div>
					</div>

					<div class="px-6 py-5">
						<div class="space-y-4">
							<p class="mb-4 text-sm text-neutral-600">Need help? Contact your store manager</p>

							{#if organization.manager}
								<!-- Manager Username -->
								<div class="flex items-start gap-3">
									<div class="rounded-lg bg-neutral-100 p-2">
										<User class="h-4 w-4 text-[#8B6B4A]" />
									</div>
									<div class="flex-1">
										<p class="mb-0.5 text-sm text-neutral-500">Manager Name</p>
										<p class="font-medium text-neutral-800">
											{organization.manager.username}
										</p>
									</div>
								</div>

								<!-- Manager Email -->
								<div class="flex items-start gap-3">
									<div class="rounded-lg bg-neutral-100 p-2">
										<MailIcon class="h-4 w-4 text-[#8B6B4A]" />
									</div>
									<div class="flex-1">
										<p class="mb-0.5 text-sm text-neutral-500">Manager Email</p>
										<p class="font-medium text-neutral-800">
											{organization.manager.email}
										</p>
									</div>
								</div>

								<!-- Contact Button -->
								<div class="pt-2">
									<Button class="w-full gap-2 bg-[#8B6B4A] text-white hover:bg-[#6B5239]">
										<Mail class="h-4 w-4" />
										Contact Manager
									</Button>
								</div>
							{:else}
								<p class="text-sm text-neutral-500">No manager assigned to this organization</p>
							{/if}

							<p class="pt-2 text-center text-xs text-neutral-500">
								Your manager can help with schedules, time-off requests, and other workplace matters
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>