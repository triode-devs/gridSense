<script>
	import { API_BASE_URL } from '$lib/index.js';
	import { Loader, Zap, MapPin, Plus, Save, Network, GitBranch, ArrowRight } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import GoogleMap from '$lib/components/GoogleMap.svelte';

	let activeTab = 'transformer'; // 'transformer' | 'pole' | 'consumer'
	let isLoading = false;
	let message = '';
	let error = '';

	// Forms Data
	let transformerForm = {
		location_description: '',
		latitude: 28.6139,
		longitude: 77.209,
		status: 'active'
	};

	let poleForm = {
		node_id: '',
		transformer_id: '',
		parent_node_id: '', // Empty string implies null/root pole if intended
		latitude: 28.6145,
		longitude: 77.21,
		type: 'pole'
	};

	let consumerForm = {
		transformer_id: '',
		parent_node_id: '',
		consumer_name: '',
		type: 'household',
		latitude: 28.6155,
		longitude: 77.212,
		address: ''
	};

	async function submitTransformer() {
		isLoading = true;
		message = '';
		error = '';
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(transformerForm)
			});
			const data = await res.json();
			if (data.success) {
				message = `Transformer Created! ID: ${data.data.transformer_id}`;
				// Auto-fill other forms
				poleForm.transformer_id = data.data.transformer_id;
				consumerForm.transformer_id = data.data.transformer_id;
			} else {
				error = data.message || 'Failed to create transformer';
			}
		} catch (e) {
			error = 'Network error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function submitPole() {
		isLoading = true;
		message = '';
		error = '';
		try {
			const payload = { ...poleForm };
			if (!payload.parent_node_id || payload.parent_node_id.trim() === '') {
				payload.parent_node_id = null;
			}

			const res = await fetch(`${API_BASE_URL}/admin/nodes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (data.success) {
				message = `Node Created! ID: ${data.data.node_id}`;
				// Auto-set as parent for next pole often helps workflow
				poleForm.parent_node_id = data.data.node_id;
				consumerForm.parent_node_id = data.data.node_id;
				// Increment ID suggestion
				const numPart = parseInt(poleForm.node_id.replace(/\D/g, '')) || 0;
				poleForm.node_id = poleForm.node_id.replace(/\d+/, numPart + 1);
			} else {
				error = data.message || 'Failed to create node';
			}
		} catch (e) {
			error = 'Network error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function submitConsumer() {
		isLoading = true;
		message = '';
		error = '';
		try {
			const res = await fetch(`${API_BASE_URL}/admin/consumers`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(consumerForm)
			});
			const data = await res.json();
			if (data.success) {
				message = `Consumer Added: ${consumerForm.consumer_name}`;
				consumerForm.consumer_name = '';
			} else {
				error = data.message || 'Failed to add consumer';
			}
		} catch (e) {
			error = 'Network error occurred';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="h-full w-full space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Topology Manager</h1>
			<p class="text-slate-500">Construct and manage your electrical grid tree structure.</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
			>
				<GitBranch class="h-4 w-4" /> View Tree
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Map Preview (Placeholder for now as we focus on construction form) -->
		<div
			class="min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2"
		>
			<div class="border-b border-slate-100 p-4">
				<h2 class="font-bold text-slate-700">Grid Vizualization</h2>
			</div>
			<div class="h-full w-full">
				<!-- We can reuse google map here, passing dummy lines or fetched topology later -->
				<GoogleMap />
			</div>
		</div>

		<!-- Control Panel -->
		<div class="flex flex-col gap-4">
			<!-- Tabs -->
			<div class="flex rounded-xl bg-slate-100 p-1">
				<button
					class={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${activeTab === 'transformer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
					onclick={() => (activeTab = 'transformer')}
				>
					<Zap class="h-4 w-4" /> Source
				</button>
				<button
					class={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${activeTab === 'pole' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
					onclick={() => (activeTab = 'pole')}
				>
					<Network class="h-4 w-4" /> Pole
				</button>
				<button
					class={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${activeTab === 'consumer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
					onclick={() => (activeTab = 'consumer')}
				>
					<MapPin class="h-4 w-4" /> User
				</button>
			</div>

			<!-- Forms -->
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				{#if message}
					<div class="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-600" in:fade>
						{message}
					</div>
				{/if}
				{#if error}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600" in:fade>
						{error}
					</div>
				{/if}

				{#if activeTab === 'transformer'}
					<div in:fade class="space-y-4">
						<h3 class="font-bold text-slate-900">Add New Substation</h3>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">Description</label>
							<input
								type="text"
								bind:value={transformerForm.location_description}
								placeholder="e.g. Sector 4 Main"
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Lat</label>
								<input
									type="number"
									step="any"
									bind:value={transformerForm.latitude}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Lng</label>
								<input
									type="number"
									step="any"
									bind:value={transformerForm.longitude}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
						</div>
						<button
							disabled={isLoading}
							onclick={submitTransformer}
							class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-70"
						>
							{#if isLoading}
								<Loader class="h-4 w-4 animate-spin" />
							{:else}
								Create Transformer
							{/if}
						</button>
					</div>
				{:else if activeTab === 'pole'}
					<div in:fade class="space-y-4">
						<h3 class="font-bold text-slate-900">Extend / Branch Grid</h3>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">Transformer ID</label>
							<input
								type="text"
								bind:value={poleForm.transformer_id}
								placeholder="gs_t1"
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase"
								>Parent Node ID (Optional)</label
							>
							<input
								type="text"
								bind:value={poleForm.parent_node_id}
								placeholder="Leave empty for root pole"
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
							<p class="text-[10px] text-slate-400">
								If null, this connects directly to transformer.
							</p>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">New Node ID</label>
							<input
								type="text"
								bind:value={poleForm.node_id}
								placeholder="pole_A1"
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Lat</label>
								<input
									type="number"
									step="any"
									bind:value={poleForm.latitude}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Lng</label>
								<input
									type="number"
									step="any"
									bind:value={poleForm.longitude}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
						</div>
						<button
							disabled={isLoading}
							onclick={submitPole}
							class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-70"
						>
							{#if isLoading}
								<Loader class="h-4 w-4 animate-spin" />
							{:else}
								Create Pole
							{/if}
						</button>
					</div>
				{:else if activeTab === 'consumer'}
					<div in:fade class="space-y-4">
						<h3 class="font-bold text-slate-900">Add Consumer</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Trans. ID</label>
								<input
									type="text"
									bind:value={consumerForm.transformer_id}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
							<div class="space-y-2">
								<label class="text-xs font-bold text-slate-500 uppercase">Parent Pole</label>
								<input
									type="text"
									bind:value={consumerForm.parent_node_id}
									class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
								/>
							</div>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">Consumer Name</label>
							<input
								type="text"
								bind:value={consumerForm.consumer_name}
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">Type</label>
							<select
								bind:value={consumerForm.type}
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							>
								<option value="household">Household</option>
								<option value="commercial">Commercial</option>
								<option value="agricultural">Agricultural</option>
								<option value="industrial">Industrial</option>
							</select>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-slate-500 uppercase">Address</label>
							<input
								type="text"
								bind:value={consumerForm.address}
								class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
							/>
						</div>
						<button
							disabled={isLoading}
							onclick={submitConsumer}
							class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-70"
						>
							{#if isLoading}
								<Loader class="h-4 w-4 animate-spin" />
							{:else}
								Add Consumer
							{/if}
						</button>
					</div>
				{/if}
			</div>

			<!-- Quick Tip -->
			<div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
				<h4 class="mb-1 flex items-center gap-2 font-bold text-blue-800">
					<div class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs">
						i
					</div>
					Topology Guide
				</h4>
				<p class="text-xs leading-relaxed text-blue-700">
					Start by creating a <strong>Transformer</strong>. Then add a root <strong>Pole</strong>
					(Parent: null). Extend the line by adding more poles and settings their
					<strong>Parent Node ID</strong> to the previous pole's ID.
				</p>
			</div>
		</div>
	</div>
</div>
