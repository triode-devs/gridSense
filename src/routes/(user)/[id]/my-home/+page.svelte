<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		MapPin,
		Activity,
		Loader,
		ChevronRight,
		ShieldCheck,
		RefreshCw,
		BarChart2,
		FileText,
		ZapOff,
		LifeBuoy,
		AlertCircle,
		CheckCircle2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);
	let connections = $state([]);
	let isLoading = $state(true);
	let statuses = $state({});

	async function fetchConnections() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers?userid=${id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				connections = data.data || [];
				connections.forEach((conn) => fetchStatus(conn.consumer_id));
			}
		} catch (e) {
			console.error('Failed to fetch connections');
		} finally {
			isLoading = false;
		}
	}

	async function fetchStatus(consumerId) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/status`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				statuses[consumerId] = data;
			}
		} catch (e) {
			console.error(`Failed to fetch status for ${consumerId}`);
		}
	}

	onMount(fetchConnections);

	// Derived stats
	const totalMeters = $derived(connections.length);
	const onlineMeters = $derived(
		connections.filter((c) => statuses[c.consumer_id]?.status === 'power_on').length
	);
	const offlineMeters = $derived(totalMeters - onlineMeters);
	const allStatused = $derived(
		Object.keys(statuses).length >= connections.length && connections.length > 0
	);
</script>

<svelte:head>
	<title>My Home | GridSense</title>
	<meta
		name="description"
		content="View and monitor your linked electricity meters, real-time power status, and grid health."
	/>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">My Home</h1>
			<p class="text-slate-500">Monitor your connected meters and live power health.</p>
		</div>
		<button
			onclick={fetchConnections}
			class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
		>
			<RefreshCw class="h-4 w-4" /> Refresh
		</button>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Checking your grid status...</p>
			</div>
		</div>
	{:else if connections.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-24 text-center backdrop-blur-md"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
			>
				<Zap class="h-8 w-8" />
			</div>
			<h2 class="text-xl font-bold text-slate-900">No meters linked</h2>
			<p class="mx-auto mt-2 max-w-sm text-slate-500">
				Your account has no linked smart meters yet. Please contact your local grid administrator.
			</p>
		</div>
	{:else}
		<!-- Stats Grid (matches admin dashboard card grid) -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<!-- Total Meters -->
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
				>
					<Zap class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{totalMeters}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Meters</span>
				</div>
				<p class="mt-2 text-xs font-medium text-slate-500">Linked smart meters</p>
			</div>

			<!-- Online Count -->
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
				>
					<CheckCircle2 class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{onlineMeters}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Online</span>
				</div>
				<p class="mt-2 text-xs font-medium text-emerald-600">Power supplied normally</p>
			</div>

			<!-- Outage Count -->
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-red-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${offlineMeters > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}
				>
					<AlertCircle class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{offlineMeters}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Outages</span>
				</div>
				<p
					class={`mt-2 text-xs font-medium ${offlineMeters > 0 ? 'text-red-600' : 'text-slate-500'}`}
				>
					{offlineMeters > 0 ? 'Requiring attention' : 'All connections healthy'}
				</p>
			</div>

			<!-- Grid Health -->
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
				>
					<Activity class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">
						{totalMeters > 0 ? Math.round((onlineMeters / totalMeters) * 100) : 0}%
					</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Health</span>
				</div>
				<p class="mt-2 text-xs font-medium text-slate-500">Overall grid uptime</p>
			</div>
		</div>

		<!-- Status Distribution + Meters -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Connection Status Distribution -->
			<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
					<ShieldCheck class="h-5 w-5 text-emerald-600" /> Connection Status
				</h3>
				<div class="space-y-4">
					<div class="group">
						<div
							class="mb-1 flex items-center justify-between text-xs font-bold tracking-wider uppercase"
						>
							<span class="text-slate-500">Online</span>
							<span class="text-slate-900">{onlineMeters} Meters</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								class="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000"
								style={`width: ${totalMeters > 0 ? (onlineMeters / totalMeters) * 100 : 0}%`}
							></div>
						</div>
					</div>
					<div class="group">
						<div
							class="mb-1 flex items-center justify-between text-xs font-bold tracking-wider uppercase"
						>
							<span class="text-slate-500">Outage</span>
							<span class="text-slate-900">{offlineMeters} Meters</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								class="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-1000"
								style={`width: ${totalMeters > 0 ? (offlineMeters / totalMeters) * 100 : 0}%`}
							></div>
						</div>
					</div>
				</div>

				<!-- Per-meter breakdown -->
				{#if allStatused}
					<div class="mt-6 grid grid-cols-2 gap-3">
						{#each connections as conn}
							{@const isOn = statuses[conn.consumer_id]?.status === 'power_on'}
							<div
								class="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md"
								in:fade
							>
								<p
									class="mb-1 truncate text-[10px] font-bold tracking-widest text-slate-400 uppercase"
								>
									{conn.consumer_name}
								</p>
								<span
									class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
								>
									<span
										class={`h-1.5 w-1.5 rounded-full ${isOn ? 'bg-emerald-500' : 'animate-ping bg-red-500'}`}
									></span>
									{isOn ? 'Online' : 'Outage'}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Meter Detail Cards -->
			<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
					<MapPin class="h-5 w-5 text-blue-600" /> Your Meter Connections
				</h3>
				<div class="max-h-72 space-y-4 overflow-y-auto pr-1">
					{#each connections as conn}
						{@const status = statuses[conn.consumer_id]}
						{@const isOn = status?.status === 'power_on'}
						<div
							class="group flex items-center justify-between rounded-2xl border border-slate-50 bg-white p-4 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
							in:fade
						>
							<div class="flex items-center gap-3">
								<div
									class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all group-hover:scale-105 ${isOn ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : status ? 'animate-pulse border-red-100 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
								>
									{#if isOn}
										<Zap class="h-5 w-5" fill="currentColor" />
									{:else}
										<ZapOff class="h-5 w-5" />
									{/if}
								</div>
								<div>
									<p class="text-sm font-bold text-slate-900">{conn.consumer_name}</p>
									<p class="flex items-center gap-1 text-xs text-slate-400">
										<MapPin class="h-3 w-3" />{conn.address}
									</p>
								</div>
							</div>
							<a
								href={`/${id}/my-home/${conn.consumer_id}`}
								class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 transition-all hover:bg-slate-900 hover:text-white"
							>
								<ChevronRight class="h-4 w-4" />
							</a>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Quick Actions (matches admin "Administrative Control" strip) -->
		<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
			<h3 class="mb-6 text-sm font-bold tracking-widest text-slate-400 uppercase">Quick Access</h3>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<a
					href={`/${id}/usage`}
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-emerald-100 hover:bg-emerald-50"
				>
					<div
						class="rounded-xl bg-emerald-100 p-2 text-emerald-600 transition-transform group-hover:scale-110"
					>
						<BarChart2 class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Energy Usage</span>
				</a>
				<a
					href={`/${id}/billing`}
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-blue-100 hover:bg-blue-50"
				>
					<div
						class="rounded-xl bg-blue-100 p-2 text-blue-600 transition-transform group-hover:scale-110"
					>
						<FileText class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">View Bills</span>
				</a>
				<a
					href={`/${id}/outages`}
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-red-100 hover:bg-red-50"
				>
					<div
						class="rounded-xl bg-red-100 p-2 text-red-600 transition-transform group-hover:scale-110"
					>
						<ZapOff class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Outages</span>
				</a>
				<a
					href={`/${id}/support`}
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-amber-100 hover:bg-amber-50"
				>
					<div
						class="rounded-xl bg-amber-100 p-2 text-amber-600 transition-transform group-hover:scale-110"
					>
						<LifeBuoy class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Support</span>
				</a>
			</div>
		</div>
	{/if}
</div>
