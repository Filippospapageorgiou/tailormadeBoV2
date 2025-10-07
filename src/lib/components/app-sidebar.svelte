<script lang="ts" module>
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import BotIcon from "@lucide/svelte/icons/bot";
	import ChartPieIcon from "@lucide/svelte/icons/chart-pie";
	import FrameIcon from "@lucide/svelte/icons/frame";
	import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
	import MapIcon from "@lucide/svelte/icons/map";
	import SendIcon from "@lucide/svelte/icons/send";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import { NotebookPen, Coffee, EuroIcon, CalendarRange  } from "lucide-svelte";
	


	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Recipes",
				url: "/app/recipes",
				icon: Coffee,
				isActive: true,
			},
			{
				title: "Manifesto",
				url: "/app/manifesto",
				icon: BookOpenIcon,
			},
			{
				title: "Blog",
				url: "/app/blog",
				icon: NotebookPen,
			},
			{
				title: "Register",
				url:"/app/register",
				icon: EuroIcon,
			},
			{
				title: "Scedule",
				url:"/app/register",
				icon: CalendarRange
			},
			{
				title: "Admin Settings",
				requiresAdmin: true,
				url: "/app",
				icon: Settings2Icon,
				items: [
					{
						title: "Recipes",
						url: "/app/settings/recipes_settings",
					},
					{
						title: "Ingridients",
						url: "/app/settings/ingridients_settings",
					},
					{
						title: "Blog",
						url: "/app/settings/blog_settings",
					},
					{
						title: "Manage users",
						url: "/app/settings/manage_users",
					},
				],
			},
		],
		navSecondary: [
			{
				title: "Support",
				url: "#",
				icon: LifeBuoyIcon,
			},
			{
				title: "Feedback",
				url: "#",
				icon: SendIcon,
			},
		],
		projects: [
			{
				name: "Design Engineering",
				url: "#",
				icon: FrameIcon,
			},
			{
				name: "Sales & Marketing",
				url: "#",
				icon: ChartPieIcon,
			},
			{
				name: "Travel",
				url: "#",
				icon: MapIcon,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavProjects from "./nav-projects.svelte";
	import NavSecondary from "./nav-secondary.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import CommandIcon from "@lucide/svelte/icons/command";
	import type { ComponentProps } from "svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<CommandIcon class="size-4" />
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
		<NavProjects projects={data.projects} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
