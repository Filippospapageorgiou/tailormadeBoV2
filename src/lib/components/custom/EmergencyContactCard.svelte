<!-- EmergencyContactCard.svelte -->
<script lang="ts">
	import { Phone, Mail, Copy, Check, Building2, StickyNote } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import type { importantPhoneCalls } from '$lib/models/database.types';
	import { toast } from 'svelte-sonner';

	interface Props {
		contact: importantPhoneCalls;
		index?: number;
	}

	let { contact, index = 0 }: Props = $props();

	let copiedField = $state<string | null>(null);

	function copyToClipboard(text: string, fieldId: string) {
		navigator.clipboard.writeText(text);
		copiedField = fieldId;
		toast.success('Αντιγράφηκε');
		setTimeout(() => {
			copiedField = null;
		}, 2000);
	}

	function callPhone(phone: string) {
		window.location.href = `tel:${phone}`;
	}

	function sendEmail(email: string) {
		window.location.href = `mailto:${email}`;
	}
</script>

<div
	style="animation-delay: {index * 50}ms; animation-fill-mode: backwards;"
	class="group animate-fade-in-up rounded-lg border bg-card transition-all hover:shadow-md
	{!contact.is_active ? 'border-border/40 opacity-60' : 'border-border/60'}"
>
	<div class="space-y-3 p-4">
		<!-- Header -->
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center gap-2">
					<Building2 class="h-4 w-4 shrink-0 text-muted-foreground" />
					<h3 class="truncate font-medium text-sm text-foreground">
						{contact.associated_company}
					</h3>
				</div>
				<p class="truncate text-xs text-muted-foreground">
					{contact.manager_full_name}
				</p>
			</div>

			{#if contact.is_active}
				<Badge class="shrink-0 border-none bg-green-600/10 text-green-600 text-xs">
					Ενεργή
				</Badge>
			{:else}
				<Badge class="shrink-0 border-none bg-destructive/10 text-destructive text-xs">
					Ανενεργή
				</Badge>
			{/if}
		</div>

		<!-- Contact Actions -->
		<div class="space-y-2">
			<!-- Phone -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => callPhone(contact.phone)}
					class="flex flex-1 items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
				>
					<Phone class="h-3.5 w-3.5 text-primary" />
					<span class="font-mono text-xs">{contact.phone}</span>
				</button>
				<button
					onclick={() => copyToClipboard(contact.phone, `phone-${contact.id}`)}
					class="rounded-md bg-muted/50 p-2 transition-colors hover:bg-muted"
					title="Αντιγραφή"
				>
					{#if copiedField === `phone-${contact.id}`}
						<Check class="h-3.5 w-3.5 text-green-500" />
					{:else}
						<Copy class="h-3.5 w-3.5 text-muted-foreground" />
					{/if}
				</button>
			</div>

			<!-- Email -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => sendEmail(contact.email)}
					class="flex flex-1 items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
				>
					<Mail class="h-3.5 w-3.5 text-primary" />
					<span class="truncate text-xs">{contact.email}</span>
				</button>
				<button
					onclick={() => copyToClipboard(contact.email, `email-${contact.id}`)}
					class="rounded-md bg-muted/50 p-2 transition-colors hover:bg-muted"
					title="Αντιγραφή"
				>
					{#if copiedField === `email-${contact.id}`}
						<Check class="h-3.5 w-3.5 text-green-500" />
					{:else}
						<Copy class="h-3.5 w-3.5 text-muted-foreground" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Department & Notes -->
		{#if contact.department || contact.notes}
			<div class="space-y-2 border-t pt-2">
				{#if contact.department}
					<p class="text-xs text-muted-foreground">
						<span class="font-medium">Τμήμα:</span> {contact.department}
					</p>
				{/if}
				
				{#if contact.notes}
					<div class="rounded-md bg-muted/30 p-2">
						<p class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<StickyNote class="mt-0.5 h-3 w-3 shrink-0" />
							<span class="line-clamp-2">{contact.notes}</span>
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>