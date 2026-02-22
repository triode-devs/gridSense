<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Search,
		UserPlus,
		MapPin,
		Zap,
		Phone,
		ArrowRight,
		Loader,
		Shield,
		X,
		Key,
		Plus,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import GridMap from '$lib/components/ui/GridMap.svelte';

	let consumers = $state([]);
	let transformers = $state([]);
	let users = $state([]);
	let isLoading = $state(false);

	let searchTerm = $state('');
	let selectedTransformer = $state('all');
	let message = $state({ text: '', type: '' });

	// Modals
	let showAccessModal = $state(false);
	let showRegisterModal = $state(false);
	let selectedForAccess = $state(null);
	let selectedUserForAccess = $state('');

	let newConsumer = $state({
		userid: '',
		transformer_id: '',
		parent_node_id: '',
		consumer_name: '',
		address: '',
		latitude: '',
		longitude: '',
		type: 'consumer'
	});

	let availableNodes = $state([]);
	let isNodesLoading = $state(false);

	let currentMapCenter = $state({ lat: 12.9716, lng: 77.5946 });

	async function fetchNodesForTransformer(tid) {
		if (!tid) return;
		isNodesLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/nodes?transformer_id=${tid}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				availableNodes = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch nodes');
		} finally {
			isNodesLoading = false;
		}
	}

	async function registerConsumer() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/consumers`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({
					...newConsumer,
					parent_node_id: newConsumer.parent_node_id || null
				})
			});
			const data = await res.json();
			if (data.success) {
				showMessage('Consumer registered successfully', 'success');
				showRegisterModal = false;
				fetchData();
				newConsumer = {
					userid: '',
					transformer_id: '',
					parent_node_id: '',
					consumer_name: '',
					address: '',
					latitude: '',
					longitude: '',
					type: 'consumer'
				};
			} else {
				showMessage(data.message || 'Registration failed', 'error');
			}
		} catch (e) {
			showMessage('Registration failed', 'error');
		}
	}

	// Only show the selected transformer + its nodes on the map (not all transformers)
	let mapNodes = $derived.by(() => {
		if (!newConsumer.transformer_id) {
			// No transformer selected — show all transformers as reference
			return transformers.map((t) => ({
				id: t.transformer_id,
				type: 'transformer',
				lat: t.latitude,
				lng: t.longitude
			}));
		}
		// Transformer selected — show just that transformer + its poles/nodes
		const selected = transformers.find((t) => t.transformer_id === newConsumer.transformer_id);
		const transformerNode = selected
			? [
					{
						id: selected.transformer_id,
						type: 'transformer',
						lat: selected.latitude,
						lng: selected.longitude
					}
				]
			: [];
		const poleNodes = availableNodes.map((n) => ({
			id: n.node_id,
			type: n.type,
			lat: n.latitude,
			lng: n.longitude,
			parentId: n.parent_node_id || newConsumer.transformer_id
		}));
		return [...transformerNode, ...poleNodes];
	});

	// When transformer changes: fetch its nodes and update map center (flyTo handled by GridMap)
	$effect(() => {
		if (newConsumer.transformer_id) {
			fetchNodesForTransformer(newConsumer.transformer_id);
			const t = transformers.find((t) => t.transformer_id === newConsumer.transformer_id);
			if (t) currentMapCenter = { lat: t.latitude, lng: t.longitude };
		}
	});

	// When parent node changes: pan to it
	$effect(() => {
		if (newConsumer.parent_node_id) {
			const n = availableNodes.find((n) => n.node_id === newConsumer.parent_node_id);
			if (n) currentMapCenter = { lat: n.latitude, lng: n.longitude };
		}
	});

	async function fetchData() {
		isLoading = true;
		try {
			const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
			const query = new URLSearchParams();
			if (selectedTransformer !== 'all') query.set('transformer_id', selectedTransformer);
			if (searchTerm) query.set('search', searchTerm);

			// Fetch each resource independently to prevent total failure
			const consPromise = fetch(`${API_BASE_URL}/admin/consumers?${query.toString()}`, { headers })
				.then((r) => r.json())
				.then((d) => (d.success ? (consumers = d.data) : []))
				.catch((e) => console.error('Consumers fetch failed', e));

			const transPromise = fetch(`${API_BASE_URL}/transformer`, { headers })
				.then((r) => r.json())
				.then((d) => (d.success ? (transformers = d.data) : []))
				.catch((e) => console.error('Transformers fetch failed', e));

			const usersPromise = fetch(`${API_BASE_URL}/admin/users`, { headers })
				.then((r) => r.json())
				.then((d) => (d.success ? (users = d.data) : []))
				.catch((e) => console.error('Users fetch failed', e));

			await Promise.allSettled([consPromise, transPromise, usersPromise]);
		} catch (e) {
			console.error('Failed to fetch data');
		} finally {
			isLoading = false;
		}
	}

	async function updateStatus(id, status) {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/consumers/${id}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({ status })
			});
			const data = await res.json();
			if (data.success) {
				consumers = consumers.map((c) => (c.consumer_id === id ? { ...c, status } : c));
				showMessage('Status updated successfully', 'success');
			}
		} catch (e) {
			showMessage('Failed to update status', 'error');
		}
	}

	async function grantAccess() {
		if (!selectedUserForAccess || !selectedForAccess) return;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/access`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({
					userid: selectedUserForAccess,
					consumer_ids: [selectedForAccess.consumer_id]
				})
			});
			const data = await res.json();
			if (data.success) {
				showMessage(`Access granted to ${selectedForAccess.consumer_name}`, 'success');
				showAccessModal = false;
			}
		} catch (e) {
			showMessage('Access grant failed', 'error');
		}
	}

	function showMessage(text, type) {
		message = { text, type };
		setTimeout(() => (message = { text: '', type: '' }), 3000);
	}

	onMount(fetchData);

	// Only re-fetch consumer list when search term or transformer filter changes
	$effect(() => {
		const _search = searchTerm;
		const _tf = selectedTransformer;
		const debounce = setTimeout(() => fetchData(), 300);
		return () => clearTimeout(debounce);
	});
