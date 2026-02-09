<script>
	import { onMount, onDestroy } from 'svelte';
	import { MapPin, Zap, Layers, Maximize2, Repeat } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	/**
	 * @typedef {Object} Node
	 * @property {string} id
	 * @property {string} type - 'transformer' | 'pole' | 'junction'
	 * @property {number} lat
	 * @property {number} lng
	 * @property {string} [status]
	 */

	/** @type {{ nodes: Node[], center: {lat: number, lng: number}, zoom: number }} */
	let { nodes = [], center = { lat: 12.9716, lng: 77.5946 }, zoom = 15 } = $props();

	let mapProvider = $state('osm'); // 'google' | 'osm'
	let mapContainer;
	let googleMap;
	let leafletMap;
	let leafletMarkers = [];
	let googleMarkers = [];
	let google;

	// Dark mode style for Google Maps
	const googleMapStyle = [
		{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
		{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
		{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
		{
			featureType: 'administrative.locality',
			elementType: 'labels.text.fill',
			stylers: [{ color: '#d59563' }]
		},
		{ featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
		{ featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
		{ featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
		{ featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
	];

	async function initGoogleMap() {
		const { importLibrary } = await import('@googlemaps/js-api-loader');
		await importLibrary('maps');
		await importLibrary('marker');
		google = window.google;

		googleMap = new google.maps.Map(mapContainer, {
			center,
			zoom,
			styles: googleMapStyle,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false
		});

		renderGoogleMarkers();
	}

	async function initLeafletMap() {
		const L = await import('leaflet');
		leafletMap = L.map(mapContainer, {
			center: [center.lat, center.lng],
			zoom: zoom,
			zoomControl: false
		});

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
		}).addTo(leafletMap);

		renderLeafletMarkers(L);
	}

	function renderLeafletMarkers(L) {
		if (!leafletMap || !L) return;
		leafletMarkers.forEach((m) => m.remove());
		leafletMarkers = [];

		nodes.forEach((node) => {
			const color =
				node.type === 'transformer' ? '#3b82f6' : node.type === 'junction' ? '#a855f7' : '#64748b';
			const marker = L.circleMarker([node.lat, node.lng], {
				radius: node.type === 'transformer' ? 8 : 4,
				fillColor: color,
				color: '#fff',
				weight: 1,
				opacity: 1,
				fillOpacity: 1
			}).addTo(leafletMap);

			marker.bindPopup(`
				<div class="p-1 font-sans">
					<b class="text-slate-900">${node.id}</b><br/>
					<span class="text-slate-500 text-[10px] uppercase font-bold">${node.type}</span>
				</div>
			`);
			leafletMarkers.push(marker);
		});
	}

	function renderGoogleMarkers() {
		if (!googleMap || !google) return;
		googleMarkers.forEach((m) => m.setMap(null));
		googleMarkers = [];

		nodes.forEach((node) => {
			const color =
				node.type === 'transformer' ? '#3b82f6' : node.type === 'junction' ? '#a855f7' : '#64748b';
			const marker = new google.maps.Marker({
				position: { lat: node.lat, lng: node.lng },
				map: googleMap,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: node.type === 'transformer' ? 8 : 4,
					fillColor: color,
					fillOpacity: 1,
					strokeWeight: 1,
					strokeColor: '#ffffff'
				},
				title: node.id
			});
			googleMarkers.push(marker);
		});
	}

	async function switchProvider() {
		mapProvider = mapProvider === 'google' ? 'osm' : 'google';
		if (googleMap) {
			googleMap = null;
			googleMarkers = [];
		}
		if (leafletMap) {
			leafletMap.remove();
			leafletMap = null;
			leafletMarkers = [];
		}

		if (mapProvider === 'google') {
			await initGoogleMap();
		} else {
			await initLeafletMap();
		}
	}

	onMount(async () => {
		await initLeafletMap();
	});

	$effect(() => {
		if (nodes && mapProvider === 'osm' && leafletMap) {
			import('leaflet').then((L) => renderLeafletMarkers(L));
		} else if (nodes && mapProvider === 'google' && googleMap) {
			renderGoogleMarkers();
		}
	});

	onDestroy(() => {
		if (leafletMap) leafletMap.remove();
	});
</script>

<div class="group relative h-full w-full overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
	<!-- Map Container -->
	<div bind:this={mapContainer} class="z-0 h-full w-full"></div>

	<!-- Controls Overlay -->
	<div
		class="pointer-events-none absolute top-6 right-6 left-6 z-10 flex items-center justify-between"
	>
		<div
			class="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-white shadow-2xl backdrop-blur-md"
		>
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20"
			>
				<Layers class="h-4 w-4" />
			</div>
			<div class="flex flex-col px-2">
				<span
					class="mb-1 text-[10px] leading-none font-bold tracking-widest text-slate-400 uppercase"
					>Provider</span
				>
				<span class="text-xs leading-none font-bold"
					>{mapProvider === 'google' ? 'Google Maps' : 'OpenStreetMap'}</span
				>
			</div>
			<button
				onclick={switchProvider}
				class="ml-2 flex h-8 items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-[10px] font-bold transition-colors hover:bg-slate-700"
			>
				<Repeat class="h-3 w-3" /> Toggle
			</button>
		</div>

		<div class="pointer-events-auto flex items-center gap-2">
			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-white shadow-2xl backdrop-blur-md transition-colors hover:bg-slate-800"
			>
				<Maximize2 class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Bottom Legend -->
	<div
		class="absolute bottom-6 left-6 z-10 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div class="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
			<span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Transformer</span
			>
		</div>
		<div class="flex items-center gap-3">
			<div class="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>
			<span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Junction</span>
		</div>
		<div class="flex items-center gap-3">
			<div class="h-2 w-2 rounded-full bg-slate-400"></div>
			<span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Pole</span>
		</div>
	</div>

	<!-- No API Key Warning for Google -->
	{#if mapProvider === 'google' && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
		<div
			class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
		>
			<div class="p-8 text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500"
				>
					<MapPin class="h-6 w-6" />
				</div>
				<h3 class="text-lg font-bold text-white">Google Maps API Key Missing</h3>
				<p class="mt-2 max-w-xs text-sm text-slate-400">
					Please set VITE_GOOGLE_MAPS_API_KEY in your environment to use Google Maps.
				</p>
				<button
					onclick={switchProvider}
					class="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white"
					>Switch to OpenStreetMap</button
				>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.leaflet-popup-content-wrapper) {
		background: rgba(15, 23, 42, 0.9);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: 1rem;
	}
	:global(.leaflet-popup-tip) {
		background: rgba(15, 23, 42, 0.9);
	}
</style>
