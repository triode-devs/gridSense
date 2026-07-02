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

    // ── 1. FIXED: Colour scheme updated to match the UI Legend ────────────────
    const COLOR = {
        healthy_line: '#38bdf8',     // sky-400
        healthy_consumer: '#fbbf24', // amber-400
        transformer: '#38bdf8',      // sky-400
        pole_normal: '#475569',      // slate-600
        fault_line: '#ef4444',       // red-500 (Fixed from Purple #ac05fa)
        fault_node: '#ef4444',       // red-500 (Fixed from Blue #0522fa)
        fault_consumer: '#f97316',   // orange-500
        lca_node: '#dc2626'          // red-600
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
        const bounds = []; // Track boundaries for ALL elements

        // ── 2. Draw LineString / MultiLineString segments first (below markers) ──
        features
            .filter((f) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
            .forEach((f) => {
                const isFault = f.properties?.status === 'fault';
                const type = f.properties?.type || '';
                // Check if it's explicitly a consumer line
                const isConsumer = type === 'consumer_tap' || type === 'consumer_line';
                
                const coords = flattenCoords(f.geometry);

                // Push line coordinates to map bounds so lines are never cut off
                if (f.geometry.type === 'LineString') {
                    bounds.push(...coords);
                } else if (f.geometry.type === 'MultiLineString') {
                    coords.forEach(seg => bounds.push(...seg));
                }

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

        // ── 2.5 Ensure Transformer is connected to the grid ──
        const transformerFeature = features.find(f => f.geometry?.type === 'Point' && (f.properties?.type === 'transformer' || f.properties?.node_type === 'transformer'));
        if (transformerFeature) {
            const [tLng, tLat] = transformerFeature.geometry.coordinates;
            // Check if any LineString already touches the transformer
            let isConnected = false;
            features.filter(f => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString').forEach(f => {
                const coords = flattenCoords(f.geometry);
                coords.forEach(([lat, lng]) => {
                    if (Math.abs(lat - tLat) < 0.00005 && Math.abs(lng - tLng) < 0.00005) {
                        isConnected = true;
                    }
                });
            });

            if (!isConnected) {
                // Find nearest pole
                const poles = features.filter(f => f.geometry?.type === 'Point' && f.properties?.type !== 'transformer' && !['consumer', 'residential', 'commercial', 'agricultural'].includes(f.properties?.type));
                
                let closest = null;
                let minDist = Infinity;
                poles.forEach(p => {
                    const [pLng, pLat] = p.geometry.coordinates;
                    const dist = Math.pow(tLat - pLat, 2) + Math.pow(tLng - pLng, 2);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = p;
                    }
                });

                if (closest) {
                    const [pLng, pLat] = closest.geometry.coordinates;
                    const line = L.polyline([[tLat, tLng], [pLat, pLng]], {
                        color: COLOR.healthy_line, // Draw healthy line by default
                        weight: 2.5,
                        opacity: 0.8,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(leafletMap);
                    layers.push(line);
                    bounds.push([tLat, tLng], [pLat, pLng]);
                }
            }
        }

        // ── 3. Draw Point features (poles, consumers, transformer) on top ────
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
                    // Transformer visual mapping
                    const icon = L.divIcon({
                        className: 'gs-transformer-icon',
                        html: `<div class="gs-tf-core" style="width: 36px; height: 36px; line-height: 36px; text-align: center; font-size: 22px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">⚡</div>`,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18] // Centered perfectly
                    });
                    marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(leafletMap);
                } else if (isLCA || (isFault && !isConsumer)) {
                    // Pulsing emoji / red marker for LCA/Fault
                    const size = isLCA ? 28 : 22;
                    const icon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="gs-emoji-marker-fault ${isLCA ? 'gs-lca' : ''}" style="
                            width:${size}px;height:${size}px;
                            line-height:${size}px;text-align:center;
                            font-size:${isLCA ? '24px' : '18px'};
                            animation:${isLCA ? 'gs-lca-pulse' : 'gs-fault-pulse'} 1.4s ease-out infinite;
                        ">⚠️</div>`,
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size / 2] // Centered perfectly
                    });
                    marker = L.marker([lat, lng], { icon, zIndexOffset: isLCA ? 2000 : 900 }).addTo(
                        leafletMap
                    );
                } else if (isConsumer) {
                    // Consumer emoji based on type
                    let emoji = '🏠';
                    if (props.type === 'commercial') emoji = '🏢';
                    if (props.type === 'agricultural' || props.type === 'industrial') emoji = '🏭';
                    if (isFault) emoji = '🏚️';

                    const icon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="gs-emoji-marker-consumer" style="font-size: 22px; width: 28px; height: 28px; line-height: 28px; text-align: center; ${isFault ? 'filter: drop-shadow(0 0 4px #ef4444);' : ''}">${emoji}</div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14] // Centered perfectly
                    });
                    marker = L.marker([lat, lng], { icon, zIndexOffset: 800 }).addTo(leafletMap);
                } else {
                    // Normal electric pole
                    const icon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div style="font-size: 20px; width: 28px; height: 28px; line-height: 28px; text-align: center;">🗼</div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14] // Centered perfectly
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
                            <div style="margin-top:4px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">${type.replace('_', ' ')}</div>
                            ${props.analysis ? `<div style="margin-top:6px;font-size:11px;color:#fca5a5;line-height:1.4">${props.analysis}</div>` : ''}
                        </div>`,
                        { className: 'gs-popup' }
                    );
                }

                layers.push(marker);
            });

        // ── 4. Fit bounds to all features (Lines + Points) ───────────────────
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
    <div bind:this={mapContainer} class="h-full w-full"></div>

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
    :global(.gs-fault-pulse) {
        animation: gs-pulse 1.4s ease-out infinite;
    }
    @keyframes gs-lca-pulse {
        0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0.7));
        }
        70% {
            transform: scale(1.3);
            filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.5));
        }
        100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0));
        }
    }
    @keyframes gs-fault-pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
        100% {
            opacity: 1;
        }
    }

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