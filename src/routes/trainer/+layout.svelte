<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ThemeSelector } from '$lib/components/ui/theme-selector';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { enhance } from '$app/forms';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import {
		ClipboardList,
		LayoutDashboard,
		LogOut,
		User,
		ChevronRight,
		GraduationCap
	} from 'lucide-svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { setAssignmentStore } from '$lib/stores/assignedOrg.svelte';

	let assignmentStore = setAssignmentStore(null); // initialize empty
	let { children } = $props();

	let user = getProfileContext();

	const navLinks = [
		{
			href: '/trainer',
			label: 'Dashboard',
			icon: LayoutDashboard
		},
		{
			href: '/trainer/evaluations',
			label: 'Αξιολογήσεις',
			icon: ClipboardList
		}
	];

	function isActive(href: string): boolean {
		if (href === '/trainer') {
			return page.url.pathname === '/trainer';
		}
		return page.url.pathname.startsWith(href);
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	// Breadcrumb: derive readable segments from pathname
	let breadcrumbs = $derived(() => {
		const labelMap: Record<string, string> = {
			trainer: 'Trainer',
			evaluations: 'Αξιολογήσεις',
			new: 'Νέα Αξιολόγηση',
			profile: 'Προφίλ'
		};

		const segments = page.url.pathname.split('/').filter(Boolean);
		let cumulative = '';
		return segments.map((seg, i) => {
			cumulative += `/${seg}`;
			const isLast = i === segments.length - 1;
			// If segment looks like a UUID/id, label it accordingly
			const isId = seg.length > 20 || /^[0-9a-f-]{36}$/i.test(seg);
			return {
				label: isId ? 'Αξιολόγηση' : (labelMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)),
				href: cumulative,
				isLast
			};
		});
	});

	let isLoggingOut = $state(false);
	async function handleLogout() {
		if (isLoggingOut) {
			return true;
		}

		isLoggingOut = true;
		try {
			const response = await fetch('/auth/api/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error logging out');
			}

			window.location.reload();
		} catch (error) {
			console.error('Logout failed:', error);
			isLoggingOut = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-background font-[Sansation,sans-serif]">
	<!-- Top Navbar -->
	<header
		class="sticky top-2 z-40 mx-2 mt-1 flex h-14 shrink-0 items-center justify-between rounded-lg border border-border/50 bg-background/80 px-4 shadow-sm backdrop-blur-md"
	>
		<!-- Left: Logo + nav links -->
		<div class="flex items-center gap-4">
			<!-- Logo -->
			<button
				onclick={() => goto('/trainer')}
				class="flex items-center gap-2.5 transition-opacity hover:opacity-80"
			>
				<div class="flex size-8 items-center justify-center overflow-hidden rounded-lg">
					<img src="/icon.png" alt="Tailor Made" class="size-8 object-cover" />
				</div>
				<div class="hidden flex-col sm:flex">
					<span class="text-xs font-semibold leading-none tracking-wide">TAILOR MADE</span>
					<span class="text-[10px] leading-none text-muted-foreground">TRAINER PORTAL</span>
				</div>
			</button>

			<Separator orientation="vertical" class="h-5" />

			<!-- Nav links -->
			<nav class="flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{isActive(link.href)
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<link.icon class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">{link.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Breadcrumb (hidden on mobile) -->
			{#if breadcrumbs().length > 1}
				<Separator orientation="vertical" class="hidden h-4 md:block" />
				<nav class="hidden items-center gap-1 md:flex">
					{#each breadcrumbs() as crumb, i}
						{#if i > 0}
							<ChevronRight class="h-3 w-3 text-muted-foreground/50" />
							{#if crumb.isLast}
								<span class="text-xs font-medium text-foreground">{crumb.label}</span>
							{:else}
								<a
									href={crumb.href}
									class="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
								>
									{crumb.label}
								</a>
							{/if}
						{/if}
					{/each}
				</nav>
			{/if}
		</div>

		<!-- Right: Theme + Trainer badge + Avatar -->
		<div class="flex items-center gap-2">
			<!-- Trainer role pill -->
			<div
				class="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 sm:flex"
			>
				<GraduationCap class="h-3 w-3 text-primary" />
				<span class="text-xs font-medium text-primary">Trainer</span>
			</div>

			<ThemeSelector />

			<!-- User dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Avatar.Root class="h-8 w-8 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary/30">
						<Avatar.Image src={user.imageUrl} alt={user.username} class="dark:bg-white" />
						<Avatar.Fallback class="text-xs font-medium">
							{getInitials(user.username ?? 'TM')}
						</Avatar.Fallback>
					</Avatar.Root>
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="end" class="w-52">
					<div class="px-1 py-2">
						<p class="text-sm font-medium">{user.username}</p>
						<p class="text-xs text-muted-foreground">{user.email ?? 'Trainer'}</p>
					</div>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={() => goto('/trainer/profile')}>
						<User class="mr-2 h-4 w-4" />
						Προφίλ
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>
					<LogOut />
					<button
						onclick={handleLogout}
						disabled={isLoggingOut}
						class="flex w-full cursor-pointer items-center gap-2 text-start"
					>
						{#if isLoggingOut}
							<Spinner />
						{/if}
						<span>
							{isLoggingOut ? 'Logging out...' : 'Log out'}
						</span>
					</button>
				</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</header>

	<!-- Page content -->
	<main class="flex flex-1 flex-col">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="py-4 text-center">
		<p class="text-xs text-muted-foreground/50">
			ⓒ TAILORMADE · TRAINER PORTAL
		</p>
	</footer>
</div>