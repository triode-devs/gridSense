<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Search,
		AlertTriangle,
		Zap,
		AlertOctagon,
		ArrowRight,
		Clock,
		Loader,
		CheckCircle2,
		X,
		Plus,
		MapPin
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let faults = $state([]);
	let consumers = $state([]);
	let isLoading = $state(false);

	let searchTerm = $state('');
	let statusFilter = $state('ongoing'); // ongoing, resolved, etc.

	// Reporting Modal
	let showReportModal = $state(false);
	let newFault = $state({
		consumer_id: '',
		fault_start_time: new Date().toISOString()
	});

	async function fetchFaults() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/faults?status=${statusFilter}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) faults = data.data;
		} catch (e) {
			console.error('Failed to fetch faults');
		} finally {
			isLoading = false;
		}
	}

	async function fetchConsumers() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/consumers`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) consumers = data.data;
		} catch (e) {
			console.error('Failed to fetch consumers');
		}
	}

	async function reportFault() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/faults`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(newFault)
			});
			const data = await res.json();
			if (data.success) {
				showReportModal = false;
				fetchFaults();
			}
		} catch (e) {
			console.error('Report failed');
		}
	}

	async function resolveFault(id) {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/faults/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify({
					status: 'resolved',
					fault_end_time: new Date().toISOString()
				})
			});
			const data = await res.json();
			if (data.success) fetchFaults();
		} catch (e) {
			console.error('Resolve failed');
		}
	}

	const filteredFaults = $derived(
		faults.filter(
			(f) =>
				f.fault_id?.toString().includes(searchTerm) ||
				f.consumer_id?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(() => {
		fetchFaults();
		fetchConsumers();
	});

	$effect(() => {
		if (statusFilter) fetchFaults();
	});
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Fault Management</h1>
			<p class="text-slate-500">Manual reporting and resolution of grid anomalies.</p>
		</div>
		<button
			onclick={() => (showReportModal = true)}
			class="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
		>
			<Plus class="h-4 w-4" /> Report New Fault
		</button>
	</div>

	<!-- Filters & Search -->
	<div
		class="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md md:flex-row"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by ID or Consumer..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white/50 pr-4 pl-10 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
		<div class="flex gap-1 overflow-x-auto p-1">
			{#each ['ongoing', 'resolved'] as status}
				<button
					onclick={() => (statusFilter = status)}
					class={`rounded-lg px-6 py-2 text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-all ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
				>
					{status}
				</button>
			{/each}
		</div>
	</div>

	<!-- Faults List -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#if isLoading && faults.length === 0}
			<div class="col-span-full py-20 text-center">
				<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
			</div>
		{:else if filteredFaults.length === 0}
			<div class="col-span-full py-20 text-center text-slate-500">
				No {statusFilter} faults found.
			</div>
		{:else}
			{#each filteredFaults as fault (fault.fault_id)}
				<div
					class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
					in:fade
				>
					<div class="flex items-start justify-between">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600"
						>
							<AlertTriangle class="h-6 w-6" />
						</div>
						<span
							class={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${fault.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'animate-pulse bg-red-100 text-red-700'}`}
						>
							{fault.status}
						</span>
					</div>

					<div class="mt-4">
						<h3 class="text-lg font-bold text-slate-900">Fault #{fault.fault_id}</h3>
						<div
							class="flex items-center gap-1.5 text-xs font-bold tracking-tight text-blue-600 uppercase"
						>
							<Zap class="h-3 w-3" />
							{fault.consumer_id}
						</div>
					</div>

					<div class="mt-4 space-y-2 border-t border-slate-100 pt-4">
						<div class="flex items-center gap-2 text-xs font-medium text-slate-600">
							<Clock class="h-3.5 w-3.5 text-slate-400" />
							<span>Start: {new Date(fault.fault_start_time).toLocaleString()}</span>
						</div>
						{#if fault.fault_end_time}
							<div
								class="flex items-center gap-2 text-xs font-bold font-medium text-emerald-600 text-slate-600"
							>
								<CheckCircle2 class="h-3.5 w-3.5" />
								<span>End: {new Date(fault.fault_end_time).toLocaleString()}</span>
							</div>
						{/if}
					</div>

					<div class="mt-4 flex items-center justify-between">
						{#if fault.status !== 'resolved'}
							<button
								onclick={() => resolveFault(fault.fault_id)}
								class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/10 hover:bg-blue-700"
							>
								<CheckCircle2 class="h-4 w-4" /> Resolve Now
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Report Modal -->
	{#if showReportModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
			in:fade
		>
			<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" in:scale={{ start: 0.95 }}>
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
						>
							<AlertOctagon class="h-5 w-5" />
						</div>
						<div>
							<h4 class="font-bold text-slate-900">Manual Fault Report</h4>
							<p class="text-xs text-slate-500">Record an unplanned outage.</p>
						</div>
					</div>
					<button
						onclick={() => (showReportModal = false)}
						class="text-slate-400 hover:text-slate-600"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
							>Select Consumer</label
						>
						<select
							bind:value={newFault.consumer_id}
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="" disabled selected>Select affected consumer...</option>
							{#each consumers as c}
								<option value={c.consumer_id}>{c.consumer_name} ({c.consumer_id})</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
							>Fault Start Time</label
						>
						<input
							type="datetime-local"
							bind:value={newFault.fault_start_time}
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<button
						onclick={reportFault}
						disabled={!newFault.consumer_id}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-xl shadow-red-900/20 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
					>
						<AlertTriangle class="h-5 w-5" /> Submit Report
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
