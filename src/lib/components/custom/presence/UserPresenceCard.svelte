<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Monitor, Smartphone, Tablet } from 'lucide-svelte';
	import PresenceIndicator from './PresenceIndicator.svelte';
	import type { PresencePayload } from '$lib/models/presence.types';

	let { user }: { user: PresencePayload } = $props();

	const deviceLabel = {
		desktop: 'Υπολογιστής',
		mobile: 'Κινητό',
		tablet: 'Tablet'
	} as const;

	const DeviceIcon = $derived(
		user.device_type === 'mobile' ? Smartphone : user.device_type === 'tablet' ? Tablet : Monitor
	);

	function getInitials(name: string | null | undefined): string {
		if (!name) return '?';
		return name
			.split(' ')
			.filter(Boolean)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<div class="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 transition-colors hover:bg-muted/40">
	<div class="relative">
		<Avatar.Root class="h-8 w-8">
			{#if user.avatar_url}
				<Avatar.Image src={user.avatar_url} alt={user.full_name} />
			{/if}
			<Avatar.Fallback class="text-xs">{getInitials(user.full_name)}</Avatar.Fallback>
		</Avatar.Root>
		<span class="absolute -right-0.5 -bottom-0.5">
			<PresenceIndicator status={user.status} size="sm" />
		</span>
	</div>

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium leading-tight">{user.full_name || 'Άγνωστος'}</p>
		<p class="text-xs text-muted-foreground">
			{user.status === 'active' ? 'Ενεργός' : 'Αδρανής'}
		</p>
	</div>

	<div title={deviceLabel[user.device_type]} class="text-muted-foreground/60">
		<DeviceIcon class="h-3.5 w-3.5" />
	</div>
</div>
