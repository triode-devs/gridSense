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
			const res = await fetch(`${API_BASE_URL}/api/transformer-mapping/${selectedTransformerId}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				topologyData = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch topology mapping');
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchTransformers);

	$effect(() => {
		if (selectedTransformerId) fetchTopology();
	});

	const mapNodes = $derived(
		topologyData?.mapping?.features?.map((f) => ({
			id: f.properties.id,
			type: f.properties.type,
			lat: f.geometry.coordinates[1],
			lng: f.geometry.coordinates[0]
		})) || []
	);

	const mapCenter = $derived(
		mapNodes.length > 0
			? { lat: mapNodes[0].lat, lng: mapNodes[0].lng }
			: { lat: 12.9716, lng: 77.5946 }
	);
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
				<GridMap nodes={mapNodes} center={mapCenter} />
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
