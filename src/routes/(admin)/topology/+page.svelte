<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		MapPin,
		Network,
		Loader,
		ArrowRight,
		Maximize2,
		Layers,
		Search,
		Plus,
		GitBranch
	} from 'lucide-svelte';
	import GridMap from '$lib/components/ui/GridMap.svelte';
	import { onMount } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';

	let transformers = $state([]);
	let selectedTransformerId = $state('');
	let topologyData = $state(null);
	let isLoading = $state(false);
	let consumers = $state([]);
	let consumersCount = $state(0);

	async function fetchTransformers() {
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				transformers = data.data;
				if (transformers.length > 0) {
					selectedTransformerId = transformers[0].transformer_id;
					fetchTopology();
				}
			}
		} catch (e) {
			console.error('Failed to fetch transformers');
		}
	}

	async function fetchTopology() {
		if (!selectedTransformerId) return;
		isLoading = true;
		try {
			// Fetch Topology (Infrastructure)
			const resTopo = await fetch(
				`${API_BASE_URL}/api/transformer-mapping/${selectedTransformerId}`,
				{
					headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
				}
			);
			const dataTopo = await resTopo.json();
			if (dataTopo.success) {
				topologyData = dataTopo.data;
			}

			// Fetch Consumers
			const resCons = await fetch(
				`${API_BASE_URL}/admin/consumers?transformer_id=${selectedTransformerId}&limit=1000`,
				{
					headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
				}
			);
			const dataCons = await resCons.json();
			if (dataCons.success) {
				consumers = dataCons.data;
				consumersCount = consumers.length;
			}
		} catch (e) {
			console.error('Failed to fetch topology data');
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchTransformers);

	$effect(() => {
		if (selectedTransformerId) fetchTopology();
	});

	const mapNodes = $derived.by(() => {
		const infrastructure = (topologyData?.mapping?.features || []).map((f) => ({
			id: f.properties.id,
			type: f.properties.type,
			lat: Number(f.geometry.coordinates[1]),
			lng: Number(f.geometry.coordinates[0]),
			parentId: f.properties.parent_node_id
		}));

		// Ensure Transformer itself is a node (Root)
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

		const consumerNodes = consumers.map((c) => ({
			id: c.consumer_name || 'Consumer',
			type: c.type || 'consumer', // residential, commercial, etc.
			lat: Number(c.latitude),
			lng: Number(c.longitude),
			parentId: c.parent_node_id || c.transformer_id // Link to pole or transformer
		}));

		return [...infrastructure, ...consumerNodes];
	});

	const mapCenter = $derived.by(() => {
		const validNode = mapNodes.find((n) => n.lat && n.lng);
		return validNode ? { lat: validNode.lat, lng: validNode.lng } : { lat: 12.9716, lng: 77.5946 };
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Grid Topology</h1>
			<p class="font-medium text-slate-500">
				Visualizing transformer mapping and node connectivity.
			</p>
		</div>
		<div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
			<select
				bind:value={selectedTransformerId}
				class="h-10 rounded-xl bg-transparent px-4 text-sm font-bold text-slate-700 outline-none"
			>
				{#each transformers as t}
					<option value={t.transformer_id}>{t.transformer_id}</option>
				{/each}
			</select>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20"
			>
				<Search class="h-4 w-4" />
			</button>
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
	{:else if topologyData}
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Visual Map Placeholder -->
			<div
				class="group relative min-h-[500px] overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl lg:col-span-2"
			>
				{#key selectedTransformerId}
					<GridMap nodes={mapNodes} center={mapCenter} />
				{/key}
			</div>

			<!-- Sidebar Info -->
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
					<div class="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
						<div>
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Status</p>
							<span
								class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600"
								>{topologyData.status}</span
							>
						</div>
						<div class="text-right">
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
								Nodes Count
							</p>
							<span class="text-xs font-bold text-slate-700"
								>{topologyData?.mapping?.features?.length || 0}</span
							>
						</div>
						<div class="text-right">
							<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
								Consumers
							</p>
							<span class="text-xs font-bold text-slate-700">{consumersCount || 0}</span>
						</div>
					</div>
				</div>

				<!-- Quick Explorer -->
				<div
					class="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white bg-slate-50 p-6"
				>
					<h3 class="mb-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
						Topology Explorer
					</h3>
					<div class="custom-scrollbar max-h-[200px] space-y-3 overflow-y-auto pr-2">
						{#each topologyData?.mapping?.features || [] as feature}
							<div
								class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-200"
							>
								<div class="flex items-center gap-3">
									<div
										class={`h-2 w-2 rounded-full ${feature.properties.type === 'pole' ? 'bg-slate-400' : 'bg-emerald-500'}`}
									></div>
									<span class="text-xs font-bold text-slate-700">{feature.properties.id}</span>
								</div>
								<span class="text-[9px] font-bold text-slate-400 uppercase"
									>{feature.properties.type}</span
								>
							</div>
						{/each}
					</div>
					<button
						class="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800"
					>
						<Plus class="h-4 w-4" /> Add Infrastructure
					</button>
				</div>
			</div>
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
