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
		UserCheck,
		PhoneIcon,
		Building2,
		CalendarDays,
		DollarSign,
		ListChecks,
		Sun,
		Sunset,
		Moon,
		Clock3,
		TrendingUp,
		Briefcase,
		Palmtree,
		HeartPulse
	} from 'lucide-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { updateProfile, getAllPhoneContactsProfile, getProfileStats } from './data.remote.js';
	import { getProfileContext } from '$lib/stores/profile.svelte.js';
	import { showSuccessToast, showFailToast } from '$lib/stores/toast.svelte';
	import * as Modal from '$lib/components/ui/modal';
	import { Label } from '$lib/components/ui/label';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import EmergencyContactCard from '$lib/components/custom/EmergencyContactCard.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { ChartLine } from '@lucide/svelte';
	import { PieChart, ArcChart, Text, BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';

	let { data } = $props();

	const profileStore = getProfileContext();

	let isUpdating = $state(false);

	let profile = $derived(data.profile);
	let organization = $derived(data.organization);
	let managers = $derived(data.managers);

	let contactsQuery = getAllPhoneContactsProfile();
	let contacts = $derived(contactsQuery.current?.contacts ?? []);

	let statsQuery = getProfileStats();
	let stats = $derived(statsQuery.current);

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

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

	const shiftTypeChartConfig = {
		work: { label: 'Εργασία', color: 'hsl(217 70% 60%)' },
		day_off: { label: 'Ρεπό', color: 'hsl(152 60% 45%)' },
		sick_leave: { label: 'Αναρρωτική', color: 'hsl(0 72% 51%)' },
		vacation: { label: 'Άδεια', color: 'hsl(38 92% 50%)' }
	} satisfies Chart.ChartConfig;

	const shiftCategoryChartConfig = {
		morning: { label: 'Πρωινό', color: 'hsl(45 93% 55%)' },
		afternoon: { label: 'Απογευματινό', color: 'hsl(25 90% 55%)' },
		evening: { label: 'Βραδινό', color: 'hsl(243 70% 60%)' },
		'part-time': { label: 'Μερική', color: 'hsl(280 65% 60%)' }
	} satisfies Chart.ChartConfig;

	const taskChartConfig = {
		daily: { label: 'Ημερήσια', color: 'hsl(152 60% 45%)' },
		weekly: { label: 'Εβδομαδιαία', color: 'hsl(217 70% 60%)' },
		monthly: { label: 'Μηνιαία', color: 'hsl(38 92% 50%)' }
	} satisfies Chart.ChartConfig;

	const bonusChartConfig = {
		amount: { label: 'Bonus (€)', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	let shiftTypePieData = $derived.by(() => {
		if (!stats) return [];
		return [
			{
				type: 'work',
				count: stats.shifts.byType['work'] ?? 0,
				color: shiftTypeChartConfig.work.color
			},
			{
				type: 'day_off',
				count: stats.shifts.byType['day_off'] ?? 0,
				color: shiftTypeChartConfig.day_off.color
			},
			{
				type: 'sick_leave',
				count: stats.shifts.byType['sick_leave'] ?? 0,
				color: shiftTypeChartConfig.sick_leave.color
			},
			{
				type: 'vacation',
				count: stats.shifts.byType['vacation'] ?? 0,
				color: shiftTypeChartConfig.vacation.color
			}
		].filter((d) => d.count > 0);
	});

	let shiftCategoryPieData = $derived.by(() => {
		if (!stats) return [];
		return [
			{
				cat: 'morning',
				count: stats.shifts.byCategory['morning'] ?? 0,
				color: shiftCategoryChartConfig.morning.color
			},
			{
				cat: 'afternoon',
				count: stats.shifts.byCategory['afternoon'] ?? 0,
				color: shiftCategoryChartConfig.afternoon.color
			},
			{
				cat: 'evening',
				count: stats.shifts.byCategory['evening'] ?? 0,
				color: shiftCategoryChartConfig.evening.color
			},
			{
				cat: 'part-time',
				count: stats.shifts.byCategory['part-time'] ?? 0,
				color: shiftCategoryChartConfig['part-time'].color
			}
		].filter((d) => d.count > 0);
	});

	let taskArcData = $derived.by(() => {
		if (!stats) return [];
		return [
			{
				key: 'daily',
				label: 'Ημερήσια',
				value: stats.tasks.daily,
				color: taskChartConfig.daily.color
			},
			{
				key: 'weekly',
				label: 'Εβδομαδιαία',
				value: stats.tasks.weekly,
				color: taskChartConfig.weekly.color
			},
			{
				key: 'monthly',
				label: 'Μηνιαία',
				value: stats.tasks.monthly,
				color: taskChartConfig.monthly.color
			}
		];
	});

	let bonusBarData = $derived.by(() => {
		if (!stats) return [];
		return [...stats.bonuses.history].reverse().map((p) => ({
			period: p.quarter ? `Q${p.quarter} '${String(p.year ?? '').slice(-2)}` : '—',
			amount: p.amount
		}));
	});

	let taskTotal = $derived(stats?.tasks.total ?? 0);

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
					MY PROFILE
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
							<Tabs.Trigger
								value="stats"
								class="w-full cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
							>
								<ChartLine class="mr-2 h-5 w-5" />
								<span class="hover:underline">Στατιστικά</span>
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
																	profileStore.updateFullName(full_name);
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
															<Label for="full_name">full name</Label>
															<Input
																id="full_name"
																{...updateProfile.fields.full_name.as('text')}
																bind:value={full_name}
																placeholder={profile.full_name}
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
														<Avatar.Image
															class="dark:bg-white"
															src={manager.image_url}
															alt={manager.username}
														/>
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
					<Tabs.Content value="stats" class="flex-1 animate-fade-in-up">
						{#if statsQuery.loading}
							<div class="space-y-4">
								{#each Array(4) as _}
									<div class="animate-pulse rounded-xl border bg-card p-5">
										<div class="mb-3 h-4 w-32 rounded bg-muted"></div>
										<div class="h-8 w-24 rounded bg-muted"></div>
									</div>
								{/each}
							</div>
						{:else if stats}
							<div class="space-y-8">
								<!-- Header -->
								<div>
									<h2 class="text-lg font-bold text-foreground md:text-xl">Στατιστικά</h2>
									<p class="mt-1 text-sm text-muted-foreground">Σύνοψη της δραστηριότητάς σου</p>
								</div>

								<!-- Summary Cards -->
								<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
									<div class="rounded-xl border border-border/60 bg-card p-4">
										<div class="mb-2 flex items-center gap-2 text-muted-foreground">
											<CalendarDays class="h-4 w-4" />
											<span class="text-xs font-medium tracking-wide uppercase">Βάρδιες</span>
										</div>
										<p class="text-2xl font-bold text-foreground">{stats.shifts.total}</p>
									</div>
									<div class="rounded-xl border border-border/60 bg-card p-4">
										<div class="mb-2 flex items-center gap-2 text-muted-foreground">
											<Briefcase class="h-4 w-4" />
											<span class="text-xs font-medium tracking-wide uppercase">Εργασία</span>
										</div>
										<p class="text-2xl font-bold text-foreground">
											{stats.shifts.byType['work'] ?? 0}
										</p>
									</div>
									<div class="rounded-xl border border-border/60 bg-card p-4">
										<div class="mb-2 flex items-center gap-2 text-muted-foreground">
											<DollarSign class="h-4 w-4" />
											<span class="text-xs font-medium tracking-wide uppercase">Bonus</span>
										</div>
										<p class="text-2xl font-bold text-foreground">
											{stats.bonuses.total.toFixed(2)}€
										</p>
									</div>
									<div class="rounded-xl border border-border/60 bg-card p-4">
										<div class="mb-2 flex items-center gap-2 text-muted-foreground">
											<ListChecks class="h-4 w-4" />
											<span class="text-xs font-medium tracking-wide uppercase">Tasks</span>
										</div>
										<p class="text-2xl font-bold text-foreground">{stats.tasks.total}</p>
									</div>
								</div>

								<!-- Shift Breakdown with Charts -->
								<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<!-- By Type - Pie Chart -->
									<div class="rounded-xl border border-border/60 bg-card p-5">
										<h3 class="mb-4 text-sm font-semibold text-foreground">Τύπος Βάρδιας</h3>
										{#if shiftTypePieData.length > 0}
											<div class="flex items-center gap-6">
												<div class="flex-shrink-0">
													<Chart.Container
														config={shiftTypeChartConfig}
														class="aspect-square h-[140px] w-[140px]"
													>
														<PieChart
															data={shiftTypePieData}
															key="type"
															value="count"
															c="color"
															innerRadius={40}
															props={{
																pie: {
																	motion: 'tween'
																}
															}}
														>
															{#snippet tooltip()}
																<Chart.Tooltip hideLabel indicator="line" />
															{/snippet}
														</PieChart>
													</Chart.Container>
												</div>
												<div class="flex flex-1 flex-col gap-2">
													{#each [{ key: 'work', label: 'Εργασία', icon: Briefcase, color: 'bg-blue-500' }, { key: 'day_off', label: 'Ρεπό', icon: Palmtree, color: 'bg-green-500' }, { key: 'sick_leave', label: 'Αναρρωτική', icon: HeartPulse, color: 'bg-red-500' }, { key: 'vacation', label: 'Άδεια', icon: Sun, color: 'bg-amber-500' }] as t}
														{@const count = stats.shifts.byType[t.key] ?? 0}
														{#if count > 0}
															<div class="flex items-center gap-2">
																<div class="h-2.5 w-2.5 rounded-full {t.color}"></div>
																<span class="flex-1 text-xs text-muted-foreground">{t.label}</span>
																<span class="text-xs font-semibold text-foreground">{count}</span>
															</div>
														{/if}
													{/each}
												</div>
											</div>
										{:else}
											<div
												class="flex h-[140px] items-center justify-center text-sm text-muted-foreground"
											>
												Δεν υπάρχουν δεδομένα
											</div>
										{/if}
									</div>

									<!-- By Category - Pie Chart -->
									<div class="rounded-xl border border-border/60 bg-card p-5">
										<h3 class="mb-4 text-sm font-semibold text-foreground">Κατηγορία Βάρδιας</h3>
										{#if shiftCategoryPieData.length > 0}
											<div class="flex items-center gap-6">
												<div class="flex-shrink-0">
													<Chart.Container
														config={shiftCategoryChartConfig}
														class="aspect-square h-[140px] w-[140px]"
													>
														<PieChart
															data={shiftCategoryPieData}
															key="cat"
															value="count"
															c="color"
															innerRadius={40}
															props={{
																pie: {
																	motion: 'tween'
																}
															}}
														>
															{#snippet tooltip()}
																<Chart.Tooltip hideLabel indicator="line" />
															{/snippet}
														</PieChart>
													</Chart.Container>
												</div>
												<div class="flex flex-1 flex-col gap-2">
													{#each [{ key: 'morning', label: 'Πρωινό', icon: Sun, color: 'bg-yellow-400' }, { key: 'afternoon', label: 'Απογευματινό', icon: Sunset, color: 'bg-orange-400' }, { key: 'evening', label: 'Βραδινό', icon: Moon, color: 'bg-indigo-500' }, { key: 'part-time', label: 'Μερική', icon: Clock3, color: 'bg-purple-500' }] as c}
														{@const count = stats.shifts.byCategory[c.key] ?? 0}
														{#if count > 0}
															<div class="flex items-center gap-2">
																<div class="h-2.5 w-2.5 rounded-full {c.color}"></div>
																<span class="flex-1 text-xs text-muted-foreground">{c.label}</span>
																<span class="text-xs font-semibold text-foreground">{count}</span>
															</div>
														{/if}
													{/each}
												</div>
											</div>
										{:else}
											<div
												class="flex h-[140px] items-center justify-center text-sm text-muted-foreground"
											>
												Δεν υπάρχουν δεδομένα
											</div>
										{/if}
									</div>
								</div>

								<!-- Tasks Completed - ArcChart -->
								<div class="rounded-xl border border-border/60 bg-card p-5">
									<h3 class="mb-4 text-sm font-semibold text-foreground">Tasks Ολοκληρωμένα</h3>
									{#if taskTotal > 0}
										<div class="flex items-center gap-8">
											<div class="flex-shrink-0">
												<Chart.Container
													config={taskChartConfig}
													class="aspect-square h-[160px] w-[160px]"
												>
													<ArcChart
														value="value"
														outerRadius={-10}
														innerRadius={-20}
														padding={14}
														range={[180, -180]}
														maxValue={taskTotal}
														series={taskArcData.map((d) => ({
															key: d.key,
															color: d.color,
															data: [d],
															label: d.label
														}))}
														props={{
															arc: {
																track: { class: 'fill-muted/30' },
																motion: 'tween'
															}
														}}
														tooltip={false}
													>
														{#snippet belowMarks()}
															<circle cx="0" cy="0" r="42" class="fill-card/80" />
														{/snippet}

														{#snippet aboveMarks()}
															<Text
																value={taskTotal}
																textAnchor="middle"
																verticalAnchor="middle"
																class="fill-foreground text-2xl! font-bold"
																dy={-4}
															/>
															<Text
																value="Σύνολο"
																textAnchor="middle"
																verticalAnchor="middle"
																class="fill-muted-foreground text-xs!"
																dy={16}
															/>
														{/snippet}
													</ArcChart>
												</Chart.Container>
											</div>
											<div class="flex flex-1 flex-col gap-4">
												{#each taskArcData as task}
													<div class="flex items-center gap-3">
														<div
															class="h-3 w-3 rounded-full"
															style="background-color: {task.color}"
														></div>
														<div class="flex-1">
															<div class="flex items-center justify-between">
																<span class="text-sm font-medium">{task.label}</span>
																<span class="text-base font-bold">{task.value}</span>
															</div>
															<div class="mt-1 h-1.5 w-full rounded-full bg-muted">
																<div
																	class="h-1.5 rounded-full transition-all duration-500"
																	style="width: {taskTotal > 0
																		? (task.value / taskTotal) * 100
																		: 0}%; background-color: {task.color}"
																></div>
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{:else}
										<div class="grid grid-cols-3 divide-x divide-border/40">
											<div class="pr-4 text-center">
												<p class="text-2xl font-bold text-foreground">{stats.tasks.daily}</p>
												<p class="mt-1 text-xs text-muted-foreground">Ημερήσια</p>
											</div>
											<div class="px-4 text-center">
												<p class="text-2xl font-bold text-foreground">{stats.tasks.weekly}</p>
												<p class="mt-1 text-xs text-muted-foreground">Εβδομαδιαία</p>
											</div>
											<div class="pl-4 text-center">
												<p class="text-2xl font-bold text-foreground">{stats.tasks.monthly}</p>
												<p class="mt-1 text-xs text-muted-foreground">Μηνιαία</p>
											</div>
										</div>
									{/if}
								</div>

								<!-- Bonus History - Bar Chart + List -->
								{#if stats.bonuses.history.length > 0}
									<div class="rounded-xl border border-border/60 bg-card p-5">
										<div class="mb-4 flex items-center justify-between">
											<h3 class="text-sm font-semibold text-foreground">Ιστορικό Bonus</h3>
											<span class="text-xs text-muted-foreground"
												>{stats.bonuses.count} περίοδοι</span
											>
										</div>

										<!-- Bar Chart -->
										{#if bonusBarData.length > 1}
											<div class="mb-6">
												<Chart.Container config={bonusChartConfig} class="h-[180px] w-full">
													<BarChart
														data={bonusBarData}
														xScale={scaleBand().padding(0.6)}
														x="period"
														axis="x"
														seriesLayout="group"
														series={[
															{
																key: 'amount',
																label: bonusChartConfig.amount.label,
																color: bonusChartConfig.amount.color
															}
														]}
														props={{
															xAxis: {
																format: (d: string) => d,
																tickLabelProps: {
																	class: 'text-[10px] fill-muted-foreground'
																}
															},
															bars: {
																radius: 3,
																class: 'transition-opacity hover:opacity-80'
															}
														}}
													>
														{#snippet tooltip()}
															<Chart.Tooltip>
																{#snippet formatter({ value })}
																	<span class="font-medium">{Number(value).toFixed(2)}€</span>
																{/snippet}
															</Chart.Tooltip>
														{/snippet}
													</BarChart>
												</Chart.Container>
											</div>
										{/if}

										<!-- List -->
										<div class="space-y-2">
											{#each stats.bonuses.history as payout}
												<div
													class="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3"
												>
													<div class="flex items-center gap-3">
														<TrendingUp class="h-4 w-4 text-muted-foreground" />
														<div>
															<p class="text-sm font-medium text-foreground">
																{payout.quarter ? `Q${payout.quarter}` : '—'}
																{payout.year ?? ''}
															</p>
															<p class="text-xs text-muted-foreground">
																{payout.hours_worked}h worked
															</p>
														</div>
													</div>
													<div class="text-right">
														<p class="text-sm font-semibold text-foreground">
															{payout.amount.toFixed(2)}€
														</p>
														{#if payout.status}
															<span
																class="text-xs {payout.status === 'published'
																	? 'text-green-500'
																	: 'text-muted-foreground'}"
															>
																{payout.status}
															</span>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div
								class="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
							>
								<TrendingUp class="mb-3 h-10 w-10 text-muted-foreground/40" />
								<p class="text-sm text-muted-foreground">Δεν υπάρχουν διαθέσιμα στατιστικά</p>
							</div>
						{/if}
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</div>
	</main>
</div>
