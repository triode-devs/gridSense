<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		Activity,
		AlertCircle,
		Users,
		LayoutDashboard,
		Loader,
		ArrowUp,
		ArrowDown,
		Settings,
		FileText,
		Database,
		ShieldCheck
	} from 'lucide-svelte';

	let stats = $state(null);
	let isLoading = $state(true);

	async function fetchStats() {
		try {
			const res = await fetch(`${API_BASE_URL}/statistics/overview`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				stats = data.data.system_overview;
			}
		} catch (e) {
			console.error('Failed to fetch statistics');
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchStats);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">System Dashboard</h1>
			<p class="text-slate-500">Real-time grid health and system metrics overview.</p>
		</div>
		<button
			onclick={fetchStats}
			class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
		>
			<Activity class="h-4 w-4" /> Refresh Data
		</button>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-blue-600" />
				<p class="animate-pulse font-medium text-slate-500">Synchronizing with grid...</p>
			</div>
		</div>
	{:else if stats}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
				>
					<Zap class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{stats.total_transformers}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Substations</span>
				</div>
				<p class="mt-2 text-xs font-medium text-slate-500">Active distribution units</p>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
				>
					<Users class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{stats.total_consumers}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Consumers</span>
				</div>
				<p class="mt-2 text-xs font-medium text-slate-500">Connected smart meters</p>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-red-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"
				>
					<AlertCircle class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">{stats.fault_summary.ongoing_faults}</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Live Faults</span>
				</div>
				<p class="mt-2 text-xs font-medium text-red-600">Requiring immediate attention</p>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<div
					class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-150"
				></div>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
				>
					<ShieldCheck class="h-6 w-6" />
				</div>
				<div class="flex items-baseline gap-1">
					<h3 class="text-3xl font-bold text-slate-900">
						{stats.fault_summary.recent_faults_30_days}
					</h3>
					<span class="text-xs font-bold text-slate-400 uppercase">Resolved</span>
				</div>
				<p class="mt-2 text-xs font-medium text-slate-500">Fixed in last 30 days</p>
			</div>
		</div>

		<!-- Charts & Detailed Tables -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Transformer Status -->
			<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
					<Database class="h-5 w-5 text-blue-600" /> Transformer Status Distribution
				</h3>
				<div class="space-y-4">
					{#each Object.entries(stats.transformers_by_status) as [status, count]}
						<div class="group">
							<div
								class="mb-1 flex items-center justify-between text-xs font-bold tracking-wider uppercase"
							>
								<span class="text-slate-500">{status}</span>
								<span class="text-slate-900">{count} Units</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
								<div
									class={`h-full transition-all duration-1000 ${status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}
									style={`width: ${(count / stats.total_transformers) * 100}%`}
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Consumer Segments -->
			<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
					<Users class="h-5 w-5 text-emerald-600" /> Consumer Segmentation
				</h3>
				<div class="grid grid-cols-2 gap-4">
					{#each Object.entries(stats.consumers_by_type) as [type, count]}
						<div
							class="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md"
						>
							<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
								{type}
							</p>
							<p class="text-2xl font-bold text-slate-900">{count}</p>
							<p class="mt-1 text-[10px] font-medium text-slate-500">
								{((count / stats.total_consumers) * 100).toFixed(1)}% of total
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
			<h3 class="mb-6 text-sm font-bold tracking-widest text-slate-400 uppercase">
				Administrative Control
			</h3>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<a
					href="/faults"
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-red-100 hover:bg-red-50"
				>
					<div
						class="rounded-xl bg-red-100 p-2 text-red-600 transition-transform group-hover:scale-110"
					>
						<AlertCircle class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Active Faults</span>
				</a>
				<a
					href="/staff"
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-blue-100 hover:bg-blue-50"
				>
					<div
						class="rounded-xl bg-blue-100 p-2 text-blue-600 transition-transform group-hover:scale-110"
					>
						<Settings class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Staff Portal</span>
				</a>
				<a
					href="/system"
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-emerald-100 hover:bg-emerald-50"
				>
					<div
						class="rounded-xl bg-emerald-100 p-2 text-emerald-600 transition-transform group-hover:scale-110"
					>
						<FileText class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Generate Audit</span>
				</a>
				<a
					href="/topology"
					class="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-50 py-6 transition-all hover:border-indigo-100 hover:bg-indigo-50"
				>
					<div
						class="rounded-xl bg-indigo-100 p-2 text-indigo-600 transition-transform group-hover:scale-110"
					>
						<Activity class="h-5 w-5" />
					</div>
					<span class="text-xs font-bold text-slate-600">Grid Topology</span>
				</a>
			</div>
		</div>
	{/if}
</div>
