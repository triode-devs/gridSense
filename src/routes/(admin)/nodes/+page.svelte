<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Network,
		MapPin,
		Plus,
		Loader,
		Search,
		Trash2,
		Edit3,
		GitBranch,
		Settings2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import GridMap from '$lib/components/ui/GridMap.svelte';

	let nodes = $state([]);
	let transformers = $state([]);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let selectedTransformer = $state('all');

	let isAdding = $state(false);
	let newNode = $state({
		node_id: '',
		transformer_id: '',
		latitude: '',
		longitude: '',
		type: 'pole',
		parent_node_id: null
	});

	async function fetchData() {
		isLoading = true;
		try {
			const [nodesRes, transRes] = await Promise.all([
				fetch(
					`${API_BASE_URL}/admin/nodes${selectedTransformer !== 'all' ? `?transformer_id=${selectedTransformer}` : ''}`,
					{
						headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
					}
				),
				fetch(`${API_BASE_URL}/transformer`, {
					headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
				})
			]);

			const nodesData = await nodesRes.json();
			const transData = await transRes.json();

			if (nodesData.success) nodes = nodesData.data;
			if (transData.success) transformers = transData.data;
		} catch (e) {
			console.error('Failed to fetch node data');
		} finally {
			isLoading = false;
		}
	}

	async function createNode() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/nodes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(newNode)
			});
			const data = await res.json();
			if (data.success) {
				isAdding = false;
				fetchData();
				newNode = {
					node_id: '',
					transformer_id: '',
					latitude: '',
					longitude: '',
					type: 'pole',
					parent_node_id: null
				};
			}
		} catch (e) {
			console.error('Create node failed');
		}
	}

	async function deleteNode(id) {
		if (!confirm('Delete this grid node? This might affect downstream connections.')) return;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/nodes/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) fetchData();
		} catch (e) {
			console.error('Delete failed');
		}
	}

	const filteredNodes = $derived(
		nodes.filter(
			(n) =>
				n.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				n.transformer_id.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	const availableParentNodes = $derived(
		nodes.filter((n) => n.transformer_id === newNode.transformer_id)
	);

	let mapNodes = $derived([
		...transformers.map((t) => ({
			id: t.transformer_id,
			type: 'transformer',
			lat: t.latitude,
			lng: t.longitude
		})),
		...nodes.map((n) => ({
			id: n.node_id,
			type: n.type,
			lat: n.latitude,
			lng: n.longitude,
			parentId: n.parent_node_id
		}))
	]);

	let currentMapCenter = $state({ lat: 12.9716, lng: 77.5946 });

	onMount(fetchData);

	$effect(() => {
		if (selectedTransformer) fetchData();
	});

	$effect(() => {
		if (newNode.latitude && newNode.longitude) {
			currentMapCenter = { lat: newNode.latitude, lng: newNode.longitude };
		} else if (newNode.transformer_id) {
			const t = transformers.find((t) => t.transformer_id === newNode.transformer_id);
			if (t) currentMapCenter = { lat: t.latitude, lng: t.longitude };
		} else if (newNode.parent_node_id) {
			const n = availableParentNodes.find((n) => n.node_id === newNode.parent_node_id);
			if (n) currentMapCenter = { lat: n.latitude, lng: n.longitude };
		} else if (transformers.length > 0) {
			currentMapCenter = { lat: transformers[0].latitude, lng: transformers[0].longitude };
		}
	});
</script>

<svelte:head>
	<title>Grid Nodes | GridSense Admin</title>
	<meta
		name="description"
		content="Manage poles, junctions, and infrastructure nodes within the distribution grid topology."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Grid Nodes</h1>
			<p class="text-slate-500">Manage poles and junctions within the grid topology.</p>
		</div>
		<button
			onclick={() => (isAdding = true)}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
		>
			<Plus class="h-4 w-4" /> Add Node
		</button>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center">
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by Node ID..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl border border-white/60 bg-white/40 pr-4 pl-12 text-sm font-medium shadow-sm backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
		<select
			bind:value={selectedTransformer}
			class="h-11 rounded-xl border border-white/60 bg-white/40 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20"
		>
			<option value="all">All Transformers</option>
			{#each transformers as t}
				<option value={t.transformer_id}>{t.transformer_id} ({t.location_description})</option>
			{/each}
		</select>
	</div>

	{#if isAdding}
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" in:fade>
			<h2 class="mb-4 text-lg font-bold text-slate-900">Add Grid Node (Pole/Junction)</h2>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="space-y-4">
					<div class="space-y-1">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Node ID</label>
						<input
							bind:value={newNode.node_id}
							placeholder="e.g. P-101"
							class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					<div class="space-y-1">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Transformer</label>
						<select
							bind:value={newNode.transformer_id}
							class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white"
						>
							<option value="" disabled selected>Select Source</option>
							{#each transformers as t}
								<option value={t.transformer_id}>{t.transformer_id}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Type</label>
						<select
							bind:value={newNode.type}
							class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white"
						>
							<option value="pole">Pole</option>
							<option value="junction">Junction</option>
						</select>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
							<input
								type="number"
								step="any"
								bind:value={newNode.latitude}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white"
							/>
						</div>
						<div class="space-y-1">
							<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
							<input
								type="number"
								step="any"
								bind:value={newNode.longitude}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white"
							/>
						</div>
					</div>
					<div class="space-y-1">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
							>Parent Node (Optional)</label
						>
						<select
							bind:value={newNode.parent_node_id}
							class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white"
						>
							<option value={null}>Root (No Parent)</option>
							{#each availableParentNodes as n}
								<option value={n.node_id}>{n.node_id} ({n.type})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="overflow-hidden rounded-2xl border border-slate-200">
					<div class="relative h-[300px] w-full">
						<GridMap
							nodes={mapNodes}
							center={currentMapCenter}
							onMapClick={(e) => {
								newNode.latitude = e.lat;
								newNode.longitude = e.lng;
							}}
							selectedLocation={newNode.latitude && newNode.longitude
								? { lat: newNode.latitude, lng: newNode.longitude }
								: null}
						/>
						<div
							class="pointer-events-none absolute right-0 bottom-4 left-0 z-[1000] flex justify-center"
						>
							<span class="rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-md"
								>Click map to set location</span
							>
						</div>
					</div>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={() => (isAdding = false)}
					class="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button
				>
				<button
					onclick={createNode}
					class="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
				>
					Create Grid Node
				</button>
			</div>
		</div>
	{/if}

	<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		<table class="w-full text-left">
			<thead class="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
				<tr>
					<th class="px-6 py-4">Node ID</th>
					<th class="px-6 py-4">Type</th>
					<th class="px-6 py-4">Source (Transformer)</th>
					<th class="px-6 py-4">Parent</th>
					<th class="px-6 py-4">Location</th>
					<th class="px-6 py-4 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#if isLoading}
					<tr>
						<td colspan="6" class="py-12 text-center text-slate-400">
							<Loader class="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
							Loading topology...
						</td>
					</tr>
				{:else if filteredNodes.length === 0}
					<tr
						><td colspan="6" class="py-12 text-center font-medium text-slate-500"
							>No grid nodes found.</td
						></tr
					>
				{:else}
					{#each filteredNodes as node}
						<tr class="group transition-colors hover:bg-slate-50">
							<td class="px-6 py-4 text-sm font-bold text-slate-900">{node.node_id}</td>
							<td class="px-6 py-4">
								<span
									class={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${node.type === 'junction' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
								>
									{node.type}
								</span>
							</td>
							<td class="px-6 py-4 text-sm font-medium text-slate-600">{node.transformer_id}</td>
							<td class="px-6 py-4 font-mono text-xs text-slate-400"
								>{node.parent_node_id || 'Root Node'}</td
							>
							<td class="px-6 py-4">
								<div class="flex items-center gap-1.5 text-xs text-slate-500">
									<MapPin class="h-3 w-3" />
									{node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
								</div>
							</td>
							<td class="px-6 py-4 text-right">
								<div
									class="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										class="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
										><Edit3 class="h-4 w-4" /></button
									>
									<button
										onclick={() => deleteNode(node.node_id)}
										class="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-red-600 hover:shadow-sm"
										><Trash2 class="h-4 w-4" /></button
									>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
