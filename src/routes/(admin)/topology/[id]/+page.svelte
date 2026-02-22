<script>
	import { API_BASE_URL } from '$lib/index.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Zap, MapPin, Loader, ArrowLeft, Plus } from 'lucide-svelte';
	import GridMap from '$lib/components/ui/GridMap.svelte';
	import { onMount } from 'svelte';

	const transformerId = $derived($page.params.id);

	let topologyData = $state(null);
	let consumers = $state([]);
	let consumersCount = $state(0);
	let isLoading = $state(true);
	let error = $state(null);

	async function fetchTopology() {
		isLoading = true;
		error = null;
		try {
			const token = localStorage.getItem('token');
			const headers = { Authorization: `Bearer ${token}` };

			const [resTopo, resCons] = await Promise.all([
				fetch(`${API_BASE_URL}/api/transformer-mapping/${transformerId}`, { headers }),
				fetch(`${API_BASE_URL}/admin/consumers?transformer_id=${transformerId}&limit=1000`, {
					headers
				})
			]);

			const dataTopo = await resTopo.json();
			if (dataTopo.success) topologyData = dataTopo.data;
			else error = 'Failed to load topology data.';

			const dataCons = await resCons.json();
			if (dataCons.success) {
				consumers = dataCons.data;
				consumersCount = consumers.length;
			}
		} catch (e) {
			error = 'Network error. Could not fetch topology.';
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchTopology);

	// The API returns features as a mixed array: [Feature, [Feature, Feature], [Feature, Feature]]
	// We need to flatten it one level before processing
	const flatFeatures = $derived(
		(topologyData?.mapping?.features || []).flat().filter((f) => f?.properties && f?.geometry)
	);

	const mapNodes = $derived.by(() => {
		const infrastructure = flatFeatures.map((f) => ({
			id: f.properties.id,
			type: f.properties.type,
			lat: Number(f.geometry.coordinates[1]),
			lng: Number(f.geometry.coordinates[0]),
			parentId: f.properties.parent_node_id
		}));

		// Ensure transformer root node exists
		if (topologyData?.latitude && topologyData?.longitude) {
			const exists = infrastructure.find((n) => n.id === topologyData.transformer_id);
			if (!exists) {
				infrastructure.unshift({
					id: topologyData.transformer_id,
					type: 'transformer',
					lat: Number(topologyData.latitude),
					lng: Number(topologyData.longitude)
				});
			}
		}

		// Consumers are already in flatFeatures (type: 'consumer'), so skip the separate consumer API
		// But we still merge them in case they have extra details
		const existingIds = new Set(infrastructure.map((n) => n.id));
		const extraConsumers = consumers
			.filter((c) => !existingIds.has(c.consumer_id))
			.map((c) => ({
				id: c.consumer_name || c.consumer_id,
				type: c.type || 'consumer',
				lat: Number(c.latitude),
				lng: Number(c.longitude),
				parentId: c.parent_node_id || c.transformer_id
			}));

		return [...infrastructure, ...extraConsumers];
	});

	// Use transformer coords directly — no waiting for mapNodes to resolve
	const mapCenter = $derived(
		topologyData?.latitude && topologyData?.longitude
			? { lat: Number(topologyData.latitude), lng: Number(topologyData.longitude) }
			: { lat: 12.9716, lng: 77.5946 }
	);
</script>

<svelte:head>
	<title>Topology: {transformerId} | GridSense Admin</title>
	<meta
		name="description"
		content="Infrastructure topology map for the selected transformer, including poles, junctions, and connected consumers."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex items-center gap-4">
			<button
				onclick={() => goto(history.back())}
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600"
			>
				<ArrowLeft class="h-4 w-4" />
			</button>
			<div>
				<h1 class="text-3xl font-bold text-slate-900">Grid Topology</h1>
				<p class="font-medium text-slate-500">
					Transformer <span class="font-mono font-bold text-blue-600">{transformerId}</span>
				</p>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div
			class="flex h-[500px] w-full items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white shadow-sm"
		>
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-12 w-12 animate-spin text-blue-600" />
				<p class="animate-pulse text-[10px] font-bold tracking-widest text-slate-500 uppercase">
					Generating Mapping...
				</p>
			</div>
		</div>
	{:else if error}
		<div
			class="flex h-[300px] w-full items-center justify-center rounded-[2.5rem] border border-red-100 bg-red-50 shadow-sm"
		>
			<p class="font-semibold text-red-500">{error}</p>
		</div>
	{:else if topologyData}
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Map -->
			<div
				class="group relative min-h-[500px] overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl lg:col-span-2"
			>
				<GridMap nodes={mapNodes} center={mapCenter} />
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Transformer Info -->
				<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
						Unit Identification
					</h3>
					<div class="flex items-center gap-4">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm"
						>
							<Zap class="h-7 w-7" />
						</div>
						<div>
							<h4 class="text-lg font-bold text-slate-900">{topologyData.transformer_id}</h4>
							<p class="text-xs font-medium text-slate-500">{topologyData.location_description}</p>
						</div>
					</div>

					<div class="mt-6 grid grid-cols-3 gap-3 border-t border-slate-50 pt-6 text-center">
						<div>
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Status</p>
							<span
								class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600"
								>{topologyData.status}</span
							>
						</div>
						<div>
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nodes</p>
							<span class="text-xs font-bold text-slate-700"
								>{topologyData?.mapping?.features?.length || 0}</span
							>
						</div>
						<div>
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
								Consumers
							</p>
							<span class="text-xs font-bold text-slate-700">{consumersCount || 0}</span>
						</div>
					</div>

					<div
						class="mt-4 flex items-center gap-2 border-t border-slate-50 pt-4 text-xs text-slate-400"
					>
						<MapPin class="h-3.5 w-3.5 text-slate-300" />
						<span class="font-mono">{topologyData.latitude}, {topologyData.longitude}</span>
					</div>
				</div>

				<!-- Topology Explorer -->
				<div
					class="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white bg-slate-50 p-6"
				>
					<h3 class="mb-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
						Topology Explorer
					</h3>
					<div class="custom-scrollbar max-h-[260px] space-y-3 overflow-y-auto pr-2">
						{#each flatFeatures as feature}
							<div
								class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-200"
							>
								<div class="flex items-center gap-3">
									<div
										class={`h-2 w-2 rounded-full ${feature.properties.type === 'pole' ? 'bg-slate-400' : feature.properties.type === 'transformer' ? 'bg-blue-500' : 'bg-amber-400'}`}
									></div>
									<span class="text-xs font-bold text-slate-700">{feature.properties.id}</span>
								</div>
								<span class="text-[9px] font-bold text-slate-400 uppercase"
									>{feature.properties.type}</span
								>
							</div>
						{/each}
						{#if flatFeatures.length === 0}
							<p class="py-6 text-center text-xs text-slate-400">
								No infrastructure nodes mapped yet.
							</p>
						{/if}
					</div>
					<button
						class="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800"
					>
						<Plus class="h-4 w-4" /> Add Infrastructure
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="flex h-[300px] w-full items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white"
		>
			<p class="text-slate-400">No topology data available for this transformer.</p>
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 10px;
	}
</style>
