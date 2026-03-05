<script lang="ts" module>
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
	import SendIcon from '@lucide/svelte/icons/send';
	import {
		NotebookPen,
		Coffee,
		EuroIcon,
		CalendarRange,
		Globe,
		Wrench,
		Network,
		Book,
		Users,
		Calendar,
		Cog,
		Landmark,
		ShieldCheck,
		Award,
		Building,
		PersonStanding
	} from 'lucide-svelte';
	import UserGroup from '$lib/animated/icons/user-group.svelte';
	import GlobeAlt from '$lib/animated/icons/globe-alt.svelte';

	const data = {
		navMain: [
			{
				title: 'Barista work',
				icon: UserGroup,
				isActive: false,
				items: [
					{
				title: 'Συνταγές',
				url: '/app/recipes',
				icon: Coffee,
				isActive: false
			},
			{
				title: 'Εξοπλισμός',
				url: '/app/equipment',
				icon: Cog,
				isActive: false
			},
			{
				title: 'Tasks',
				url: '/app/daily_tasks',
				icon: Network,
				isActive: false
			},
			{
				title: 'Blog',
				url: '/app/blog',
				icon: NotebookPen,
				isActive: false
			},
			{
				title: 'Manuals',
				url: '/app/manuals',
				icon: Boxes,
				isActive:false
			},
			{
				title: 'Ταμείο',
				url: '/app/register',
				icon: EuroIcon,
				isActive: false
			},
			{
				title: 'Πρόγραμμα',
				url: '/app/schedule',
				icon: CalendarRange,
				isActive: false
			},
				]
			},
			{
				title: 'Manager work',
				url: '/app',
				icon: Settings,
				isActive: false,
				adminOnly: true,
				items: [
					{
						title: 'Χρήστες & Οργανισμός',
						url: '/app/settings/manage_users',
						icon: Users,
						isActive: false
					},
					{
						title: 'Πρόγραμμα',
						url: '/app/settings/schedule_settings',
						icon: Calendar,
						isActive: false
					},
					{
						title: 'Εξοπλισμός',
						url: '/app/settings/equipment_settings',
						icon: Cog,
						isActive: false
					},
					{
						title: 'Ταμείο',
						url: '/app/settings/register_settings',
						icon: Landmark,
						isActive: false
					},
					{
						title: 'Tasks',
						url: '/app/settings/task_managment',
						icon: ShieldCheck,
						isActive: false
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'legal',
				url: '/app/legal',
				icon: LifeBuoyIcon,
				isActive: false
			},
			{
				title: 'Feedback',
				url: '#',
				icon: SendIcon,
				isActive: false
			}
		],
		projects: [
			{
				name: 'Administration',
				isActive: false,
				icon: GlobeAlt,
				items: [
					{
						title: 'Πίνακας Ελένχου',
						url: '/app/managment/organization_managment',
						icon: Building
					},
					{
						title: 'Διαχείρηση bonus',
						url: '/app/managment/bonus_managment',
						icon: Award
					},
					{
						title: 'Διαχείρηση trainers',
						url: '/app/managment/trainers',
						icon: Slack
					},
					{
						title: 'Ai βοήθος',
						url: '/app/managment/ai_assistant',
						icon: Bot
					},
					{
						title: 'Manuals',
						url: '/app/managment/manuals',
						icon: Boxes
					},
					{
						title: 'Συνταγές & Συστατικά',
						url: '/app/managment/recipes_settings',
						icon: Coffee
					},
					{
						title: 'Blog',
						url: '/app/managment/blog_settings',
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
	import { Bot, Boxes, Slack } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import Settings from '$lib/animated/icons/settings.svelte';

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
				<Sidebar.MenuButton size="lg" class="h-auto p-0 hover:bg-transparent">
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
									src="/icon.png"
									alt="Tailor Made Coffee Roasters"
									class="size-10 object-cover"
								/>
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">TAILOR MADE & VENETIS</span>
								<span class="truncate text-xs">ENTEPRISE.</span>
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
