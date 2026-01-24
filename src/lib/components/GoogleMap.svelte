<script>
	import { onMount, onDestroy } from 'svelte';

	let { lines = [], center = { lat: 12.9716, lng: 77.5946 }, zoom = 13 } = $props();

	let mapContainer;
	let map;
	let google;
	let polylines = [];
	let markers = [];

	const statusColors = {
		ok: '#10b981', // Emerald 500
		damaged: '#ef4444', // Red 500
		warning: '#f59e0b' // Amber 500
	};

	onMount(async () => {
		// 1. Configure the loader
		const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

		setOptions({
			key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
			v: 'weekly'
			// Add other options if needed, e.g. language, region
		});

		try {
			// 2. Load required libraries
			await importLibrary('maps');
			await importLibrary('marker');

			// 3. Assign global google object for easier access to namespaces (e.g. google.maps.Animation)
			google = window.google;

			const { Map } = google.maps;

			map = new Map(mapContainer, {
				center,
				zoom,
				mapId: 'DEMO_MAP_ID', // Required for advanced markers if used, or just good practice
				styles: [
					// Dark mode style for "GridSense" vibe
					{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
					{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
					{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
					{
						featureType: 'administrative.locality',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#d59563' }]
					},
					{
						featureType: 'poi',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#d59563' }]
					},
					{
						featureType: 'poi.park',
						elementType: 'geometry',
						stylers: [{ color: '#263c3f' }]
					},
					{
						featureType: 'poi.park',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#6b9a76' }]
					},
					{
						featureType: 'road',
						elementType: 'geometry',
						stylers: [{ color: '#38414e' }]
					},
					{
						featureType: 'road',
						elementType: 'geometry.stroke',
						stylers: [{ color: '#212a37' }]
					},
					{
						featureType: 'road',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#9ca5b3' }]
					},
					{
						featureType: 'road.highway',
						elementType: 'geometry',
						stylers: [{ color: '#746855' }]
					},
					{
						featureType: 'road.highway',
						elementType: 'geometry.stroke',
						stylers: [{ color: '#1f2835' }]
					},
					{
						featureType: 'road.highway',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#f3d19c' }]
					},
					{
						featureType: 'transit',
						elementType: 'geometry',
						stylers: [{ color: '#2f3948' }]
					},
					{
						featureType: 'transit.station',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#d59563' }]
					},
					{
						featureType: 'water',
						elementType: 'geometry',
						stylers: [{ color: '#17263c' }]
					},
					{
						featureType: 'water',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#515c6d' }]
					},
					{
						featureType: 'water',
						elementType: 'labels.text.stroke',
						stylers: [{ color: '#17263c' }]
					}
				]
			});

			renderLines();
		} catch (e) {
			console.error('Error loading Google Maps', e);
			if (mapContainer) {
				mapContainer.innerHTML = `<div class="p-4 text-red-400">Error loading Google Maps. Check API Key.</div>`;
			}
		}
	});

	$effect(() => {
		if (map && lines) {
			renderLines();
		}
	});

	function renderLines() {
		if (!map || !google) return;

		// Clear existing
		polylines.forEach((p) => p.setMap(null));
		markers.forEach((m) => m.setMap(null));
		polylines = [];
		markers = [];

		lines.forEach((line) => {
			// Draw Line
			const polyline = new google.maps.Polyline({
				path: line.path,
				geodesic: true,
				strokeColor: statusColors[line.status] || '#999',
				strokeOpacity: 1.0,
				strokeWeight: line.status === 'damaged' ? 4 : 2,
				map: map
			});

			// Add info window on click
			const infoWindow = new google.maps.InfoWindow({
				content: `
          <div style="color: #333; padding: 5px;">
            <h3 style="margin: 0 0 5px; font-weight: bold;">${line.name}</h3>
            <p style="margin: 0;">Status: <span style="font-weight: bold; color: ${statusColors[line.status]}">${line.status.toUpperCase()}</span></p>
            <p style="margin: 0;">Load: ${line.load}</p>
            <p style="margin: 0;">Voltage: ${line.voltage}</p>
          </div>
        `
			});

			polyline.addListener('click', (event) => {
				infoWindow.setPosition(event.latLng);
				infoWindow.open(map);
			});

			polylines.push(polyline);

			// If damaged, add a marker
			if (line.status === 'damaged' && line.damageLocation) {
				const marker = new google.maps.Marker({
					position: line.damageLocation,
					map: map,
					title: 'Damage Detected!',
					animation: google.maps.Animation.BOUNCE,
					icon: {
						path: google.maps.SymbolPath.CIRCLE,
						scale: 10,
						fillColor: '#ef4444',
						fillOpacity: 1,
						strokeWeight: 2,
						strokeColor: 'white'
					}
				});

				const warningInfo = new google.maps.InfoWindow({
					content: `<div style="color: #d32f2f;"><strong>DAMAGE ALERT</strong><br>${line.damageType}</div>`
				});

				marker.addListener('click', () => {
					warningInfo.open(map, marker);
				});

				markers.push(marker);
			}
		});
	}

	onDestroy(() => {
		// Cleanup if needed
	});
</script>

<div
	class="group relative h-full w-full overflow-hidden rounded-xl border border-gray-700 shadow-2xl"
>
	<div
		bind:this={mapContainer}
		class="flex h-full w-full items-center justify-center bg-gray-900 text-gray-400"
	>
		Loading Map...
	</div>

	<!-- Optional overlay text for no API key situation if it fails silently -->
	{#if !import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
		<div
			class="absolute top-2 left-2 z-50 rounded border border-red-500/50 bg-red-900/80 p-2 text-xs text-white backdrop-blur-md"
		>
			Warning: No Google Maps API Key found inside environmental variables.
		</div>
	{/if}
</div>

<style>
	/* Any specific map overrides */
</style>
