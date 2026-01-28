<script lang="ts">
	import {
		Pencil,
		Building,
		Phone,
		MapPin,
		Globe,
		CheckCircle,
		XCircle,
		Mail,
		PhoneCall,
		Users,
		User2,
		UserCheck,
		PhoneIcon,
		Building2
	} from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateProfile } from './data.remote.js';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { Label } from '$lib/components/ui/label';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { getAllPhoneContacts } from '../../settings/manage_users/data.remote.js';
	import EmergencyContactCard from '$lib/components/custom/EmergencyContactCard.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';


	let { data } = $props();


	const profileStore = getProfileContext();

	let isUpdating = $state(false);

	let profile = $derived(data.profile);
	let organization = $derived(data.organization);
	let managers = $derived(data.managers);

	let contactsQuery = getAllPhoneContacts();
	let contacts = $derived(contactsQuery.current?.contacts ?? []);

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

<div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
	<main class="container mx-auto px-4 py-6 md:py-8 lg:py-12">
		<div class="mx-auto max-w-7xl">
			<!-- Header with improved spacing -->
			<div class="mb-8 md:mb-12">
				<h1 class="font-mono text-3xl tracking-wider text-foreground md:text-4xl lg:text-5xl">
					PROFILE
				</h1>
				<p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
					Διαχειριστείτε τα στοιχεία του λογαριασμού και του οργανισμού σας
				</p>
			</div>

			<Separator class="mb-6 md:mb-8" />

			<!-- Improved Tabs Layout with Original Design -->
			<div class="w-full py-8">
				<Tabs.Root value="users" class="flex flex-col gap-6 md:flex-row">
					<aside class="-mx-4 mb-8 lg:mb-0 lg:w-1/5">
						<Tabs.List
							class="flex h-auto w-full flex-col space-y-1 bg-transparent lg:justify-start"
						>
							<Tabs.Trigger
								value="users"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<UserCheck class="mr-2 h-5 w-5" />
								<span class="hover:underline">Λογαριασμός</span>
							</Tabs.Trigger>
							<Tabs.Trigger
								value="organization"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<Building2 class="mr-2 h-5 w-5" />
								<span class="hover:underline">Οργανισμός</span>
							</Tabs.Trigger>
							<Tabs.Trigger
								value="phone_calls"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<Phone class="mr-2 h-5 w-5" />
								<span class="hover:underline">Τηλέφωνα & Τεχνικοί</span>
							</Tabs.Trigger>
						</Tabs.List>
					</aside>

					<!-- Users Tab Content -->
					<Tabs.Content value="users" class="flex-1 animate-fade-in-up">
						<!-- 2 Column Grid Layout -->
						<div class="grid grid-cols-1 gap-6 md:gap-8">
							<!-- Left Column: Profile Card -->
							<div class="space-y-6">
								<!-- Avatar & Basic Info Card -->
								<div class="md:p-6">
									<div class="flex flex-col items-center gap-6 text-center">
										<!-- Avatar -->
										<div class="shrink-0">
											<Avatar.Root
												class="h-32 w-32 shadow-2xl ring-4 ring-background/50 md:h-40 md:w-40"
											>
												<Avatar.Image src={backgroundImage} alt={username} />
												<Avatar.Fallback class="text-3xl md:text-4xl">
													{username?.charAt(0)}
												</Avatar.Fallback>
											</Avatar.Root>
										</div>

										<!-- Name, Email & Actions -->
										<div class="w-full space-y-4">
											<div class="space-y-3">
												<h2 class="text-xl font-semibold text-foreground md:text-2xl lg:text-3xl">
													{profile.username}
												</h2>

												<!-- Contact Info -->
												<div class="flex flex-col gap-3 text-sm md:text-base">
													<div class="flex items-center justify-center gap-2 text-muted-foreground">
														<Mail class="h-4 w-4 shrink-0" />
														<span class="truncate">{profile.email}</span>
													</div>
													{#if profile.phone}
														<div
															class="flex items-center justify-center gap-2 text-muted-foreground"
														>
															<PhoneCall class="h-4 w-4 shrink-0" />
															<span>{profile.phone}</span>
														</div>
													{/if}
												</div>
											</div>

											<!-- Edit Button -->
											<Modal.Root>
												<Modal.Trigger
													class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg 
												   border border-border bg-card px-4 py-2.5 text-sm font-medium 
												   text-foreground transition-all hover:bg-muted hover:shadow-md active:scale-95"
												>
													<Pencil class="h-4 w-4" />
													<span>Edit Profile</span>
												</Modal.Trigger>
												<Modal.Content class="max-w-md">
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
														class="flex flex-col gap-4"
													>
														<div class="flex flex-col items-center justify-center">
															<div class="relative inline-block">
																<Avatar.Root class="h-32 w-32 md:h-40 md:w-40">
																	<Avatar.Image src={editingBackgroundImage} alt={username} />
																	<Avatar.Fallback class="text-3xl md:text-4xl">
																		{username?.charAt(0)}
																	</Avatar.Fallback>
																</Avatar.Root>
																<Label
																	for="avatar-input"
																	class="absolute right-1 bottom-1 cursor-pointer rounded-full 
																   bg-primary p-2.5 text-primary-foreground shadow-lg
																   transition-all hover:scale-110 hover:bg-primary/90"
																	title="Change avatar"
																>
																	<Pencil class="h-4 w-4" />
																</Label>
															</div>
															<Input
																id="avatar-input"
																accept="image/png,image/jpeg"
																{...updateProfile.fields.avatar.as('file')}
																bind:files
																class="hidden"
																disabled={isUpdating}
															/>
														</div>
														<div class="space-y-2">
															<Label for="username">Username</Label>
															<Input
																id="username"
																{...updateProfile.fields.username.as('text')}
																bind:value={username}
																placeholder={profile.username}
																disabled={isUpdating}
															/>
														</div>
														<div class="space-y-2">
															<Label for="phone">Phone</Label>
															<PhoneInput
																country="GR"
																{...updateProfile.fields.phone.as('text')}
																bind:value={phone}
																placeholder={profile.phone ?? 'πρόσθεσε κίνητο'}
																disabled={isUpdating}
															/>
														</div>
														<Modal.Footer>
															<Button type="submit" disabled={isUpdating} class="w-full sm:w-auto">
																{#if isUpdating}
																	<Spinner class="mr-2" /> Saving...
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
								<div class="space-y-6">
									<div class="md:p-6">
										<h3 class="mb-6 text-lg font-bold text-foreground md:text-xl">
											Account Details
										</h3>
										<div class="space-y-6">
											<div class="space-y-2 border-b border-border/30 pb-4">
												<p class="text-xs tracking-wide text-muted-foreground uppercase md:text-sm">
													User ID
												</p>
												<p
													class="font-mono text-sm font-medium break-all text-foreground md:text-base"
												>
													{profile.id.slice(0, 8)}...
												</p>
											</div>

											<div class="space-y-2 border-b border-border/30 pb-4">
												<p class="text-xs tracking-wide text-muted-foreground uppercase md:text-sm">
													Role
												</p>
												<Badge variant="secondary" class="text-sm">
													{profileStore.role_name}
												</Badge>
											</div>

											<div class="space-y-2">
												<p class="text-xs tracking-wide text-muted-foreground uppercase md:text-sm">
													Member Since
												</p>
												<p class="text-sm font-medium text-foreground md:text-base">
													{formatDate(profile.created_at)}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Tabs.Content>

					<!-- Team Tab Content -->
					<Tabs.Content value="organization" class="flex-1 animate-fade-in-up">
						<!-- 2 Column Grid for Organization & Team -->
						<div class="grid grid-cols-1 gap-6 md:gap-8">
							<!-- Organization Info Card -->
							<div class="h-fit md:p-6 lg:p-8">
								<div
									class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 md:h-12 md:w-12"
										>
											<Building class="h-5 w-5 text-primary md:h-6 md:w-6" />
										</div>
										<h3 class="text-lg font-bold text-foreground md:text-xl">Organization</h3>
									</div>
									{#if organization.status}
										<Badge
											class="w-fit border-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
										>
											<CheckCircle class="mr-1 h-3 w-3" />
											Active
										</Badge>
									{:else}
										<Badge
											class="w-fit border-0 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
										>
											<XCircle class="mr-1 h-3 w-3" />
											Inactive
										</Badge>
									{/if}
								</div>

								<div class="space-y-5">
									<div class="border-b border-border/30 pb-4">
										<p
											class="mb-2 text-xs tracking-wide text-muted-foreground uppercase md:text-sm"
										>
											Store Name
										</p>
										<p class="text-base font-semibold text-foreground md:text-lg">
											{organization.store_name || 'Not specified'}
										</p>
									</div>

									<div class="space-y-3">
										<div class="flex items-start gap-3">
											<Phone class="mt-1 h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />
											<div class="min-w-0 flex-1">
												<p class="mb-1 text-xs text-muted-foreground">Phone</p>
												<p class="text-sm font-medium break-all text-foreground md:text-base">
													{organization.phone || 'Not specified'}
												</p>
											</div>
										</div>

										<div class="flex items-start gap-3">
											<MapPin class="mt-1 h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />
											<div class="min-w-0 flex-1">
												<p class="mb-1 text-xs text-muted-foreground">Location</p>
												<p class="text-sm font-medium text-foreground md:text-base">
													{organization.location || 'Not specified'}
												</p>
											</div>
										</div>

										<div class="flex items-start gap-3">
											<Globe class="mt-1 h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />
											<div class="min-w-0 flex-1">
												<p class="mb-1 text-xs text-muted-foreground">Country</p>
												<p class="text-sm font-medium text-foreground md:text-base">
													{organization.country || 'Not specified'}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Management Team -->
							<section class="space-y-6">
								<div>
									<h2 class="text-lg font-bold text-foreground md:text-xl">Διοικητική ομάδα</h2>
									<p class="mt-2 text-sm text-muted-foreground md:text-base">
										Επικοινωνήστε με την ομάδα σας για υποστήριξη
									</p>
								</div>

								{#if managers.length > 0}
									<div class="space-y-4">
										{#each managers as manager (manager.id)}
											<div
												class="group rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm transition-all
												   hover:scale-[1.02] hover:border-border hover:shadow-lg md:p-5"
											>
												<div class="flex flex-col gap-4 sm:flex-row">
													<Avatar.Root
														class="mx-auto h-14 w-14 shrink-0 ring-2 ring-background sm:mx-0 md:h-16 md:w-16"
													>
														<Avatar.Image src={manager.image_url} alt={manager.username} />
														<Avatar.Fallback class="text-base md:text-lg">
															{getInitials(manager.username)}
														</Avatar.Fallback>
													</Avatar.Root>

													<div class="min-w-0 flex-1 text-center sm:text-left">
														<div class="mb-3">
															<h3 class="text-base font-semibold text-foreground md:text-lg">
																{manager.username}
															</h3>
															<p
																class="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
															>
																Store Manager
															</p>
														</div>

														<div class="flex flex-col flex-wrap gap-3 text-sm sm:flex-row">
															<div
																class="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"
															>
																<Mail class="h-4 w-4 shrink-0" />
																<span class="truncate">{manager.email}</span>
															</div>
															{#if manager.phone}
																<div
																	class="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start"
																>
																	<Phone class="h-4 w-4 shrink-0" />
																	<span>{manager.phone}</span>
																</div>
															{/if}
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div
										class="rounded-xl border border-dashed border-border/50 bg-card/50 py-12 text-center md:py-16"
									>
										<Users
											class="mx-auto mb-4 h-12 w-12 text-muted-foreground/40 md:h-16 md:w-16"
										/>
										<p class="text-sm text-muted-foreground md:text-base">
											No managers assigned yet
										</p>
									</div>
								{/if}
							</section>
						</div>
					</Tabs.Content>
					<Tabs.Content value="phone_calls" class="flex-1 animate-fade-in-up">
						<div class="space-y-4">
							<div>
								<h2 class="text-lg font-bold text-foreground md:text-xl">
									Σημαντικά Τηλέφωνα & Τεχνικοί
								</h2>
								<p class="mt-2 text-sm text-muted-foreground md:text-base">
									Διαθέσιμες επαφές έκτακτης ανάγκης για επικοινωνία
								</p>
							</div>

							{#if contactsQuery.loading}
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{#each Array(4) as _}
										<div class="animate-pulse rounded-lg border bg-card p-4">
											<div class="mb-3 space-y-2">
												<div class="h-4 w-32 rounded bg-muted"></div>
												<div class="h-3 w-24 rounded bg-muted"></div>
											</div>
											<div class="space-y-2">
												<div class="h-8 w-full rounded bg-muted"></div>
												<div class="h-8 w-full rounded bg-muted"></div>
											</div>
										</div>
									{/each}
								</div>
							{:else if contacts.length === 0}
								<div
									class="flex flex-col items-center justify-center rounded-xl border border-dashed py-12"
								>
									<div class="mb-3 rounded-full bg-muted p-3">
										<Phone class="h-6 w-6 text-muted-foreground" />
									</div>
									<p class="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμες επαφές</p>
								</div>
							{:else}
								<ScrollArea class="h-[500px] pr-4">
									<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
										{#each contacts as contact, index (contact.id)}
											<EmergencyContactCard {contact} {index} />
										{/each}
									</div>
								</ScrollArea>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</div>
	</main>
</div>
