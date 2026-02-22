<script>
	import { API_BASE_URL } from '$lib/index.js';
	import FaultMap from '$lib/components/ui/FaultMap.svelte';
	import {
		Search,
		AlertTriangle,
		Zap,
		AlertOctagon,
		Clock,
		Loader,
		CheckCircle2,
		X,
		Plus,
		Activity,
		BarChart2,
		RefreshCw,
		Layers,
		Radio,
		ChevronRight,
		ShieldAlert,
		MapPin,
		Users
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';

	// ─── State ───────────────────────────────────────────────────────────────────
	let faults = $state([]);
	let consumers = $state([]);
	let transformers = $state([]);
	let activeFaults = $state([]);
	let analysisResult = $state(null);

	let isLoading = $state(false);
	let isAnalyzing = $state(false);
	let isLoadingActive = $state(false);
	let isResolvingGroup = $state(false);

	let searchTerm = $state('');
	let statusFilter = $state('ongoing');
	let consumerFilter = $state('');
	let activeTab = $state('list'); // list | monitor | analysis

	// ─── Report Modal ─────────────────────────────────────────────────────────────
	let showReportModal = $state(false);
	let newFault = $state({
		consumer_id: '',
		fault_start_time: new Date().toISOString().slice(0, 16)
	});
	let reportError = $state('');
	let isReporting = $state(false);

	// ─── Analysis ─────────────────────────────────────────────────────────────────
	let selectedTransformer = $state('');

	// ─── Helpers ──────────────────────────────────────────────────────────────────
	function authHeaders() {
		return {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json'
		};
	}

	function timeAgo(iso) {
		if (!iso) return '—';
		const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function duration(start) {
		const mins = Math.round((Date.now() - new Date(start)) / 60000);
		if (mins < 60) return `${mins} min`;
		return `${Math.floor(mins / 60)}h ${mins % 60}m`;
	}

	const groupedActiveFaults = $derived(() => {
		const groups = {};
		for (const f of activeFaults) {
			const key = f.fault_group_id || `solo_${f.fault_id}`;
			if (!groups[key])
				groups[key] = { group_id: key, faults: [], transformer_id: f.transformer_id };
			groups[key].faults.push(f);
		}
		return Object.values(groups);
	});

	// ─── API Calls ────────────────────────────────────────────────────────────────
	async function fetchFaults() {
		isLoading = true;
		try {
			let url = `${API_BASE_URL}/admin/faults?status=${statusFilter}`;
			if (consumerFilter) url += `&consumer_id=${encodeURIComponent(consumerFilter)}`;
			const res = await fetch(url, { headers: authHeaders() });
			const data = await res.json();
			if (data.success) faults = data.data;
		} catch (e) {
			console.error('fetchFaults failed');
		} finally {
			isLoading = false;
		}
	}

	async function fetchConsumers() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/consumers`, { headers: authHeaders() });
			const data = await res.json();
			if (data.success) consumers = data.data;
		} catch (e) {}
	}

	async function fetchTransformers() {
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, { headers: authHeaders() });
			const data = await res.json();
			if (data.success) {
				transformers = data.data;
				if (transformers.length > 0 && !selectedTransformer)
					selectedTransformer = transformers[0].transformer_id;
			}
		} catch (e) {}
	}

	async function fetchActiveFaults() {
		isLoadingActive = true;
		try {
			const res = await fetch(`${API_BASE_URL}/esp/faults/active`, { headers: authHeaders() });
			const data = await res.json();
			if (data.success) activeFaults = data.data ?? [];
		} catch (e) {
		} finally {
			isLoadingActive = false;
		}
	}

	async function reportFault() {
		if (!newFault.consumer_id) return;
		isReporting = true;
		reportError = '';
		try {
			const res = await fetch(`${API_BASE_URL}/admin/faults`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					consumer_id: newFault.consumer_id,
					fault_start_time: new Date(newFault.fault_start_time).toISOString()
				})
			});
			const data = await res.json();
			if (data.success) {
				showReportModal = false;
				newFault = { consumer_id: '', fault_start_time: new Date().toISOString().slice(0, 16) };
				fetchFaults();
			} else {
				reportError = data.message || 'Submission failed.';
			}
		} catch (e) {
			reportError = 'Network error.';
		} finally {
			isReporting = false;
		}
	}

	async function resolveFault(id) {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/faults/${id}`, {
				method: 'PUT',
				headers: authHeaders(),
				body: JSON.stringify({ status: 'resolved', fault_end_time: new Date().toISOString() })
			});
			const data = await res.json();
			if (data.success) fetchFaults();
		} catch (e) {}
	}

	async function resolveGroup(fault_group_id) {
		isResolvingGroup = fault_group_id;
		try {
			const res = await fetch(`${API_BASE_URL}/esp/fault/resolve`, {
				method: 'PUT',
				headers: authHeaders(),
				body: JSON.stringify({ fault_group_id, device_id: 'admin_dashboard' })
			});
			const data = await res.json();
			if (data.success) {
				fetchActiveFaults();
				fetchFaults();
			}
		} catch (e) {
		} finally {
			isResolvingGroup = false;
		}
	}

	async function runAnalysis() {
		if (!selectedTransformer) return;
		isAnalyzing = true;
		analysisResult = null;
		try {
			const res = await fetch(`${API_BASE_URL}/api/fault-analysis/${selectedTransformer}`, {
				headers: authHeaders()
			});
			const data = await res.json();
			if (data.success) analysisResult = data;
		} catch (e) {
		} finally {
			isAnalyzing = false;
		}
	}

	const filteredFaults = $derived(
		faults.filter(
			(f) =>
				!searchTerm ||
				f.fault_id?.toString().includes(searchTerm) ||
				f.consumer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				f.fault_group_id?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	// ─── Lifecycle ────────────────────────────────────────────────────────────────
	onMount(() => {
		fetchFaults();
		fetchConsumers();
		fetchTransformers();
	});

	$effect(() => {
		if (statusFilter !== undefined || consumerFilter !== undefined) fetchFaults();
	});

	$effect(() => {
		if (activeTab === 'monitor') fetchActiveFaults();
	});
</script>

<svelte:head>
	<title>Fault Management | GridSense Admin</title>
	<meta
		name="description"
		content="Report, monitor, and resolve grid faults and power anomalies in real time."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<!-- ── Header ─────────────────────────────────────────────────────────────── -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Fault Management</h1>
			<p class="text-slate-500">Monitor, analyze, and resolve grid anomalies.</p>
		</div>
		<button
			onclick={() => (showReportModal = true)}
			class="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 active:scale-95"
		>
			<Plus class="h-4 w-4" /> Report Fault
		</button>
	</div>

	<!-- ── Tabs ────────────────────────────────────────────────────────────────── -->
	<div
		class="flex gap-1 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md"
	>
		{#each [{ id: 'list', label: 'Fault List', icon: Layers }, { id: 'monitor', label: 'Live Monitor', icon: Radio }, { id: 'analysis', label: 'LCA Analysis', icon: BarChart2 }] as tab}
			<button
				onclick={() => (activeTab = tab.id)}
				class={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
			>
				<svelte:component this={tab.icon} class="h-4 w-4" />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- ══════════════════════════════════════════════════════════════════════════
	     TAB 1 — FAULT LIST
	     ══════════════════════════════════════════════════════════════════════════ -->
	{#if activeTab === 'list'}
		<div class="space-y-4" in:fade={{ duration: 150 }}>
			<!-- Filters -->
			<div
				class="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-md md:flex-row"
			>
				<div class="relative flex-1">
					<Search class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
					<input
						type="text"
						placeholder="Search fault ID, consumer, group..."
						bind:value={searchTerm}
						class="h-11 w-full rounded-xl bg-white/70 pr-4 pl-10 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20"
					/>
				</div>
				<div class="relative">
					<Users class="absolute top-3 left-3 h-4 w-4 text-slate-400" />
					<select
						bind:value={consumerFilter}
						class="h-11 rounded-xl border-0 bg-white/70 pr-8 pl-9 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20"
					>
						<option value="">All Consumers</option>
						{#each consumers as c}
							<option value={c.consumer_id}>{c.consumer_name} ({c.consumer_id})</option>
						{/each}
					</select>
				</div>
				<div class="flex gap-1 p-0.5">
					{#each ['ongoing', 'resolved'] as s}
						<button
							onclick={() => (statusFilter = s)}
							class={`rounded-lg px-5 py-2 text-xs font-bold whitespace-nowrap uppercase transition-all ${statusFilter === s ? (s === 'ongoing' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : 'text-slate-500 hover:bg-white/60'}`}
						>
							{s}
						</button>
					{/each}
				</div>
			</div>

			<!-- Grid -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#if isLoading && faults.length === 0}
					<div class="col-span-full py-24 text-center">
						<Loader class="mx-auto h-8 w-8 animate-spin text-red-500" />
					</div>
				{:else if filteredFaults.length === 0}
					<div class="col-span-full flex flex-col items-center py-24">
						<div
							class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
						>
							<ShieldAlert class="h-8 w-8" />
						</div>
						<p class="font-bold text-slate-700">No {statusFilter} faults found</p>
					</div>
				{:else}
					{#each filteredFaults as fault (fault.fault_id)}
						<div
							class="group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl {fault.status ===
							'resolved'
								? 'border-slate-200 hover:border-emerald-200'
								: 'border-red-100 hover:border-red-300'}"
							in:fly={{ y: 8, duration: 200 }}
						>
							<div class="flex items-start justify-between">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-xl {fault.status ===
									'resolved'
										? 'bg-emerald-50 text-emerald-600'
										: 'bg-red-50 text-red-600'}"
								>
									{#if fault.status === 'resolved'}
										<CheckCircle2 class="h-6 w-6" />
									{:else}
										<AlertTriangle class="h-6 w-6" />
									{/if}
								</div>
								<span
									class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase {fault.status ===
									'resolved'
										? 'bg-emerald-100 text-emerald-700'
										: 'animate-pulse bg-red-100 text-red-700'}"
								>
									{fault.status ?? 'ongoing'}
								</span>
							</div>

							<div class="mt-3">
								<h3 class="text-base font-bold text-slate-900">Fault #{fault.fault_id}</h3>
								<div
									class="mt-1 flex items-center gap-1.5 text-xs font-bold tracking-tight text-blue-600 uppercase"
								>
									<Zap class="h-3 w-3" />{fault.consumer_id}
								</div>
								{#if fault.fault_group_id}
									<div class="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-400">
										<Layers class="h-3 w-3" />
										<span class="font-mono">{fault.fault_group_id.slice(0, 22)}…</span>
									</div>
								{/if}
							</div>

							<div class="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
								<div class="flex items-center gap-2 text-xs font-medium text-slate-500">
									<Clock class="h-3.5 w-3.5 text-slate-300" />
									Start: {new Date(fault.fault_start_time).toLocaleString()}
								</div>
								{#if fault.fault_end_time}
									<div class="flex items-center gap-2 text-xs font-bold text-emerald-600">
										<CheckCircle2 class="h-3.5 w-3.5" />
										End: {new Date(fault.fault_end_time).toLocaleString()}
									</div>
								{:else}
									<div class="flex items-center gap-2 text-xs font-medium text-red-500">
										<Activity class="h-3.5 w-3.5" /> Active for {duration(fault.fault_start_time)}
									</div>
								{/if}
							</div>

							<div class="mt-4 flex gap-2">
								<a
									href="/faults/{fault.transformer_id}"
									class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
								>
									Details <ChevronRight class="h-3.5 w-3.5" />
								</a>
								{#if fault.status !== 'resolved'}
									<button
										onclick={() => resolveFault(fault.fault_id)}
										class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
									>
										<CheckCircle2 class="h-3.5 w-3.5" /> Resolve
									</button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- ══════════════════════════════════════════════════════════════════════════
	     TAB 2 — LIVE MONITOR
	     ══════════════════════════════════════════════════════════════════════════ -->
	{:else if activeTab === 'monitor'}
		<div class="space-y-4" in:fade={{ duration: 150 }}>
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-slate-500">
					Real-time outages from ESP hardware, grouped by fault batch.
				</p>
				<button
					onclick={fetchActiveFaults}
					class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
				>
					<RefreshCw class="h-3.5 w-3.5 {isLoadingActive ? 'animate-spin' : ''}" /> Refresh
				</button>
			</div>

			{#if isLoadingActive}
				<div class="flex h-64 items-center justify-center">
					<Loader class="h-8 w-8 animate-spin text-red-500" />
				</div>
			{:else if groupedActiveFaults().length === 0}
				<div
					class="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 py-24 text-center"
				>
					<div
						class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
					>
						<CheckCircle2 class="h-8 w-8" />
					</div>
					<p class="font-bold text-slate-700">All Clear</p>
					<p class="mt-1 text-sm text-slate-500">No active ESP-reported faults.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each groupedActiveFaults() as group (group.group_id)}
						<div
							class="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm"
							in:fly={{ y: 6, duration: 200 }}
						>
							<div
								class="flex items-center justify-between border-b border-red-50 bg-red-50/60 px-6 py-4"
							>
								<div>
									<div class="flex items-center gap-2">
										<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
										<span class="text-xs font-bold tracking-widest text-red-700 uppercase"
											>Fault Group</span
										>
									</div>
									<p class="mt-0.5 font-mono text-sm font-bold text-slate-800">{group.group_id}</p>
									{#if group.transformer_id}
										<p class="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
											<Zap class="h-3 w-3" /> Transformer: {group.transformer_id}
										</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<span class="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
										{group.faults.length} consumer{group.faults.length !== 1 ? 's' : ''}
									</span>
									<button
										onclick={() => resolveGroup(group.group_id)}
										disabled={isResolvingGroup === group.group_id}
										class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
									>
										{#if isResolvingGroup === group.group_id}
											<Loader class="h-3.5 w-3.5 animate-spin" />
										{:else}
											<CheckCircle2 class="h-3.5 w-3.5" />
										{/if}
										Resolve Group
									</button>
								</div>
							</div>
							<div class="divide-y divide-slate-50">
								{#each group.faults as f}
									<div class="flex items-center justify-between px-6 py-3">
										<div class="flex items-center gap-3">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500"
											>
												<AlertTriangle class="h-4 w-4" />
											</div>
											<div>
												<span class="text-sm font-bold text-slate-800">{f.consumer_id}</span>
												<p class="text-xs font-medium text-slate-400">Fault #{f.fault_id}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="text-xs font-bold text-red-600">{timeAgo(f.fault_start_time)}</p>
											<p class="text-xs font-medium text-slate-400">
												{duration(f.fault_start_time)} active
											</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ══════════════════════════════════════════════════════════════════════════
	     TAB 3 — LCA ANALYSIS
	     ══════════════════════════════════════════════════════════════════════════ -->
	{:else if activeTab === 'analysis'}
		<div class="space-y-6" in:fade={{ duration: 150 }}>
			<p class="text-sm font-medium text-slate-500">
				Run the <strong class="text-slate-700">Lowest Common Ancestor (LCA)</strong> algorithm against
				all ongoing faults for a transformer to pinpoint the exact line or pole affected. Fault nodes
				and their downstream subtree are highlighted in red on the map.
			</p>

			<!-- Transformer picker + run button -->
			<div
				class="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-end"
			>
				<div class="flex-1">
					<label
						class="mb-1 block px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
					>
						Select Transformer
					</label>
					<select
						bind:value={selectedTransformer}
						class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
					>
						{#each transformers as t}
							<option value={t.transformer_id}
								>{t.name ?? t.transformer_id} ({t.transformer_id})</option
							>
						{/each}
					</select>
				</div>
				<button
					onclick={runAnalysis}
					disabled={isAnalyzing || !selectedTransformer}
					class="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-60"
				>
					{#if isAnalyzing}
						<Loader class="h-4 w-4 animate-spin" /> Analyzing…
					{:else}
						<Activity class="h-4 w-4" /> Run Analysis
					{/if}
				</button>
			</div>

			<!-- Analysis result -->
			{#if isAnalyzing}
				<div class="flex h-64 flex-col items-center justify-center gap-4">
					<Loader class="h-10 w-10 animate-spin text-blue-600" />
					<p class="text-sm font-medium text-slate-500">Running LCA algorithm…</p>
				</div>
			{:else if analysisResult}
				<div class="space-y-4" in:fly={{ y: 10, duration: 250 }}>
					<!-- Summary banner -->
					<div
						class="flex items-center gap-4 rounded-2xl border p-5 {analysisResult.has_faults
							? 'border-red-200 bg-red-50'
							: 'border-emerald-200 bg-emerald-50'}"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl {analysisResult.has_faults
								? 'bg-red-100 text-red-600'
								: 'bg-emerald-100 text-emerald-600'}"
						>
							{#if analysisResult.has_faults}
								<AlertTriangle class="h-6 w-6" />
							{:else}
								<CheckCircle2 class="h-6 w-6" />
							{/if}
						</div>
						<div>
							<p
								class="font-bold {analysisResult.has_faults ? 'text-red-800' : 'text-emerald-800'}"
							>
								{analysisResult.has_faults ? 'Active Faults Detected' : 'No Active Faults'}
							</p>
							<p class="text-sm {analysisResult.has_faults ? 'text-red-600' : 'text-emerald-600'}">
								Transformer: <strong>{selectedTransformer}</strong>
							</p>
						</div>
					</div>

					{#if analysisResult.fault_analysis}
						{@const a = analysisResult.fault_analysis}

						<!-- Stat cards -->
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
								<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
									Fault Node (LCA)
								</p>
								<div class="flex items-center gap-2">
									<MapPin class="h-5 w-5 text-red-500" />
									<span class="text-2xl font-bold text-slate-900">{a.fault_node ?? '—'}</span>
								</div>
								<p class="mt-3 text-sm leading-relaxed font-medium text-slate-600">{a.analysis}</p>
							</div>

							<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
								<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
									Total Affected
								</p>
								<div class="flex items-end gap-2">
									<span class="text-5xl font-bold text-slate-900">{a.total_affected ?? 0}</span>
									<span class="mb-1 text-sm font-medium text-slate-500">consumers</span>
								</div>
								<div
									class="mt-4 flex items-center gap-2 text-xs font-bold {a.fault_detected
										? 'text-red-600'
										: 'text-emerald-600'}"
								>
									{#if a.fault_detected}
										<AlertTriangle class="h-3.5 w-3.5" /> Line fault confirmed
									{:else}
										<CheckCircle2 class="h-3.5 w-3.5" /> No line fault
									{/if}
								</div>
							</div>
						</div>

						<!-- ── Live Fault Zone Map ──────────────────────────────── -->
						{#if analysisResult.map_data?.features?.length > 0}
							<div in:fly={{ y: 8, duration: 200 }}>
								<div class="mb-3 flex items-center justify-between">
									<p class="text-sm font-bold text-slate-700">
										Fault Zone Map
										<span
											class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
										>
											{analysisResult.map_data.features.length} features
										</span>
									</p>
									<a
										href="/topology/{selectedTransformer}"
										class="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
									>
										Open full topology <ChevronRight class="h-3.5 w-3.5" />
									</a>
								</div>
								<div
									class="h-[420px] w-full overflow-hidden rounded-2xl border border-red-100 shadow-xl shadow-red-900/5"
								>
									<FaultMap mapData={analysisResult.map_data} faultNode={a.fault_node} />
								</div>
							</div>
						{/if}
					{:else if !analysisResult.has_faults}
						<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
							<CheckCircle2 class="mx-auto mb-3 h-10 w-10 text-emerald-500" />
							<p class="font-bold text-emerald-800">Grid is healthy for this transformer</p>
							<p class="mt-1 text-sm text-emerald-600">No ongoing faults to analyze.</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Empty state -->
				<div
					class="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 py-24 text-center"
				>
					<div
						class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
					>
						<BarChart2 class="h-8 w-8" />
					</div>
					<p class="font-bold text-slate-700">No analysis run yet</p>
					<p class="mt-1 text-sm text-slate-500">Select a transformer and click "Run Analysis".</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- ══════════════════════════════════════════════════════════════════════════
     REPORT FAULT MODAL
     ══════════════════════════════════════════════════════════════════════════ -->
{#if showReportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
		in:fade={{ duration: 150 }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
			in:scale={{ start: 0.95, duration: 200 }}
		>
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
						<AlertOctagon class="h-5 w-5" />
					</div>
					<div>
						<h4 class="font-bold text-slate-900">Manual Fault Report</h4>
						<p class="text-xs text-slate-500">Record an unplanned outage.</p>
					</div>
				</div>
				<button
					onclick={() => {
						showReportModal = false;
						reportError = '';
					}}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<label
						for="fault-consumer"
						class="block px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
					>
						Affected Consumer
					</label>
					<select
						id="fault-consumer"
						bind:value={newFault.consumer_id}
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20"
					>
						<option value="" disabled>Select affected consumer…</option>
						{#each consumers as c}
							<option value={c.consumer_id}>{c.consumer_name} ({c.consumer_id})</option>
						{/each}
					</select>
				</div>

				<div class="space-y-1.5">
					<label
						for="fault-time"
						class="block px-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
					>
						Fault Start Time
					</label>
					<input
						id="fault-time"
						type="datetime-local"
						bind:value={newFault.fault_start_time}
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
					/>
				</div>

				{#if reportError}
					<p class="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600" in:fade>
						{reportError}
					</p>
				{/if}

				<button
					onclick={reportFault}
					disabled={!newFault.consumer_id || isReporting}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-xl shadow-red-900/20 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
				>
					{#if isReporting}
						<Loader class="h-4 w-4 animate-spin" /> Submitting…
					{:else}
						<AlertTriangle class="h-5 w-5" /> Submit Report
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
