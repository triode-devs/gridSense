<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		MapPin,
		Users,
		AlertTriangle,
		Plus,
		Loader,
		Search,
		Trash2,
		Edit3,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let transformers = $state([]);
	let isLoading = $state(false);
	let searchTerm = $state('');

	let showAddModal = $state(false);
	let newTransformer = $state({
		location_description: '',
		latitude: '',
		longitude: '',
		status: 'active'
	});

	async function fetchTransformers() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) transformers = data.data;
		} catch (e) {
			console.error('Failed to fetch transformers');
		} finally {
			isLoading = false;
		}
	}

	async function createTransformer() {
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(newTransformer)
			});
			const data = await res.json();
			if (data.success) {
				showAddModal = false;
				fetchTransformers();
				newTransformer = {
					location_description: '',
					latitude: '',
					longitude: '',
					status: 'active'
				};
			}
		} catch (e) {
			console.error('Create failed');
		}
	}

	async function deleteTransformer(id) {
		if (!confirm('Are you sure you want to delete this transformer?')) return;
		try {
			const res = await fetch(`${API_BASE_URL}/transformer/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) fetchTransformers();
		} catch (e) {
			console.error('Delete failed');
		}
	}

	const filteredTransformers = $derived(
		transformers.filter(
			(t) =>
				t.location_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				t.transformer_id.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(fetchTransformers);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Transformer Directory</h1>
			<p class="text-slate-500">Monitor and manage all grid step-down units.</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
		>
			<Plus class="h-4 w-4" /> Register New
		</button>
	</div>

	<div
		class="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by ID or Location..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white pr-4 pl-12 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if isLoading && transformers.length === 0}
			<div class="col-span-full py-20 text-center">
				<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
			</div>
		{:else if filteredTransformers.length === 0}
			<div class="col-span-full py-20 text-center text-slate-500">No transformers found.</div>
		{:else}
			{#each filteredTransformers as t}
				<div
					class="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
							>
								<Zap class="h-6 w-6" />
							</div>
							<div>
								<h3 class="leading-tight font-bold text-slate-900">{t.location_description}</h3>
								<div class="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
									{t.transformer_id}
								</div>
							</div>
						</div>
						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button class="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600"
								><Edit3 class="h-4 w-4" /></button
							>
							<button
								onclick={() => deleteTransformer(t.transformer_id)}
								class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
								><Trash2 class="h-4 w-4" /></button
							>
						</div>
					</div>

					<div class="mt-6 grid grid-cols-2 gap-4">
						<div
							class="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600"
						>
							<Users class="h-3.5 w-3.5 text-slate-400" />
							{t.total_consumers} Consumers
						</div>
						<div
							class={`flex items-center gap-2 text-[11px] font-bold ${t.active_fault_groups > 0 ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'} rounded-lg border px-3 py-2`}
						>
							<AlertTriangle class="h-3.5 w-3.5" />
							{t.active_fault_groups} Faults
						</div>
					</div>

					<div class="mt-4 flex items-center gap-2 text-[10px] font-medium text-slate-400">
						<MapPin class="h-3.5 w-3.5 text-slate-300" />
						<span class="truncate">{t.latitude}, {t.longitude}</span>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Add Modal -->
	{#if showAddModal}
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
							<Plus class="h-5 w-5" />
						</div>
						<div>
							<h4 class="font-bold text-slate-900">New Transformer</h4>
							<p class="text-xs text-slate-500">Register a step-down distribution unit.</p>
						</div>
					</div>
					<button
						onclick={() => (showAddModal = false)}
						class="text-slate-400 hover:text-slate-600"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
							>Location Description</label
						>
						<input
							type="text"
							bind:value={newTransformer.location_description}
							placeholder="e.g. Oak Ridge Substation"
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
							<input
								type="number"
								step="any"
								bind:value={newTransformer.latitude}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
						<div class="space-y-2">
							<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
							<input
								type="number"
								step="any"
								bind:value={newTransformer.longitude}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
					</div>
					<button
						onclick={createTransformer}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700"
					>
						Register Unit
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
