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

	/** @type {{ nodes: Node[], center: {lat: number, lng: number}, zoom: number, onMapClick?: (e: {lat: number, lng: number}) => void, selectedLocation?: {lat: number, lng: number} | null }} */
	let {
		nodes = [],
		center = { lat: 12.9716, lng: 77.5946 },
		zoom = 15,
		onMapClick,
		selectedLocation = null
	} = $props();

	let mapProvider = $state('osm'); // 'google' | 'osm'
	let mapContainer;
	let googleMap;
	let leafletMap;
	let leafletMarkers = [];
	let googleMarkers = [];
	let selectedMarkerLeaflet = null;
	let selectedMarkerGoogle = null;
	let google;

	// Cache the Leaflet module after first import — avoids repeated async imports on every node update
	let leafletL = null;

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

		googleMap.addListener('click', (e) => {
			if (onMapClick) {
				onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
			}
		});

		renderGoogleMarkers();
		renderSelectedLocationGoogle();
	}

	async function initLeafletMap() {
		if (!leafletL) leafletL = await import('leaflet');
		const L = leafletL;

		leafletMap = L.map(mapContainer, {
			center: [center.lat, center.lng],
			zoom: zoom,
			zoomControl: false
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(leafletMap);

		leafletMap.on('click', (e) => {
			if (onMapClick) {
				onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
			}
		});

		// Force recalculate container size — critical when used inside modals/conditionally rendered elements
		setTimeout(() => {
			leafletMap.invalidateSize();
		}, 50);

		renderLeafletMarkers(L);
		renderSelectedLocationLeaflet(L);
	}

	function renderSelectedLocationLeaflet(L) {
		if (!leafletMap || !L) return;
		if (selectedMarkerLeaflet) selectedMarkerLeaflet.remove();

		if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
			const icon = L.divIcon({
				className: 'bg-transparent',
				html: `<div style="width: 24px; height: 24px; background-color: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></div>`,
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});
			selectedMarkerLeaflet = L.marker([selectedLocation.lat, selectedLocation.lng], {
				icon
			}).addTo(leafletMap);
		}
	}

	function renderSelectedLocationGoogle() {
		if (!googleMap || !google) return;
		if (selectedMarkerGoogle) selectedMarkerGoogle.setMap(null);

		if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
			selectedMarkerGoogle = new google.maps.Marker({
				position: selectedLocation,
				map: googleMap,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillColor: '#ef4444',
					fillOpacity: 1,
					strokeWeight: 3,
					strokeColor: '#ffffff'
				},
				zIndex: 1000
			});
		}
	}

	let leafletLines = [];
	let googleLines = [];

	function renderLeafletMarkers(L) {
		if (!leafletMap || !L) return;
		leafletMarkers.forEach((m) => m.remove());
		leafletLines.forEach((l) => l.remove());
		leafletMarkers = [];
		leafletLines = [];

		// ── Draw lines FIRST so markers render on top ──────────────────────
		nodes.forEach((node) => {
			if (!node.parentId) return;
			const parent = nodes.find((n) => n.id === node.parentId);
			if (!parent) return;

			// Consumer connection: thinner dashed amber line
			const isConsumer = ['consumer', 'residential', 'commercial', 'agricultural'].includes(
				node.type
			);

			const line = L.polyline(
				[
					[node.lat, node.lng],
					[parent.lat, parent.lng]
				],
				{
					color: isConsumer ? '#fbbf24' : '#38bdf8',
					weight: isConsumer ? 1.5 : 2.5,
					opacity: isConsumer ? 0.5 : 0.85,
					dashArray: isConsumer ? '4 6' : null,
					lineCap: 'round',
					lineJoin: 'round'
				}
			).addTo(leafletMap);
			leafletLines.push(line);
		});

		// ── Draw markers on top ────────────────────────────────────────────
		nodes.forEach((node) => {
			let marker;

			if (node.type === 'transformer') {
				// Glowing electric-blue transformer icon
				const icon = L.divIcon({
					className: 'gs-transformer-icon',
					html: `
						
							<div class="gs-tf-core">⚡</div>
						`,
					iconSize: [36, 36],
					iconAnchor: [19, 18]
				});
				marker = L.marker([node.lat, node.lng], { icon, zIndexOffset: 1000 }).addTo(leafletMap);
			} else if (node.type === 'pole') {
				// Steel pole dot with white ring
				const icon = L.divIcon({
					className: 'gs-pole-icon',
					html: `<div class="gs-pole-dot"></div>`,
					iconSize: [16, 16],
					iconAnchor: [8, 8]
				});
				marker = L.marker([node.lat, node.lng], { icon, zIndexOffset: 500 }).addTo(leafletMap);
			} else {
				// Consumer / residential / commercial — amber glow circle
				marker = L.circleMarker([node.lat, node.lng], {
					radius: 5,
					fillColor: '#f59e0b',
					color: 'rgba(251,191,36,0.4)',
					weight: 4,
					opacity: 1,
					fillOpacity: 1
				}).addTo(leafletMap);
			}

			// Hover tooltip for poles + transformers
			if (node.type === 'pole' || node.type === 'transformer') {
				marker.bindTooltip(node.id, {
					permanent: false,
					direction: 'top',
					offset: [0, -12],
					className: 'gs-node-label'
				});
			}

			// Click popup for all nodes
			const typeColor =
				node.type === 'transformer' ? '#38bdf8' : node.type === 'pole' ? '#94a3b8' : '#f59e0b';
			marker.bindPopup(
				`
				<div style="font-family:system-ui;padding:4px 2px;min-width:120px">
					<div style="font-weight:700;font-size:13px;color:#f1f5f9">${node.id}</div>
					<div style="margin-top:4px;display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;background:${typeColor}22;color:${typeColor}">${node.type}</div>
				</div>
			`,
				{ className: 'gs-popup' }
			);

			leafletMarkers.push(marker);
		});
	}

	function renderGoogleMarkers() {
		if (!googleMap || !google) return;
		googleMarkers.forEach((m) => m.setMap(null));
		googleLines.forEach((l) => l.setMap(null));
		googleMarkers = [];
		googleLines = [];

		nodes.forEach((node) => {
			let color = '#64748b'; // default slate (pole)
			if (node.type === 'transformer')
				color = '#3b82f6'; // blue
			else if (node.type === 'junction')
				color = '#a855f7'; // purple
			else if (['consumer', 'residential', 'commercial', 'agricultural'].includes(node.type))
				color = '#f59e0b'; // amber

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

			if (node.parentId) {
				const parent = nodes.find((n) => n.id === node.parentId);
				if (parent) {
					const line = new google.maps.Polyline({
						path: [
							{ lat: node.lat, lng: node.lng },
							{ lat: parent.lat, lng: parent.lng }
						],
						geodesic: true,
						strokeColor: '#94a3b8',
						strokeOpacity: 0.5,
						strokeWeight: 2,
						icons: [
							{
								icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
								offset: '0',
								repeat: '10px'
							}
						],
						map: googleMap
					});
					googleLines.push(line);
				}
			}
		});
	}

	async function switchProvider() {
		mapProvider = mapProvider === 'google' ? 'osm' : 'google';
		if (googleMap) {
			googleMap = null;
			googleMarkers = [];
			googleLines = [];
		}
		if (leafletMap) {
			leafletMap.remove();
			leafletMap = null;
			leafletMarkers = [];
			leafletLines = [];
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

	// Re-center map when center prop changes (flyTo avoids full remount)
	$effect(() => {
		const lat = center.lat;
		const lng = center.lng;
		if (leafletMap && lat && lng) {
			leafletMap.flyTo([lat, lng], zoom, { duration: 0.6, easeLinearity: 0.5 });
		}
	});

	// Re-render markers when nodes or selectedLocation changes — use cached L module
	$effect(() => {
		const _nodes = nodes;
		const _sel = selectedLocation;
		if (mapProvider === 'osm' && leafletMap) {
			if (leafletL) {
				// Use cached module synchronously — no async penalty
				if (_nodes) renderLeafletMarkers(leafletL);
				renderSelectedLocationLeaflet(leafletL);
			} else {
				import('leaflet').then((L) => {
					leafletL = L;
					if (_nodes) renderLeafletMarkers(L);
					renderSelectedLocationLeaflet(L);
				});
			}
		} else if (mapProvider === 'google' && googleMap) {
			if (_nodes) renderGoogleMarkers();
			renderSelectedLocationGoogle();
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
	/* ── Popup ───────────────────────────────────────────────────────── */
	:global(.gs-popup .leaflet-popup-content-wrapper) {
		background: rgba(2, 6, 23, 0.92);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(56, 189, 248, 0.2);
		color: white;
		border-radius: 12px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(56, 189, 248, 0.1);
	}
	:global(.leaflet-popup-content-wrapper) {
		background: rgba(2, 6, 23, 0.92);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: white;
		border-radius: 12px;
	}
	:global(.leaflet-popup-tip) {
		background: rgba(2, 6, 23, 0.92);
	}
	:global(.leaflet-popup-close-button) {
		color: #64748b !important;
	}

	/* ── Hover tooltip label ─────────────────────────────────────────── */
	:global(.gs-node-label),
	:global(.pole-label) {
		background: rgba(2, 6, 23, 0.88);
		border: 1px solid rgba(56, 189, 248, 0.35);
		border-radius: 6px;
		color: #7dd3fc;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		white-space: nowrap;
		backdrop-filter: blur(6px);
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.4),
			0 0 8px rgba(56, 189, 248, 0.15);
	}
	:global(.gs-node-label::before),
	:global(.pole-label::before) {
		display: none;
	}

	/* ── Transformer marker ──────────────────────────────────────────── */
	:global(.gs-transformer-icon) {
		background: transparent !important;
		border: none !important;
	}
	:global(.gs-tf-ring) {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 50% 50%,
			rgba(56, 189, 248, 0.25) 0%,
			rgba(56, 189, 248, 0.05) 70%
		);
		border: 2px solid #38bdf8;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 0 0 4px rgba(56, 189, 248, 0.12),
			0 0 16px rgba(56, 189, 248, 0.5),
			0 0 32px rgba(56, 189, 248, 0.2);
		animation: gs-tf-pulse 2.4s ease-in-out infinite;
	}
	:global(.gs-tf-core) {
		font-size: 15px;
		line-height: 1;
		filter: drop-shadow(0 0 4px #7dd3fc);
	}
	@keyframes gs-tf-pulse {
		0%,
		100% {
			box-shadow:
				0 0 0 4px rgba(56, 189, 248, 0.12),
				0 0 16px rgba(56, 189, 248, 0.5),
				0 0 32px rgba(56, 189, 248, 0.2);
		}
		50% {
			box-shadow:
				0 0 0 7px rgba(56, 189, 248, 0.06),
				0 0 24px rgba(56, 189, 248, 0.7),
				0 0 48px rgba(56, 189, 248, 0.3);
		}
	}

	/* ── Pole marker ─────────────────────────────────────────────────── */
	:global(.gs-pole-icon) {
		background: transparent !important;
		border: none !important;
	}
	:global(.gs-pole-dot) {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #475569;
		border: 2.5px solid #cbd5e1;
		box-shadow:
			0 0 6px rgba(0, 0, 0, 0.6),
			0 0 0 3px rgba(148, 163, 184, 0.15);
	}
</style>
