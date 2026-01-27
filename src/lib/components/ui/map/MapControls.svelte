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
	let originalStyles: {
		position: string;
		top: string;
		left: string;
		width: string;
		height: string;
		zIndex: string;
		transition: string;
	} | null = $state(null);

	function handleFullscreen() {
		const map = mapCtx.getMap();
		const container = map?.getContainer();
		if (!container) return;

		// Check if real fullscreen API is available (not iOS Safari)
		const canFullscreen =
			document.fullscreenEnabled ||
			// @ts-ignore - vendor prefixes
			document.webkitFullscreenEnabled;

		if (canFullscreen && !isIOS()) {
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
			// Fallback: CSS-based "fullscreen" for iOS Safari
			isFullscreen = !isFullscreen;

			if (isFullscreen) {
				// Save original styles for restoration
				originalStyles = {
					position: container.style.position,
					top: container.style.top,
					left: container.style.left,
					width: container.style.width,
					height: container.style.height,
					zIndex: container.style.zIndex,
					transition: container.style.transition
				};

				// Add transition for smooth animation
				container.style.transition = 'all 0.3s ease-in-out';

				// Use requestAnimationFrame to ensure transition works
				requestAnimationFrame(() => {
					container.style.position = 'fixed';
					container.style.top = '0';
					container.style.left = '0';
					container.style.width = '100vw';
					container.style.height = '100vh';
					// Use env() for safe areas (notch, home indicator)
					container.style.height =
						'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))';
					container.style.top = 'env(safe-area-inset-top)';
					container.style.zIndex = '9999';
					document.body.style.overflow = 'hidden';

					// Prevent body scroll on iOS
					document.body.style.position = 'fixed';
					document.body.style.width = '100%';
				});

				// Resize map after animation completes
				setTimeout(() => map?.resize(), 350);
			} else {
				// Restore original styles with animation
				container.style.transition = 'all 0.3s ease-in-out';

				requestAnimationFrame(() => {
					container.style.position = originalStyles?.position || '';
					container.style.top = originalStyles?.top || '';
					container.style.left = originalStyles?.left || '';
					container.style.width = originalStyles?.width || '';
					container.style.height = originalStyles?.height || '';
					container.style.zIndex = originalStyles?.zIndex || '';
					document.body.style.overflow = '';
					document.body.style.position = '';
					document.body.style.width = '';
				});

				// Clean up transition and resize after animation
				setTimeout(() => {
					container.style.transition = originalStyles?.transition || '';
					map?.resize();
					originalStyles = null;
				}, 350);
			}
		}
	}

	// Detect iOS (Safari doesn't support fullscreen API)
	function isIOS(): boolean {
		return (
			/iPad|iPhone|iPod/.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
		);
	}

	// Handle back gesture / escape key to exit fullscreen
	$effect(() => {
		if (!isFullscreen) return;

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isFullscreen && isIOS()) {
				handleFullscreen(); // Exit fullscreen
			}
		};

		// Handle popstate for back gesture on iOS
		const handlePopstate = () => {
			if (isFullscreen && isIOS()) {
				handleFullscreen(); // Exit fullscreen
			}
		};

		// Push a fake history state so back gesture works
		if (isIOS()) {
			window.history.pushState({ mapFullscreen: true }, '');
		}

		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('popstate', handlePopstate);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('popstate', handlePopstate);
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