</script>

<svelte:head>
	<title>Consumer Management | GridSense Admin</title>
	<meta
		name="description"
		content="Register new consumer connections, manage access control, and view all grid consumers."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Consumer Management</h1>
			<p class="text-slate-500">Register new connections and manage access control lists.</p>
		</div>
		<button
			onclick={() => (showRegisterModal = true)}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
		>
			<UserPlus class="h-4 w-4" /> Register Consumer
		</button>
	</div>

	{#if message.text}
		<div
			in:fade
			class={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
		>
			{#if message.type === 'success'}
				<CheckCircle2 class="h-4 w-4" />
			{:else}
				<AlertCircle class="h-4 w-4" />
			{/if}
			{message.text}
		</div>
	{/if}

	<!-- Controls -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center">
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by name, ID, or mobile..."
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
				<option value={t.transformer_id}>{t.transformer_id}</option>
			{/each}
		</select>
	</div>

	<!-- Consumers List -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if isLoading && consumers.length === 0}
			<div class="col-span-full py-20 text-center">
				<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
			</div>
		{:else if consumers.length === 0}
			<div class="col-span-full py-20 text-center font-medium text-slate-500">
				No consumers found matching criteria.
			</div>
		{:else}
			{#each consumers as consumer (consumer.consumer_id)}
				<div
					class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 font-bold text-blue-600"
							>
								{consumer.consumer_name?.[0].toUpperCase() || 'C'}
							</div>
							<div>
								<h3 class="leading-tight font-bold text-slate-900">{consumer.consumer_name}</h3>
								<div class="font-mono text-[10px] tracking-tighter text-slate-400 uppercase">
									{consumer.consumer_id} • {consumer.type}
								</div>
							</div>
						</div>
						<div class="flex flex-col items-end gap-1">
							<button
								onclick={() =>
									updateStatus(
										consumer.consumer_id,
										consumer.status === 'active' ? 'line-cut' : 'active'
									)}
								class={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase transition-all ${consumer.status === 'active' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-red-100 bg-red-50 text-red-600'}`}
							>
								{consumer.status}
							</button>
						</div>
					</div>

					<div class="mt-4 space-y-2 text-xs text-slate-500">
						<div class="flex items-center gap-2 font-medium">
							<MapPin class="h-3.5 w-3.5 text-slate-300" />
							<span class="truncate">{consumer.address}</span>
						</div>
						<div class="flex items-center gap-2">
							<Zap class="h-3.5 w-3.5 text-slate-300" />
							<span
								>Transformer: <span class="font-bold text-slate-700">{consumer.transformer_id}</span
								></span
							>
						</div>
					</div>

					<div class="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
						<button
							onclick={() => {
								selectedForAccess = consumer;
								showAccessModal = true;
							}}
							class="flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
						>
							<Key class="h-3.5 w-3.5" /> Manage Access
						</button>
						<a
							href={`/consumer/${consumer.consumer_id}`}
							class="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-600"
						>
							Details <ArrowRight class="h-3 w-3" />
						</a>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Access Control Modal -->
	{#if showAccessModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
			in:fade
		>
			<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" in:scale={{ start: 0.95 }}>
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
						>
							<Shield class="h-5 w-5" />
						</div>
						<div>
							<h4 class="font-bold text-slate-900">Grant Consumer Access</h4>
							<p class="text-xs text-slate-500">Allow a user to monitor this connection.</p>
						</div>
					</div>
					<button
						onclick={() => (showAccessModal = false)}
						class="text-slate-400 hover:text-slate-600"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				<div class="space-y-4">
					<div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
						<div class="mb-1 text-[10px] font-bold text-slate-400 uppercase">Consumer Details</div>
						<div class="font-bold text-slate-800">{selectedForAccess?.consumer_name}</div>
						<div class="text-xs text-slate-500">{selectedForAccess?.consumer_id}</div>
					</div>

					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
							>Select User (Administrator)</label
						>
						<select
							bind:value={selectedUserForAccess}
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="" disabled selected>Select User...</option>
							{#each users as user}
								<option value={user.userid}>{user.username} ({user.role})</option>
							{/each}
						</select>
					</div>

					<button
						onclick={grantAccess}
						disabled={!selectedUserForAccess}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
					>
						<Plus class="h-5 w-5" /> Grant Access
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Registration Modal -->
	{#if showRegisterModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
			in:fade
		>
			<div
				class="custom-scrollbar max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl transition-all sm:p-10"
				in:scale={{ start: 0.95 }}
			>
				<div class="mb-8 flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm"
						>
							<UserPlus class="h-6 w-6" />
						</div>
						<div>
							<h3 class="text-xl font-bold text-slate-900">New Consumer Registration</h3>
							<p class="text-xs font-medium text-slate-500">
								Primary details for the new grid connection.
							</p>
						</div>
					</div>
					<button
						onclick={() => (showRegisterModal = false)}
						class="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
					<div class="space-y-4">
						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Map to User Account</label
							>
							<select
								bind:value={newConsumer.userid}
								class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
							>
								<option value="" disabled selected>Select User to map account...</option>
								{#each users as user}
									<option value={user.userid}>{user.username} ({user.role})</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Consumer Name</label
							>
							<input
								type="text"
								bind:value={newConsumer.consumer_name}
								placeholder="Full Name"
								class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
							/>
						</div>

						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Connection Type</label
							>
							<select
								bind:value={newConsumer.type}
								class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
							>
								<option value="consumer">Residential</option>
								<option value="commercial">Commercial</option>
								<option value="agri">Agricultural</option>
							</select>
						</div>

						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Target Transformer</label
							>
							<select
								bind:value={newConsumer.transformer_id}
								class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
							>
								<option value="" disabled selected>Select Transformer...</option>
								{#each transformers as t}
									<option value={t.transformer_id}
										>{t.transformer_id} ({t.location_description})</option
									>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Parent Grid Node</label
							>
							<div class="relative">
								<select
									bind:value={newConsumer.parent_node_id}
									disabled={!newConsumer.transformer_id || isNodesLoading}
									class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
								>
									{#if isNodesLoading}
										<option>Loading nodes...</option>
									{:else}
										<option value="" disabled selected>Select Parent Node...</option>
										{#each availableNodes as node}
											<option value={node.node_id}>{node.node_id} ({node.type})</option>
										{/each}
									{/if}
								</select>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
									>Latitude</label
								>
								<input
									type="number"
									step="any"
									bind:value={newConsumer.latitude}
									placeholder="12.9716"
									class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
								/>
							</div>
							<div class="space-y-2">
								<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
									>Longitude</label
								>
								<input
									type="number"
									step="any"
									bind:value={newConsumer.longitude}
									placeholder="77.5946"
									class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
								>Delivery Address</label
							>
							<textarea
								bind:value={newConsumer.address}
								rows="2"
								placeholder="Full service address..."
								class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
							></textarea>
						</div>
					</div>

					<div class="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200">
						<div class="relative flex-1">
							<GridMap
								nodes={mapNodes}
								center={currentMapCenter}
								onMapClick={(e) => {
									newConsumer.latitude = e.lat;
									newConsumer.longitude = e.lng;
								}}
								selectedLocation={newConsumer.latitude && newConsumer.longitude
									? { lat: newConsumer.latitude, lng: newConsumer.longitude }
									: null}
							/>
							<div
								class="pointer-events-none absolute right-0 bottom-4 left-0 z-1000 flex justify-center"
							>
								<span class="rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-md"
									>Click map to set location</span
								>
							</div>
						</div>
					</div>
				</div>

				<div class="mt-10 flex gap-4">
					<button
						onclick={() => (showRegisterModal = false)}
						class="flex-1 rounded-2xl border border-slate-100 bg-white py-4 font-bold text-slate-600 transition-all hover:bg-slate-50"
					>
						Cancel
					</button>
					<button
						onclick={registerConsumer}
						disabled={!newConsumer.consumer_name ||
							!newConsumer.transformer_id ||
							!newConsumer.userid}
						class="flex-1 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
					>
						Initialize Connection
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 10px;
	}
</style>
