<script>
	import { page } from '$app/stores';
	import { API_BASE_URL } from '$lib/index.js';
	import FaultMap from '$lib/components/ui/FaultMap.svelte';
	import {
		ArrowLeft,
		Zap,
		Activity,
		MapPin,
		AlertTriangle,
		CheckCircle2,
		Loader,
		Clock,
		Layers,
		RefreshCw,
		Users,
		ChevronRight
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	// transformer_id comes from the URL
	let transformerId = $derived($page.params.id);

	// ─── State ────────────────────────────────────────────────────────────────
	let analysisResult = $state(null);
	let faults = $state([]); // ongoing faults for this transformer
	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let error = $state('');

	function authHeaders() {
		return { Authorization: `Bearer ${localStorage.getItem('token')}` };
	}

	function duration(start) {
		const mins = Math.round((Date.now() - new Date(start)) / 60000);
		if (mins < 60) return `${mins} min`;
		return `${Math.floor(mins / 60)}h ${mins % 60}m`;
	}

	// ─── Fetch LCA analysis + ongoing faults in parallel ──────────────────────
	async function fetchAll(refresh = false) {
		if (refresh) isRefreshing = true;
		else isLoading = true;
		error = '';

		try {
			const [analysisRes, faultsRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/fault-analysis/${transformerId}`, { headers: authHeaders() }),
				fetch(`${API_BASE_URL}/admin/faults?status=ongoing`, { headers: authHeaders() })
			]);

			const analysisData = await analysisRes.json();
			const faultsData = await faultsRes.json();

			if (analysisData.success) {
				analysisResult = analysisData;
			} else {
				error = analysisData.message || 'Failed to run fault analysis.';
			}

			if (faultsData.success) {
				// Filter to only this transformer's faults
				faults = (faultsData.data ?? []).filter((f) => f.transformer_id === transformerId);
			}
		} catch (e) {
			error = 'Network error — could not reach the server.';
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	onMount(() => fetchAll());
</script>

<svelte:head>
	<title>Fault Analysis: {transformerId} | GridSense Admin</title>
	<meta
		name="description"
		content="LCA fault analysis and live fault zone map for transformer {transformerId}."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<!-- ── Back + Header ──────────────────────────────────────────────────────── -->
	<div class="flex items-center gap-4">
		<a
			href="/faults"
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-red-200 hover:text-red-600"
		>
			<ArrowLeft class="h-4 w-4" />
		</a>
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-slate-900">Fault Analysis</h1>
			<p class="flex items-center gap-1.5 text-sm font-medium text-slate-500">
				<Zap class="h-3.5 w-3.5" />
				Transformer: <strong class="font-mono text-slate-700">{transformerId}</strong>
			</p>
		</div>
		<button
			onclick={() => fetchAll(true)}
			class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
		>
			<RefreshCw class="h-3.5 w-3.5 {isRefreshing ? 'animate-spin' : ''}" />
			Refresh
		</button>
	</div>

	<!-- ── Loading ────────────────────────────────────────────────────────────── -->
	{#if isLoading}
		<div class="flex h-80 flex-col items-center justify-center gap-4">
			<Loader class="h-10 w-10 animate-spin text-red-500" />
			<p class="text-sm font-medium text-slate-500">Running LCA analysis…</p>
		</div>

		<!-- ── Error ──────────────────────────────────────────────────────────────── -->
	{:else if error}
		<div
			class="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 py-16 text-center"
		>
			<AlertTriangle class="mb-3 h-10 w-10 text-red-400" />
			<p class="font-bold text-red-800">Analysis Failed</p>
			<p class="mt-1 text-sm text-red-600">{error}</p>
			<button
				onclick={() => fetchAll()}
				class="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700"
			>
				Try Again
			</button>
		</div>

		<!-- ── Result ─────────────────────────────────────────────────────────────── -->
	{:else if analysisResult}
		<div class="space-y-6" in:fade={{ duration: 200 }}>
			<!-- Summary banner -->
			<div
				class="flex items-center gap-4 rounded-2xl border p-5 {analysisResult.has_faults
					? 'border-red-200 bg-red-50'
					: 'border-emerald-200 bg-emerald-50'}"
			>
				<div
					class="flex h-14 w-14 items-center justify-center rounded-xl {analysisResult.has_faults
						? 'bg-red-100 text-red-600'
						: 'bg-emerald-100 text-emerald-600'}"
				>
					{#if analysisResult.has_faults}
						<AlertTriangle class="h-7 w-7" />
					{:else}
						<CheckCircle2 class="h-7 w-7" />
					{/if}
				</div>
				<div class="flex-1">
					<p
						class="text-lg font-bold {analysisResult.has_faults
							? 'text-red-900'
							: 'text-emerald-900'}"
					>
						{analysisResult.has_faults ? 'Active Faults Detected' : 'Grid Healthy'}
					</p>
					<p class="text-sm {analysisResult.has_faults ? 'text-red-600' : 'text-emerald-600'}">
						{analysisResult.has_faults
							? `${faults.length} ongoing fault${faults.length !== 1 ? 's' : ''} on this transformer.`
							: 'No ongoing faults detected for this transformer.'}
					</p>
				</div>
				{#if analysisResult.has_faults}
					<span
						class="animate-pulse rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
					>
						LIVE
					</span>
				{/if}
			</div>

			{#if analysisResult.fault_analysis}
				{@const a = analysisResult.fault_analysis}

				<!-- Stat cards -->
				<div class="grid gap-4 sm:grid-cols-3" in:fly={{ y: 8, duration: 200 }}>
					<!-- Fault Node (LCA) -->
					<div class="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
						<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Fault Node (LCA)
						</p>
						<div class="flex items-center gap-2">
							<MapPin class="h-5 w-5 text-red-500" />
							<span class="font-mono text-2xl font-bold text-slate-900">{a.fault_node ?? '—'}</span>
						</div>
						<p class="mt-3 text-sm leading-relaxed font-medium text-slate-600">{a.analysis}</p>
					</div>

					<!-- Total Affected -->
					<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
						<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Total Affected
						</p>
						<div class="flex items-end gap-2">
							<span class="text-5xl font-bold text-slate-900">{a.total_affected ?? 0}</span>
							<span class="mb-1 text-sm font-medium text-slate-500">consumers</span>
						</div>
						{#if a.faulted_count != null}
							<div class="mt-3 flex items-center gap-2 text-xs font-bold text-red-600">
								<AlertTriangle class="h-3.5 w-3.5" />
								{a.faulted_count} actively without power
							</div>
						{/if}
					</div>

					<!-- Fault Status -->
					<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
						<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Line Status
						</p>
						<div
							class="flex items-center gap-2 {a.fault_detected
								? 'text-red-600'
								: 'text-emerald-600'}"
						>
							{#if a.fault_detected}
								<AlertTriangle class="h-7 w-7" />
								<span class="text-lg font-bold">Line Fault</span>
							{:else}
								<CheckCircle2 class="h-7 w-7" />
								<span class="text-lg font-bold">No Fault</span>
							{/if}
						</div>
						<p class="mt-3 text-xs font-medium text-slate-500">
							{a.fault_detected
								? 'Physical line or pole failure confirmed by LCA.'
								: 'No line fault — may be a device issue.'}
						</p>
					</div>
				</div>
			{/if}

			<!-- ── Fault Zone Map ──────────────────────────────────────────────── -->
			{#if analysisResult.map_data?.features?.length > 0}
				<div in:fly={{ y: 10, duration: 250 }}>
					<div class="mb-3 flex items-center justify-between">
						<div>
							<h2 class="text-base font-bold text-slate-900">
								Fault Zone Map
								<span
									class="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
								>
									{analysisResult.map_data.features.length} features
								</span>
							</h2>
							<p class="text-xs font-medium text-slate-500">
								Red nodes/lines = fault zone. Pulsing marker = LCA (root cause).
							</p>
						</div>
						<a
							href="/topology/{transformerId}"
							class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-600"
						>
							Full Topology <ChevronRight class="h-3.5 w-3.5" />
						</a>
					</div>
					<div
						class="h-[480px] w-full overflow-hidden rounded-2xl border border-red-100 shadow-2xl shadow-red-900/5"
					>
						<FaultMap
							mapData={analysisResult.map_data}
							faultNode={analysisResult.fault_analysis?.fault_node}
						/>
					</div>
				</div>
			{/if}

			<!-- ── Ongoing Faults for this Transformer ────────────────────────── -->
			{#if faults.length > 0}
				<div in:fly={{ y: 10, duration: 300 }}>
					<h2 class="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
						<Layers class="h-4 w-4 text-red-500" />
						Ongoing Faults
						<span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
							{faults.length}
						</span>
					</h2>

					<div class="space-y-3">
						{#each faults as fault (fault.fault_id)}
							<div
								class="flex items-center justify-between rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
								in:fly={{ y: 4, duration: 150 }}
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
									>
										<AlertTriangle class="h-5 w-5" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-bold text-slate-900">Fault #{fault.fault_id}</span>
											{#if fault.fault_group_id}
												<span
													class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
												>
													{fault.fault_group_id.slice(0, 18)}…
												</span>
											{/if}
										</div>
										<div class="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
											<span class="flex items-center gap-1 font-bold text-blue-600">
												<Zap class="h-3 w-3" />{fault.consumer_id}
											</span>
											{#if fault.consumer_name}
												<span>· {fault.consumer_name}</span>
											{/if}
										</div>
										{#if fault.address}
											<p class="mt-0.5 text-xs text-slate-400">{fault.address}</p>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<div class="flex items-center gap-1 text-xs font-bold text-red-600">
										<Clock class="h-3.5 w-3.5" />
										{duration(fault.fault_start_time)}
									</div>
									<p class="mt-0.5 text-[10px] text-slate-400">
										Since {new Date(fault.fault_start_time).toLocaleTimeString()}
									</p>
									{#if fault.phone_number}
										<a
											href="tel:{fault.phone_number}"
											class="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
										>
											<Users class="h-2.5 w-2.5" />
											{fault.phone_number}
										</a>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- ── No data / healthy ─────────────────────────────────────────────────── -->
	{:else}
		<div
			class="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 py-24 text-center"
		>
			<CheckCircle2 class="mb-4 h-12 w-12 text-emerald-400" />
			<p class="font-bold text-slate-700">No fault data returned</p>
			<p class="mt-1 text-sm text-slate-500">
				The analysis returned no results for this transformer.
			</p>
		</div>
	{/if}
</div>
