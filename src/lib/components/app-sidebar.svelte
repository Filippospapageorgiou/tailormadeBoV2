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
				title: 'Manager work',
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
            <Sidebar.MenuButton size="lg" class="h-auto p-0 hover:bg-transparent">
                {#snippet child({ props })}
                    <button
                        onclick={() => {
                            goto('/app/');
                        }}
                        {...props}
                        class="w-full overflow-hidden rounded-lg bg-gradient-to-b from-gray-900 to-gray-600"
                    >
                        <div class="flex h-20 w-full items-center justify-center p-2">
                            <img
                                src="/knowHowTech-removebg-preview.png"
                                alt="Tailor Made Coffee Roasters"
                                class="h-auto w-full object-contain"
                            />
                        </div>
                    </button>
                {/snippet}
            </Sidebar.MenuButton>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Header>
	<Sidebar.Content>
		{#if user.role_id !== 1}
			<NavMain items={filteredNavMain} />
		{/if}
		{#if user.role_id === 1}
			<NavProjects projects={data.projects} />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
