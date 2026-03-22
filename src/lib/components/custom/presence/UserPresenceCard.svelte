<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Monitor, Smartphone, Tablet } from '@lucide/svelte';
	import PresenceIndicator from './PresenceIndicator.svelte';
	import type { PresenceStatus } from '$lib/models/presence.types';

	let {
		name,
		avatarUrl,
		status,
		deviceType,
		lastSeen
	}: {
		name: string | null;
		avatarUrl: string | null;
		status: PresenceStatus;
		deviceType?: string;
		lastSeen?: string | null;
	} = $props();

	const deviceLabel = {
		desktop: 'Υπολογιστής',
		mobile: 'Κινητό',
		tablet: 'Tablet'
	} as const;

	const DeviceIcon = $derived(
		deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor
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

	const statusLabel = {
		active: 'Ενεργός',
		idle: 'Αδρανής',
		offline: 'Εκτός σύνδεσης'
	} as const;
</script>

<div
	class="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 transition-colors hover:bg-muted/40
		{status === 'offline' ? 'opacity-60' : ''}"
>
	<div class="relative">
		<Avatar.Root class="h-8 w-8">
			{#if avatarUrl}
				<Avatar.Image class="dark:bg-white" src={avatarUrl} alt={name} />
			{/if}
			<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
		</Avatar.Root>
		<span class="absolute -right-0.5 -bottom-0.5">
			<PresenceIndicator {status} size="sm" />
		</span>
	</div>

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm leading-tight font-medium">{name || 'Άγνωστος'}</p>
		{#if status === 'offline' && lastSeen}
			<p class="text-xs text-muted-foreground">{lastSeen}</p>
		{:else}
			<p class="text-xs text-muted-foreground">{statusLabel[status]}</p>
		{/if}
	</div>

	{#if deviceType && status !== 'offline'}
		<div
			title={deviceLabel[deviceType as keyof typeof deviceLabel]}
			class="text-muted-foreground/60"
		>
			<DeviceIcon class="h-3.5 w-3.5" />
		</div>
	{/if}
</div>
