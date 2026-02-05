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
		Building,
		PersonStanding
	} from 'lucide-svelte';

	const data = {
		navMain: [
			{
				title: 'Barista work',
				url: '/app',
				icon: PersonStanding,
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
				title: 'Καθημερινές Εργασίες',
				url: '/app/daily_tasks',
				icon: Network,
				isActive: false
			},
			{
				title: 'Μανιφέστο',
				url: '/app/manifesto',
				icon: BookOpenIcon,
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
				icon: Settings2Icon,
				isActive: false,
				newLine: true,
				adminOnly: true, // <-- Flag for admin-only items
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
				url: '/app/manage_organizations',
				icon: Globe,
				items: [
					{
						title: 'Πίνακας Ελένχου',
						url: '/managment/organization_managment',
						icon: Building
					},
					{
						title: 'Διαχείρηση bonus',
						url: '/managment/bonus_managment',
						icon: Award
					},
					{
						title: 'Ai βοήθος',
						url: '/managment/ai_assistant',
						icon: Bot
					},
					{
						title: 'Manuals',
						url: '/managment/manuals',
						icon: Boxes
					},
					{
						title: 'Συνταγές',
						url: '/managment/recipes_settings',
						icon: Coffee
					},
					{
						title: 'Συστατικά',
						url: '/managment/ingridients_settings',
						icon: Refrigerator
					},
					{
						title: 'Blog',
						url: '/managment/blog_settings',
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
	import { Bot, Boxes } from '@lucide/svelte';
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
									src="/knowHow.png"
									alt="Tailor Made Coffee Roasters"
									class="size-10 object-cover"
								/>
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">KNOWHOW</span>
								<span class="truncate text-xs">TECHNOLOGIES.</span>
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
