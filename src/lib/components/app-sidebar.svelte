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

		ShieldCheck





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
				icon: Wrench
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
				items: [
					{
						title: 'Χρήστες',
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
				url: '/app/organizations',
				icon: Globe,
				items: [
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
	import CommandIcon from '@lucide/svelte/icons/command';
	import type { ComponentProps } from 'svelte';
	import { getProfileContext } from '$lib/stores/profile.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	let user = getProfileContext();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent text-sidebar-primary-foreground"
							>
								<img src="/iconTailor.png" alt="Tailor Made Coffee Roasters" class="size-4" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">Tailor Made</span>
								<span class="truncate text-xs">Enterprise</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		{#if user.role_id === 1}
			<NavProjects projects={data.projects} />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
