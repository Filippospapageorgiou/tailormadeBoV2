<script lang="ts">
	import type { Column } from "@tanstack/table-core";
	import type { DailyRegisterClosing } from "$lib/models/register.types";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils";

	interface Props {
		column: Column<DailyRegisterClosing>;
		title: string;
		class?: string;
	}

	let { column, title, class: className }: Props = $props();
</script>

{#if !column?.getCanSort()}
	<div class={className}>
		{title}
	</div>
{:else}
	<div class={cn("flex items-center", className)}>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="sm"
						class="data-[state=open]:bg-accent -ml-3 h-8"
					>
						<span>{title}</span>
						{#if column.getIsSorted() === "desc"}
							<ArrowDownIcon class="ml-2 h-4 w-4" />
						{:else if column.getIsSorted() === "asc"}
							<ArrowUpIcon class="ml-2 h-4 w-4" />
						{:else}
							<ChevronsUpDownIcon class="ml-2 h-4 w-4" />
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.Item onclick={() => column.toggleSorting(false)}>
					<ArrowUpIcon class="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
					Asc
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => column.toggleSorting(true)}>
					<ArrowDownIcon class="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
					Desc
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={() => column.clearSorting()}>
					Clear
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/if}