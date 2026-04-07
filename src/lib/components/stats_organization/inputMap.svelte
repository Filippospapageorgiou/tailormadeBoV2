<script lang="ts">
	import { Map, MapMarker, MarkerContent, MarkerPopup } from '$lib/components/ui/map';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MapControls from '../ui/map/MapControls.svelte';

	let { markerPosition = $bindable() } = $props();

	function handleDragEnd(e: { lng: number; lat: number }) {
		markerPosition = { lng: e.lng, lat: e.lat };
	}
</script>

<div class="h-100 w-full">
	<Map center={[23.729757, 37.976707]} zoom={12}>
		<MapMarker
			longitude={markerPosition.lng}
			latitude={markerPosition.lat}
			draggable
			ondragend={handleDragEnd}
		>
			<MarkerContent>
				<div class="cursor-move">
					<MapPin class="fill-black stroke-white dark:fill-white" size={28} />
				</div>
			</MarkerContent>

			<MarkerPopup>
				<div class="space-y-1">
					<p class="font-medium text-foreground">Coordinates</p>
					<p class="text-xs text-muted-foreground">
						{markerPosition.lat.toFixed(4)},{markerPosition.lng.toFixed(4)}
					</p>
				</div>
			</MarkerPopup>
		</MapMarker>
		<MapControls position="bottom-right" showZoom showCompass showLocate showFullscreen />
	</Map>
</div>
