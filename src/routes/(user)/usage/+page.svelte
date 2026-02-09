<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		BarChart3,
		TrendingUp,
		Calendar,
		Loader,
		ArrowLeft,
		Zap,
		Info,
		Download,
		History
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';

	let usageData = $state(null);
	let isLoading = $state(true);
	let consumerId = $state($page.url.searchParams.get('id') || '');
	let connections = $state([]);

	async function fetchConnections() {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success && data.data.length > 0) {
				connections = data.data;
				if (!consumerId) consumerId = connections[0].consumer_id;
				fetchUsage();
			}
		} catch (e) {
			console.error('Failed to fetch connections');
		}
	}

	async function fetchUsage() {
		if (!consumerId) return;
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/usage`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				usageData = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch usage data');
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchConnections);

	$effect(() => {
		if (consumerId) fetchUsage();
	});
</script>

<div class="space-y-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<a
				href="/my-home"
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
			>
				<ArrowLeft class="h-5 w-5" />
			</a>
			<div>
				<h1 class="text-3xl font-bold text-slate-900">Energy Analytics</h1>
				<p class="font-medium text-slate-500">Detailed breakdown of your power consumption.</p>
			</div>
		</div>
		<select
			bind:value={consumerId}
			class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
		>
			{#each connections as conn}
				<option value={conn.consumer_id}>{conn.consumer_name} ({conn.consumer_id})</option>
			{/each}
		</select>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Analyzing consumption patterns...</p>
			</div>
		</div>
	{:else if usageData}
		<!-- Main Stats -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
				>
					<Zap class="h-6 w-6" />
				</div>
				<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Current Month
				</p>
				<h3 class="text-3xl font-bold text-slate-900">
					{usageData.current_usage.current_month_kwh}
				</h3>
				<span class="text-xs font-bold text-slate-500">Total kWh</span>
				<div class="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
					<TrendingUp class="h-3 w-3" /> Billing Cycle: {usageData.current_usage.billing_month}
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
				>
					<History class="h-6 w-6" />
				</div>
				<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Lifetime Total
				</p>
				<h3 class="text-3xl font-bold text-slate-900">
					{usageData.current_usage.total_lifetime_kwh}
				</h3>
				<span class="text-xs font-bold text-slate-500">Cumulative kWh</span>
				<p class="mt-4 text-xs font-medium text-slate-500">Since installation</p>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
				>
					<Info class="h-6 w-6" />
				</div>
				<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Projected Bill
				</p>
				<h3 class="text-3xl font-bold text-slate-900">
					₹{(usageData.current_usage.current_month_kwh * 5.5).toFixed(2)}
				</h3>
				<span class="text-xs font-bold text-slate-500">Estimated cost</span>
				<p class="mt-4 text-xs font-medium text-slate-500">Based on active tariff</p>
			</div>
		</div>

		<!-- Monthly History -->
		<div class="rounded-3xl border border-white bg-white/60 p-8 shadow-sm backdrop-blur-md">
			<div class="mb-8 flex items-center justify-between">
				<h3 class="flex items-center gap-2 text-xl font-bold text-slate-900">
					<Calendar class="h-6 w-6 text-emerald-600" /> Historical Consumption
				</h3>
				<button
					class="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
				>
					<Download class="h-4 w-4" /> Export CSV
				</button>
			</div>

			<div class="space-y-4">
				{#each usageData.monthly_history as history}
					<div
						class="group flex items-center justify-between rounded-2xl border border-slate-50 bg-white p-5 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
							>
								<BarChart3 class="h-6 w-6" />
							</div>
							<div>
								<h4 class="font-bold text-slate-900">
									{new Date(history.year, history.month - 1).toLocaleString('default', {
										month: 'long',
										year: 'numeric'
									})}
								</h4>
								<p class="text-xs font-medium text-slate-500">Standard Consumption Period</p>
							</div>
						</div>
						<div class="text-right">
							<p class="text-xl font-bold text-slate-900">{history.monthly_kwh} kWh</p>
							<p class="text-xs font-bold text-emerald-600">Valid</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
