<script lang="ts">
	import { getContext } from 'svelte';
	import MapLibreGL from 'maplibre-gl';
	import { cn } from '$lib/utils.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Locate from '@lucide/svelte/icons/locate';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface Props {
		position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		showZoom?: boolean;
		showCompass?: boolean;
		showLocate?: boolean;
		showFullscreen?: boolean;
		class?: string;
		onlocate?: (coords: { longitude: number; latitude: number }) => void;
	}

	let {
		position = 'bottom-right',
		showZoom = true,
		showCompass = false,
		showLocate = false,
		showFullscreen = false,
		class: className,
		onlocate
	}: Props = $props();

	const mapCtx = getContext<{
		getMap: () => MapLibreGL.Map | null;
		isLoaded: () => boolean;
	}>('map');

	let waitingForLocation = $state(false);
	let compassElement: SVGSVGElement | null = $state(null);
	const loaded = $derived(mapCtx.isLoaded());

	const positionClasses = {
		'top-left': 'top-2 left-2',
		'top-right': 'top-2 right-2',
		'bottom-left': 'bottom-2 left-2',
		'bottom-right': 'bottom-10 right-2'
	};

	// Update compass rotation
	$effect(() => {
		const map = mapCtx.getMap();

		if (!loaded || !map || !compassElement) return;

		const updateRotation = () => {
			if (!compassElement) return;
			const bearing = map.getBearing();
			const pitch = map.getPitch();
			compassElement.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
		};

		map.on('rotate', updateRotation);
		map.on('pitch', updateRotation);
		updateRotation();

		return () => {
			map.off('rotate', updateRotation);
			map.off('pitch', updateRotation);
		};
	});

	function handleZoomIn() {
		const map = mapCtx.getMap();
		map?.zoomTo(map.getZoom() + 1, { duration: 300 });
	}

	function handleZoomOut() {
		const map = mapCtx.getMap();
		map?.zoomTo(map.getZoom() - 1, { duration: 300 });
	}

	function handleResetBearing() {
		const map = mapCtx.getMap();
		map?.resetNorthPitch({ duration: 300 });
	}

	function handleLocate() {
		const map = mapCtx.getMap();
		if (!map) return;

		waitingForLocation = true;

		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const coords = {
						longitude: position.coords.longitude,
						latitude: position.coords.latitude
					};
					map.flyTo({
						center: [coords.longitude, coords.latitude],
						zoom: 14,
						duration: 1500
					});
					onlocate?.(coords);
					waitingForLocation = false;
				},
				(error) => {
					console.error('Error getting location:', error);
					waitingForLocation = false;
				}
			);
		}
	}

	let isFullscreen = $state(false);

	function handleFullscreen() {
		const map = mapCtx.getMap();
		const container = map?.getContainer();
		if (!container) return;

		// Check if real fullscreen API is available and works (not iOS)
		const canFullscreen =
			document.fullscreenEnabled ||
			// @ts-ignore - vendor prefixes
			document.webkitFullscreenEnabled;

		if (canFullscreen) {
			// Use native fullscreen where supported
			if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if ((document as any).webkitExitFullscreen) {
					(document as any).webkitExitFullscreen();
				}
				isFullscreen = false;
			} else {
				if (container.requestFullscreen) {
					container.requestFullscreen();
				} else if ((container as any).webkitRequestFullscreen) {
					(container as any).webkitRequestFullscreen();
				}
				isFullscreen = true;
			}
		} else {
			// Fallback: CSS-based "fullscreen" for iOS
			isFullscreen = !isFullscreen;

			if (isFullscreen) {
				container.style.position = 'fixed';
				container.style.top = '0';
				container.style.left = '0';
				container.style.width = '100vw';
				container.style.height = '100vh';
				container.style.zIndex = '9999';
				document.body.style.overflow = 'hidden';
			} else {
				container.style.position = '';
				container.style.top = '';
				container.style.left = '';
				container.style.width = '';
				container.style.height = '';
				container.style.zIndex = '';
				document.body.style.overflow = '';
			}

			// Trigger map resize after style change
			setTimeout(() => map?.resize(), 100);
		}
	}

	// Listen for fullscreen change events (for native fullscreen)
	$effect(() => {
		const handleChange = () => {
			isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleChange);
		document.addEventListener('webkitfullscreenchange', handleChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleChange);
			document.removeEventListener('webkitfullscreenchange', handleChange);
		};
	});
</script>

{#if loaded}
	<div class={cn('absolute z-10 flex flex-col gap-1.5', positionClasses[position], className)}>
		{#if showZoom}
			<div
				class="flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-border"
			>
				<button
					onclick={handleZoomIn}
					aria-label="Zoom in"
					type="button"
					class="flex size-8 items-center justify-center transition-colors hover:bg-accent dark:hover:bg-accent/40"
				>
					<Plus class="size-4" />
				</button>
				<button
					onclick={handleZoomOut}
					aria-label="Zoom out"
					type="button"
					class="flex size-8 items-center justify-center transition-colors hover:bg-accent dark:hover:bg-accent/40"
				>
					<Minus class="size-4" />
				</button>
			</div>
		{/if}

		{#if showCompass}
			<div
				class="flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm"
			>
				<button
					onclick={handleResetBearing}
					aria-label="Reset bearing to north"
					type="button"
					class="flex size-8 items-center justify-center transition-colors hover:bg-accent"
				>
					<svg
						bind:this={compassElement}
						viewBox="0 0 24 24"
						class="size-5 transition-transform duration-200"
						style="transform-style: preserve-3d;"
					>
						<path d="M12 2L16 12H12V2Z" class="fill-red-500" />
						<path d="M12 2L8 12H12V2Z" class="fill-red-300" />
						<path d="M12 22L16 12H12V22Z" class="fill-muted-foreground/60" />
						<path d="M12 22L8 12H12V22Z" class="fill-muted-foreground/30" />
					</svg>
				</button>
			</div>
		{/if}

		{#if showLocate}
			<div
				class="flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm"
			>
				<button
					onclick={handleLocate}
					aria-label="Find my location"
					type="button"
					class={cn(
						'flex size-8 items-center justify-center transition-colors hover:bg-accent dark:hover:bg-accent/40',
						waitingForLocation && 'pointer-events-none cursor-not-allowed opacity-50'
					)}
					disabled={waitingForLocation}
				>
					{#if waitingForLocation}
						<Loader2 class="animate-spin size-4" />
					{:else}
						<Locate class="size-4" />
					{/if}
				</button>
			</div>
		{/if}

		{#if showFullscreen}
			<div
				class="flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm"
			>
				<button
					onclick={handleFullscreen}
					aria-label="Toggle fullscreen"
					type="button"
					class="flex size-8 items-center justify-center transition-colors hover:bg-accent dark:hover:bg-accent/40"
				>
					<Maximize class="size-4" />
				</button>
			</div>
		{/if}
	</div>
{/if}
