<script lang="ts" module>
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
	import SendIcon from '@lucide/svelte/icons/send';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import {
		NotebookPen,
		Coffee,
		EuroIcon,
		CalendarRange,
		Globe,
		Wrench,
		Network,
		Refrigerator,
		Book,
		Users,
		Calendar,
		Cog,
		Landmark,
		ShieldCheck,
		Award,
		Building
	} from 'lucide-svelte';

	const data = {
		user: {
			name: 'shadcn',
			email: 'm@example.com',
			avatar: '/avatars/shadcn.jpg'
		},
		navMain: [
			{
				title: 'Συνταγές',
				url: '/app/recipes',
				icon: Coffee,
				isActive: true
			},
			{
				title: 'Εξοπλισμός',
				url: '/app/equipment',
				icon: Cog
			},
			{
				title: 'Καθημερινές Εργασίες',
				url: '/app/daily_tasks',
				icon: Network
			},
			{
				title: 'Μανιφέστο',
				url: '/app/manifesto',
				icon: BookOpenIcon
			},
			{
				title: 'Blog',
				url: '/app/blog',
				icon: NotebookPen
			},
			{
				title: 'Ταμείο',
				url: '/app/register',
				icon: EuroIcon
			},
			{
				title: 'Πρόγραμμα',
				url: '/app/schedule',
				icon: CalendarRange
			},
			{
				title: 'Ρυθμίσεις διαχειριστή',
				url: '/app',
				icon: Settings2Icon,
				adminOnly: true, // <-- Flag for admin-only items
				items: [
					{
						title: 'Χρήστες & Οργανισμός',
						url: '/app/settings/manage_users',
						icon: Users
					},
					{
						title: 'Πρόγραμμα',
						url: '/app/settings/schedule_settings',
						icon: Calendar
					},
					{
						title: 'Εξοπλισμός',
						url: '/app/settings/equipment_settings',
						icon: Cog
					},
					{
						title: 'Ταμείο',
						url: '/app/settings/register_settings',
						icon: Landmark
					},
					{
						title: 'Tasks',
						url: '/app/settings/task_managment',
						icon: ShieldCheck
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'legal',
				url: '/app/legal',
				icon: LifeBuoyIcon
			},
			{
				title: 'Feedback',
				url: '#',
				icon: SendIcon
			}
		],
		projects: [
			{
				name: 'Διαχείριση οργανισμών',
				url: '/app/manage_organizations',
				icon: Globe,
				items: [
					{
						title: 'Πίνακας Ελένχου',
						url: '/app/organization_managment',
						icon: Building
					},
					{
						title: 'Διαχείρηση bonus',
						url: '/app/bonus_managment',
						icon: Award
					},
					{
						title: 'Ai βοήθος',
						url: '/app/ai_assistant',
						icon: Bot
					},
					{
						title: 'Συνταγές',
						url: '/app/settings/recipes_settings',
						icon: Coffee
					},
					{
						title: 'Συστατικά',
						url: '/app/settings/ingridients_settings',
						icon: Refrigerator
					},
					{
						title: 'Blog',
						url: '/app/settings/blog_settings',
						icon: Book
					}
				]
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavProjects from './nav-projects.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { Bot } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let user = getProfileContext();

	// Filter navMain based on user role
	let filteredNavMain = $derived(
		data.navMain.filter((item) => {
			// If item is adminOnly, only show for role_id 1 or 2
			if (item.adminOnly) {
				return user.role_id === 1 || user.role_id === 2;
			}
			return true;
		})
	);
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<button
							onclick={() => {
								goto('/app/');
							}}
							{...props}
						>
							<div
								class="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-lg"
							>
								<img
									src="/iconTailor.png"
									alt="Tailor Made Coffee Roasters"
									class="size-10 object-cover"
								/>
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">Tailor Made</span>
								<span class="truncate text-xs">Enterprise</span>
							</div>
						</button>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={filteredNavMain} />
		{#if user.role_id === 1}
			<NavProjects projects={data.projects} />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
