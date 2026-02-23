<script lang="ts">
	import {
		Pencil,
		Mail,
		PhoneCall,
		UserCheck,
		BarChart2,
		GraduationCap,
		Building2,
		ClipboardList,
		CheckCircle2,
		Clock,
		FileText,
		CalendarDays
	} from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateTrainerProfile } from './data.remote.js';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { Label } from '$lib/components/ui/label';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		getMyAssignedOrgs,
		getMyEvaluations
	} from '$lib/api/trainers/trainer_evalution/data.remote.js';
	import type { EvaluationStatus } from '$lib/models/trainers.types.js';

	let { data } = $props();

	const profileStore = getProfileContext();
	let isUpdating = $state(false);
	let profile = $derived(data.profile);

	let username = $state('');
	let full_name = $state('');
	let phone = $state('');
	let backgroundImage = $state('');
	let editingBackgroundImage = $state('');

	$effect(() => {
		username = profile.username;
		phone = profile.phone || '';
		backgroundImage = profile.image_url;
		full_name = profile.full_name;
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

	// Reactive data queries
	let assignedOrgsQuery = getMyAssignedOrgs();
	let evaluationsQuery = getMyEvaluations();

	type AssignedOrg = {
		id: number;
		org_id: number;
		visit_date: string;
		core_organizations: {
			id: number;
			store_name: string;
			location: string | null;
		} | null;
	};

	type EvaluationListItem = {
		id: number;
		org_id: number;
		visit_date: string;
		submit: EvaluationStatus;
		overall_rating: number | null;
		submitted_at: string | null;
		created_at: string;
		core_organizations: { id: number; store_name: string; location: string | null } | null;
	};

	let evaluations = $derived(
		(evaluationsQuery?.current?.evaluations ?? []) as unknown as EvaluationListItem[]
	);
	let assignedOrgs = $derived(
		(assignedOrgsQuery?.current?.assignments ?? []) as unknown as AssignedOrg[]
	);

	let stats = $derived({
		total: evaluations.length,
		draft: evaluations.filter((e) => e.submit === 'draft').length,
		submitted: evaluations.filter((e) => e.submit === 'submitted').length,
		reviewed: evaluations.filter((e) => e.submit === 'reviewed').length
	});

	let evalsLoading = $derived(evaluationsQuery?.current === undefined);
	let orgsLoading = $derived(assignedOrgsQuery?.current === undefined);

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
			<!-- Header -->
			<div class="mb-8 md:mb-12">
				<h1 class="font-mono text-3xl tracking-wider text-foreground md:text-4xl lg:text-5xl">
					PROFILE
				</h1>
				<p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
					Διαχειριστείτε τα στοιχεία του λογαριασμού σας
				</p>
			</div>

			<Separator class="mb-6 md:mb-8" />

			<div class="w-full py-8">
				<Tabs.Root value="account" class="flex flex-col gap-6 md:flex-row">
					<aside class="-mx-4 mb-8 lg:mb-0 lg:w-1/5">
						<Tabs.List
							class="flex h-auto w-full flex-col space-y-1 bg-transparent lg:justify-start"
						>
							<Tabs.Trigger
								value="account"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<UserCheck class="mr-2 h-5 w-5" />
								<span class="hover:underline">Λογαριασμός</span>
							</Tabs.Trigger>
							<Tabs.Trigger
								value="stats"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<BarChart2 class="mr-2 h-5 w-5" />
								<span class="hover:underline">Στατιστικά</span>
							</Tabs.Trigger>
						</Tabs.List>
					</aside>

					<!-- Account Tab -->
					<Tabs.Content value="account" class="flex-1 animate-fade-in-up">
						<div class="grid grid-cols-1 gap-6 md:gap-8">
							<!-- Avatar & Basic Info Card -->
							<div class="space-y-6">
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

										<div class="w-full space-y-4">
											<div class="space-y-3">
												<h2 class="text-xl font-semibold text-foreground md:text-2xl lg:text-3xl">
													{profile.username}
												</h2>

												<!-- Trainer role badge -->
												<div class="flex justify-center">
													<div
														class="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1"
													>
														<GraduationCap class="h-3.5 w-3.5 text-primary" />
														<span class="text-xs font-medium text-primary">Trainer</span>
													</div>
												</div>

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
														{...updateTrainerProfile.enhance(async ({ form, submit }) => {
															try {
																isUpdating = true;
																await submit();
																if (updateTrainerProfile.result?.success) {
																	showSuccessToast(
																		'Επιτυχία',
																		updateTrainerProfile.result.message
																	);
																	profileStore.updateUsername(username);
																	profileStore.updatePhone(phone);
																	profileStore.updateAvatar(editingBackgroundImage);
																	profileStore.updateFullName(full_name);
																} else {
																	showFailToast(
																		'Σφάλμα',
																		updateTrainerProfile.result?.message ||
																			'Ένα σφάλμα προέκυψε κάτα την ενημέρωση'
																	);
																	isUpdating = false;
																	return;
																}
																form.reset();
																isUpdating = false;
															} catch {
																showFailToast(
																	'Σφάλμα',
																	'Ένα σφάλμα προέκυψε κάτα την ενημέρωση'
																);
															}
														})}
														enctype="multipart/form-data"
														class="flex flex-col gap-4"
													>
														<!-- Avatar preview + upload -->
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
																{...updateTrainerProfile.fields.avatar.as('file')}
																bind:files
																class="hidden"
																disabled={isUpdating}
															/>
														</div>

														<div class="space-y-2">
															<Label for="username">Username</Label>
															<Input
																id="username"
																{...updateTrainerProfile.fields.username.as('text')}
																bind:value={username}
																placeholder={profile.username}
																disabled={isUpdating}
															/>
														</div>

														<div class="space-y-2">
															<Label for="full_name">Full Name</Label>
															<Input
																id="full_name"
																{...updateTrainerProfile.fields.full_name.as('text')}
																bind:value={full_name}
																placeholder={profile.full_name}
																disabled={isUpdating}
															/>
														</div>

														<div class="space-y-2">
															<Label for="phone">Phone</Label>
															<PhoneInput
																country="GR"
																{...updateTrainerProfile.fields.phone.as('text')}
																bind:value={phone}
																placeholder={profile.phone ?? 'πρόσθεσε κινητό'}
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

								<!-- Account Details -->
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

											{#if profile.full_name}
												<div class="space-y-2 border-b border-border/30 pb-4">
													<p
														class="text-xs tracking-wide text-muted-foreground uppercase md:text-sm"
													>
														Full Name
													</p>
													<p class="text-sm font-medium text-foreground md:text-base">
														{profile.full_name}
													</p>
												</div>
											{/if}

											<div class="space-y-2 border-b border-border/30 pb-4">
												<p class="text-xs tracking-wide text-muted-foreground uppercase md:text-sm">
													Role
												</p>
												<Badge variant="secondary" class="text-sm">Trainer</Badge>
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

					<!-- Stats Tab -->
					<Tabs.Content value="stats" class="flex-1 animate-fade-in-up">
						<div class="space-y-6">
							<div>
								<h2 class="text-lg font-bold text-foreground md:text-xl">Στατιστικά</h2>
								<p class="mt-2 text-sm text-muted-foreground">
									Η δραστηριότητά σου ως Trainer
								</p>
							</div>

							<!-- Evaluation stat cards -->
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{#each [
									{ label: 'Σύνολο', value: stats.total, icon: ClipboardList, color: 'text-foreground', bg: 'bg-muted/50' },
									{ label: 'Πρόχειρα', value: stats.draft, icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted/30' },
									{ label: 'Υποβληθέντα', value: stats.submitted, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
									{ label: 'Ελεγμένα', value: stats.reviewed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' }
								] as stat}
									<Card.Root
										class="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm"
									>
										<div class="flex items-start justify-between">
											<div>
												<p class="text-xs text-muted-foreground">{stat.label}</p>
												<p class="mt-1 text-2xl font-bold {stat.color}">
													{evalsLoading ? '—' : stat.value}
												</p>
											</div>
											<div class="rounded-lg p-2 {stat.bg}">
												<stat.icon class="h-4 w-4 {stat.color}" />
											</div>
										</div>
									</Card.Root>
								{/each}
							</div>

							<!-- Assigned stores card -->
							<Card.Root
								class="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm"
							>
								<div class="flex items-center gap-4">
									<div class="rounded-xl bg-primary/10 p-3">
										<Building2 class="h-5 w-5 text-primary" />
									</div>
									<div>
										<p class="text-sm text-muted-foreground">Ανατεθειμένα Καταστήματα</p>
										<p class="text-2xl font-bold">
											{orgsLoading ? '—' : assignedOrgs.length}
										</p>
									</div>
								</div>
							</Card.Root>

							<!-- Assigned orgs list -->
							{#if !orgsLoading && assignedOrgs.length > 0}
								<div>
									<h3
										class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
									>
										Τρέχουσες Αναθέσεις
									</h3>
									<div class="space-y-2">
										{#each assignedOrgs as org}
											{@const storeName = org.core_organizations?.store_name ?? 'Κατάστημα'}
											<div
												class="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3"
											>
												<div
													class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
												>
													{storeName.slice(0, 2).toUpperCase()}
												</div>
												<div class="min-w-0 flex-1">
													<p class="truncate text-sm font-medium">{storeName}</p>
													{#if org.core_organizations?.location}
														<p class="text-xs text-muted-foreground">
															{org.core_organizations.location}
														</p>
													{/if}
												</div>
												<div class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
													<CalendarDays class="h-3 w-3" />
													<span>{formatDate(org.visit_date)}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{:else if !orgsLoading && assignedOrgs.length === 0}
								<div
									class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-10 text-muted-foreground"
								>
									<Building2 class="mb-2 h-8 w-8 opacity-30" />
									<p class="text-sm">Δεν έχετε ανατεθειμένα καταστήματα</p>
								</div>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</div>
	</main>
</div>
