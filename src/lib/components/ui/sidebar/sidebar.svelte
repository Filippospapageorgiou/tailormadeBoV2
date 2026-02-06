<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { SIDEBAR_WIDTH_MOBILE } from "./constants.js";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		side = "left",
		variant = "sidebar",
		collapsible = "offcanvas",
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		side?: "left" | "right";
		variant?: "sidebar" | "floating" | "inset";
		collapsible?: "offcanvas" | "icon" | "none";
	} = $props();

	const sidebar = useSidebar();
</script>

{#if collapsible === "none"}
	<div
		class={cn(
			"relative overflow-hidden bg-background/70 backdrop-blur-xl text-sidebar-foreground w-(--sidebar-width) flex h-full flex-col border border-border/50 rounded-lg shadow-sm",
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		<!-- Ambient glow blobs -->
		<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div
				class="absolute -top-20 -left-20 h-60 w-60 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
				style="animation-duration: 6s;"
			></div>
			<div
				class="absolute -right-16 bottom-1/3 h-48 w-48 animate-pulse rounded-full bg-primary/8 blur-3xl dark:bg-primary/4"
				style="animation-duration: 8s;"
			></div>
		</div>
		{@render children?.()}
	</div>
{:else if sidebar.isMobile}
	<Sheet.Root
		bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)}
		{...restProps}
	>
		<Sheet.Content
			data-sidebar="sidebar"
			data-slot="sidebar"
			data-mobile="true"
			class="!bg-transparent text-sidebar-foreground w-auto !p-3 [&>button]:hidden !border-none !shadow-none"
			style="--sidebar-width: {SIDEBAR_WIDTH_MOBILE};"
			{side}
		>
			<Sheet.Header class="sr-only">
				<Sheet.Title>Sidebar</Sheet.Title>
				<Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
			</Sheet.Header>
			<div class="relative flex h-full w-[calc(var(--sidebar-width)-24px)] flex-col bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden shadow-lg">
				<!-- Subtle single blob for mobile — less intense -->
				<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
					<div
						class="absolute -top-16 -left-16 h-48 w-48 animate-pulse rounded-full bg-primary/8 blur-3xl dark:bg-primary/4"
						style="animation-duration: 7s;"
					></div>
				</div>
				{@render children?.()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<div
		bind:this={ref}
		class="text-sidebar-foreground group peer hidden md:block"
		data-state={sidebar.state}
		data-collapsible={sidebar.state === "collapsed" ? collapsible : ""}
		data-variant={variant}
		data-side={side}
		data-slot="sidebar"
	>
		<div
			data-slot="sidebar-gap"
			class={cn(
				"w-(--sidebar-width) relative bg-transparent transition-[width] duration-200 ease-linear",
				"group-data-[collapsible=offcanvas]:w-0",
				"group-data-[side=right]:rotate-180",
				variant === "floating" || variant === "inset"
					? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
					: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
			)}
		></div>
		<div
			data-slot="sidebar-container"
			class={cn(
				"w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex py-2 pl-2",
				side === "left"
					? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
					: "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
				variant === "floating" || variant === "inset"
					? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
					: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
				className
			)}
			{...restProps}
		>
			<div
				data-sidebar="sidebar"
				data-slot="sidebar-inner"
				class="relative overflow-hidden bg-background/70 backdrop-blur-xl border border-border/50 rounded-lg flex h-full w-full flex-col shadow-sm"
			>
				<!-- Ambient glow blobs -->
				<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
					<div
						class="absolute -top-20 -left-20 h-60 w-60 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
						style="animation-duration: 6s;"
					></div>
					<div
						class="absolute -right-16 bottom-1/4 h-48 w-48 animate-pulse rounded-full bg-primary/8 blur-3xl dark:bg-primary/4"
						style="animation-duration: 8s;"
					></div>
					<div
						class="absolute -bottom-16 left-1/3 h-40 w-40 animate-pulse rounded-full bg-primary/6 blur-3xl dark:bg-primary/3"
						style="animation-duration: 10s;"
					></div>
				</div>
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}