<script lang="ts">
	import UserIcon from '@lucide/svelte/icons/user';
	import SearchIcon from '@lucide/svelte/icons/search';
	import {
		Coffee,
		Cog,
		Network,
		BookOpen,
		NotebookPen,
		Euro,
		CalendarRange,
		LifeBuoy,
		Send,
		ArrowRightIcon
	} from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { goto } from '$app/navigation';

    const profile = getProfileContext();
	let open = $state(false);   

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}else if(e.key === 'p' && (e.metaKey || e.ctrlKey)){
            e.preventDefault();
            goto(`/app/profile/${profile.id}`);
        }
	}

    function gotohref(href:string){
        open=false;
        goto(href);
    }

</script>

<svelte:document onkeydown={handleKeydown} />

<!-- Search Trigger Button -->
<button
	type="button"
	onclick={() => (open = true)}
	class="inline-flex h-10 md:w-75 bg-muted w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-4 py-3 text-sm text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
>
	<div class="flex items-center gap-3">
		<SearchIcon class="h-5 w-5" />
		<span>Search anything...</span>
	</div>
	<div class="hidden md:flex md:items-center md:gap-2">
		<kbd
			class="pointer-events-none inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground select-none"
		>
			<span class="text-sm">⌘</span>
		</kbd>
		<kbd
			class="pointer-events-none inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground select-none"
		>
			<span class="text-sm">K</span>
		</kbd>
	</div>
</button>

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		
		<!-- Main Pages -->
		<Command.Group heading="Κύριες Σελίδες">
			<Command.Item onSelect={() =>   gotohref('/app/recipes')}>
				<Coffee class="me-2 size-4" />
				<span>Συνταγές</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/equipment')}>
				<Cog class="me-2 size-4" />
				<span>Εξοπλισμός</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/daily_tasks')}>
				<Network class="me-2 size-4" />
				<span>Καθημερινές Εργασίες</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() =>gotohref('/app/manifesto')}>
				<BookOpen class="me-2 size-4" />
				<span>Μανιφέστο</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/blog')}>
				<NotebookPen class="me-2 size-4" />
				<span>Blog</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() =>gotohref('/app/register')}>
				<Euro class="me-2 size-4" />
				<span>Ταμείο</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() =>gotohref('/app/schedule')}>
				<CalendarRange class="me-2 size-4" />
				<span>Πρόγραμμα</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
		</Command.Group>

		<Command.Separator />

		<!-- User & Profile -->
		<Command.Group heading="Προφίλ">
			<Command.Item onSelect={() => gotohref(`/app/profile/${profile.id}`)}>
				<UserIcon class="me-2 size-4" />
				<span>Το Προφίλ μου</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
		</Command.Group>

		<Command.Separator />

		<!-- Admin Settings (for role_id 1 and 2) -->
		{#if profile.role_id === 1 || profile.role_id === 2}
		<Command.Group heading="Ρυθμίσεις Διαχειριστή">
			<Command.Item onSelect={() => gotohref('/app/settings/manage_users')}>
				<UserIcon class="me-2 size-4" />
				<span>Χρήστες & Οργανισμός</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/schedule_settings')}>
				<CalendarRange class="me-2 size-4" />
				<span>Διαχειρήση Πρόγραμμα</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/equipment_settings')}>
				<Cog class="me-2 size-4" />
				<span>Διαχειρήση Εξοπλισμός</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/register_settings')}>
				<Euro class="me-2 size-4" />
				<span>Διαχειρήση Ταμείο</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/task_managment')}>
				<Network class="me-2 size-4" />
				<span>Διαχειρήση Tasks</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
		</Command.Group>

		<Command.Separator />
		{/if}

		<!-- Organization Management (for role_id 1 only - Super Admin) -->
		{#if profile.role_id === 1}
		<Command.Group heading="Διαχείριση Οργανισμών">
			<Command.Item onSelect={() => gotohref('/app/organization_managment')}>
				<BookOpen class="me-2 size-4" />
				<span>Πίνακας Ελένχου</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/recipes_settings')}>
				<Coffee class="me-2 size-4" />
				<span>Συνταγές</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/ingridients_settings')}>
				<Cog class="me-2 size-4" />
				<span>Συστατικά</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item onSelect={() => gotohref('/app/settings/blog_settings')}>
				<NotebookPen class="me-2 size-4" />
				<span>Blog</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
		</Command.Group>

		<Command.Separator />
		{/if}

		<!-- Secondary -->
		<Command.Group heading="Υποστήριξη">
			<Command.Item onSelect={() => gotohref('/app/legal')}>
				<LifeBuoy class="me-2 size-4" />
				<span>Legal</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
			<Command.Item>
				<Send class="me-2 size-4" />
				<span>Feedback</span>
                <ArrowRightIcon class="ml-auto size-3.5 text-muted-foreground" />
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>