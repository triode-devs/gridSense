<script>
	import { onMount, onDestroy } from 'svelte';
	import { AlertTriangle, MapPin, Zap, Layers, RefreshCw } from 'lucide-svelte';

	/**
	 * @typedef {Object} Props
	 * @property {{ type: string, features: Array }} mapData  - GeoJSON FeatureCollection from /api/fault-analysis
	 * @property {string} [faultNode]   - ID of the LCA fault node
	 * @property {{ lat: number, lng: number }} [center]
	 * @property {number} [zoom]
	 */
	let { mapData = null, faultNode = null, center = { lat: 10.8, lng: 78.7 }, zoom = 15 } = $props();

	let mapContainer;
	let leafletMap;
	let leafletL = null;
	let layers = []; // all rendered Leaflet layers

	// ── Colour scheme ─────────────────────────────────────────────────────────
	const COLOR = {
		healthy_line: '#38bdf8', // sky-400
		healthy_consumer: '#fbbf24', // amber-400
		transformer: '#38bdf8',
		pole_normal: '#475569', // slate-600
		fault_line: '#ac05fa', // red-500
		fault_node: '#0522fa',
		fault_consumer: '#ef4444', // orange-500
		lca_node: '#dc2626' // red-600 (brighter for the LCA itself)
	};

	// ── Parse GeoJSON → Leaflet layers ───────────────────────────────────────
	function clearLayers() {
		layers.forEach((l) => {
			try {
				l.remove();
			} catch (_) {}
		});
		layers = [];
	}

	async function renderMap() {
		if (!leafletMap || !leafletL) return;
		const L = leafletL;
		clearLayers();

		if (!mapData?.features?.length) return;

		const features = mapData.features;

		// ── 1. Draw LineString / MultiLineString segments first (below markers) ──
		features
			.filter((f) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
			.forEach((f) => {
				const isFault = f.properties?.status === 'fault';
				const isConsumer = f.properties?.type === 'consumer_tap';
				const coords = flattenCoords(f.geometry);

				const line = L.polyline(coords, {
					color: isFault
						? isConsumer
							? COLOR.fault_consumer
							: COLOR.fault_line
						: isConsumer
							? COLOR.healthy_consumer
							: COLOR.healthy_line,
					weight: isFault ? 3.5 : isConsumer ? 1.5 : 2.5,
					opacity: isFault ? 1 : isConsumer ? 0.5 : 0.8,
					dashArray: isConsumer && !isFault ? '4 6' : null,
					lineCap: 'round',
					lineJoin: 'round'
				}).addTo(leafletMap);

				if (isFault) {
					// pulse animation via CSS class
					line.getElement &&
						setTimeout(() => {
							const el = line.getElement?.();
							if (el) el.classList.add('gs-fault-line');
						}, 50);
				}

				layers.push(line);
			});

		// ── 2. Draw Point features (poles, consumers, transformer) on top ────
		const bounds = [];

		features
			.filter((f) => f.geometry?.type === 'Point')
			.forEach((f) => {
				const props = f.properties ?? {};
				const [lng, lat] = f.geometry.coordinates;
				const isFault = props.status === 'fault';
				const isLCA = props.is_fault_location === true || props.id === faultNode;
				const type = props.type ?? props.node_type ?? 'pole';
				const isConsumer = ['consumer', 'residential', 'commercial', 'agricultural'].includes(type);
				const isTransformer = type === 'transformer';

				bounds.push([lat, lng]);

				let marker;

				if (isTransformer) {
					const icon = L.divIcon({
						className: 'bg-transparent',
						html: `<div style="
							width:36px;height:36px;border-radius:50%;
							background:radial-gradient(circle,rgba(56,189,248,.25),rgba(56,189,248,.05));
							border:2px solid #38bdf8;
							display:flex;align-items:center;justify-content:center;
							box-shadow:0 0 0 4px rgba(56,189,248,.12),0 0 16px rgba(56,189,248,.5);
						">⚡</div>`,
						iconSize: [36, 36],
						iconAnchor: [18, 18]
					});
					marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(leafletMap);
				} else if (isLCA || (isFault && !isConsumer)) {
					// Pulsing red LCA / fault pole
					const size = isLCA ? 22 : 14;
					const icon = L.divIcon({
						className: 'bg-transparent',
						html: `<div class="gs-fault-pulse" style="
							width:${size}px;height:${size}px;border-radius:50%;
							background:${isLCA ? COLOR.lca_node : COLOR.fault_node};
							border:${isLCA ? '3px' : '2px'} solid white;
							box-shadow:0 0 0 0 rgba(239,68,68,.6);
							animation:gs-pulse 1.4s ease-out infinite;
						"></div>`,
						iconSize: [size, size],
						iconAnchor: [size / 2, size / 2]
					});
					marker = L.marker([lat, lng], { icon, zIndexOffset: isLCA ? 2000 : 900 }).addTo(
						leafletMap
					);
				} else if (isConsumer && isFault) {
					marker = L.circleMarker([lat, lng], {
						radius: 6,
						fillColor: COLOR.fault_consumer,
						color: 'rgba(249,115,22,.4)',
						weight: 4,
						opacity: 1,
						fillOpacity: 1
					}).addTo(leafletMap);
				} else if (isConsumer) {
					marker = L.circleMarker([lat, lng], {
						radius: 4,
						fillColor: COLOR.healthy_consumer,
						color: 'rgba(251,191,36,.35)',
						weight: 3,
						opacity: 1,
						fillOpacity: 1
					}).addTo(leafletMap);
				} else {
					// Normal pole
					const icon = L.divIcon({
						className: 'bg-transparent',
						html: `<div style="
							width:12px;height:12px;border-radius:50%;
							background:#475569;
							border:2px solid #cbd5e1;
							box-shadow:0 0 4px rgba(0,0,0,.5);
						"></div>`,
						iconSize: [12, 12],
						iconAnchor: [6, 6]
					});
					marker = L.marker([lat, lng], { icon, zIndexOffset: 500 }).addTo(leafletMap);
				}

				// Tooltip
				if (props.id || props.name) {
					const label = props.id ?? props.name;
					const faultBadge = isFault
						? `<span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:700;background:#ef444422;color:#ef4444;text-transform:uppercase">FAULT</span>`
						: '';
					const lcaBadge = isLCA
						? `<span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:700;background:#dc262622;color:#dc2626;text-transform:uppercase">LCA</span>`
						: '';

					marker.bindTooltip(label, {
						permanent: false,
						direction: 'top',
						offset: [0, -12],
						className: 'gs-node-label'
					});

					marker.bindPopup(
						`<div style="font-family:system-ui;padding:4px 2px;min-width:130px">
							<div style="font-weight:700;font-size:13px;color:#f1f5f9">${label}${lcaBadge}${faultBadge}</div>
							<div style="margin-top:4px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">${type}</div>
							${props.analysis ? `<div style="margin-top:6px;font-size:11px;color:#fca5a5;line-height:1.4">${props.analysis}</div>` : ''}
						</div>`,
						{ className: 'gs-popup' }
					);
				}

				layers.push(marker);
			});

		// ── 3. Fit bounds to all features ────────────────────────────────────
		if (bounds.length > 1) {
			leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
		} else if (bounds.length === 1) {
			leafletMap.setView(bounds[0], 16);
		}
	}

	// ── Utility: flatten LineString/MultiLineString coords for Leaflet ─────────
	function flattenCoords(geometry) {
		if (geometry.type === 'LineString') {
			return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
		}
		if (geometry.type === 'MultiLineString') {
			return geometry.coordinates.map((seg) => seg.map(([lng, lat]) => [lat, lng]));
		}
		return [];
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	onMount(async () => {
		leafletL = await import('leaflet');
		const L = leafletL;

		leafletMap = L.map(mapContainer, {
			center: [center.lat, center.lng],
			zoom,
			zoomControl: false
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(leafletMap);

		// Zoom control bottom-right
		L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

		setTimeout(() => {
			leafletMap.invalidateSize();
		}, 60);

		await renderMap();
	});

	$effect(() => {
		const _data = mapData;
		const _fn = faultNode;
		if (leafletMap && leafletL) renderMap();
	});

	onDestroy(() => {
		clearLayers();
		if (leafletMap) leafletMap.remove();
	});
</script>

<div class="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
	<!-- Map container -->
	<div bind:this={mapContainer} class="h-full w-full"></div>

	<!-- Legend overlay -->
	<div
		class="pointer-events-none absolute bottom-5 left-5 z-[1000] rounded-2xl border border-slate-700/60 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-md"
	>
		<p class="mb-2.5 text-[9px] font-bold tracking-widest text-slate-500 uppercase">Map Legend</p>
		<div class="space-y-2">
			<div class="flex items-center gap-2.5">
				<div class="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
				<span class="text-[10px] font-bold text-slate-300">Fault / LCA Node</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="h-2 w-6 rounded-full bg-red-500 opacity-80"></div>
				<span class="text-[10px] font-bold text-slate-300">Affected Line</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="h-2 w-6 rounded-full bg-sky-400 opacity-70"></div>
				<span class="text-[10px] font-bold text-slate-300">Healthy Line</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
				<span class="text-[10px] font-bold text-slate-300">Consumer Tap</span>
			</div>
		</div>
	</div>

	<!-- Fault node callout (top-left) -->
	{#if faultNode}
		<div
			class="pointer-events-none absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/80 px-3 py-2 shadow-xl backdrop-blur-md"
		>
			<span class="h-2 w-2 animate-ping rounded-full bg-red-500"></span>
			<span class="text-xs font-bold text-red-300"
				>LCA: <span class="font-mono">{faultNode}</span></span
			>
		</div>
	{/if}
</div>

<style>
	/* Pulsing red dot for fault/LCA nodes ─────────────── */
	:global(.gs-fault-pulse) {
		animation: gs-pulse 1.4s ease-out infinite;
	}
	@keyframes gs-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
		}
	}

	/* Animated red shimmer for fault polylines ─────────── */
	:global(.gs-fault-line) {
		animation: gs-line-pulse 1.8s ease-in-out infinite alternate;
	}
	@keyframes gs-line-pulse {
		from {
			stroke-opacity: 0.7;
		}
		to {
			stroke-opacity: 1;
		}
	}

	/* Reuse popup + tooltip styles from GridMap ─────────── */
	:global(.gs-popup .leaflet-popup-content-wrapper) {
		background: rgba(2, 6, 23, 0.92);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: white;
		border-radius: 12px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(239, 68, 68, 0.1);
	}
	:global(.gs-popup .leaflet-popup-tip) {
		background: rgba(2, 6, 23, 0.92);
	}
</style>
