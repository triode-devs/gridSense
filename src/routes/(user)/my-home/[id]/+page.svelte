<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/index.js';
	import {
		ArrowLeft,
		Zap,
		Activity,
		AlertTriangle,
		FileText,
		Calendar,
		TrendingUp,
		ShieldCheck,
		MapPin,
		Loader
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let consumerId = $state($page.params.id);
	let consumer = $state(null);
	let status = $state(null);
	let usageData = $state(null);
	let isLoading = $state(true);

	// Mock Tariff Data (since no endpoint found)
	const tariff = {
		plan: 'Residential Standard',
		rate: 5.5,
		currency: '₹',
		billing_cycle: 'Monthly'
	};

	async function fetchData() {
		isLoading = true;
		try {
			const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

			// Fetch Consumer Details (from list filtering or specific endpoint if exists)
			// Since we don't know if specific endpoint exists, we'll fetch all and filter
			// This is inefficient but safe given current knowledge
			const consRes = await fetch(`${API_BASE_URL}/users/consumers`, { headers });
			const consData = await consRes.json();
			if (consData.success) {
				consumer = consData.data.find((c) => c.consumer_id === consumerId);
			}

			// Fetch Status
			const statusRes = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/status`, {
				headers
			});
			const statusData = await statusRes.json();
			if (statusData.success) {
				status = statusData;
			}

			// Fetch Usage
			const usageRes = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/usage`, {
				headers
			});
			const usageDataRes = await usageRes.json();
			if (usageDataRes.success) {
				usageData = usageDataRes.data;
			}
		} catch (e) {
			console.error('Failed to fetch details');
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchData);
</script>

<div class="space-y-8">
	<div class="flex items-center gap-4">
		<a
			href="/my-home"
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-3xl font-bold text-slate-900">
				{consumer?.consumer_name || 'Consumer Details'}
			</h1>
			<p class="font-medium text-slate-500">{consumerId}</p>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Loading consumer details...</p>
			</div>
		</div>
	{:else if consumer}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Status Card -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class={`flex h-12 w-12 items-center justify-center rounded-2xl ${status?.status === 'power_on' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
					>
						<Activity class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Grid Status</h3>
						<p class="text-xs text-slate-500">Real-time connection health</p>
					</div>
				</div>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">State</span>
						<span
							class={`rounded-full px-2 py-1 text-xs font-bold uppercase ${status?.status === 'power_on' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
						>
							{status?.status === 'power_on' ? 'Active' : 'Outage'}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Transformer</span>
						<span class="text-sm font-bold text-slate-900"
							>{status?.details.transformer_status}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Last Update</span>
						<span class="text-sm font-bold text-slate-900"
							>{new Date(status?.details.last_update).toLocaleString()}</span
						>
					</div>
				</div>
			</div>

			<!-- Tariff Card -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
					>
						<FileText class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Tariff Plan</h3>
						<p class="text-xs text-slate-500">Current billing details</p>
					</div>
				</div>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Plan Name</span>
						<span class="text-sm font-bold text-slate-900">{tariff.plan}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Rate per kWh</span>
						<span class="text-sm font-bold text-slate-900"
							>{tariff.currency}{tariff.rate.toFixed(2)}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Billing Cycle</span>
						<span class="text-sm font-bold text-slate-900">{tariff.billing_cycle}</span>
					</div>
				</div>
			</div>

			<!-- Usage Summary -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
					>
						<Zap class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Usage Summary</h3>
						<p class="text-xs text-slate-500">This month's consumption</p>
					</div>
				</div>
				{#if usageData}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-slate-500">Consumed</span>
							<span class="text-lg font-bold text-slate-900"
								>{usageData.current_usage.current_month_kwh} kWh</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-slate-500">Est. Cost</span>
							<span class="text-lg font-bold text-emerald-600"
								>₹{(usageData.current_usage.current_month_kwh * tariff.rate).toFixed(2)}</span
							>
						</div>
					</div>
				{:else}
					<p class="text-sm text-slate-400">No usage data availble.</p>
				{/if}
			</div>
		</div>

		<!-- Address & Location -->
		<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
			<h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
				<MapPin class="h-5 w-5 text-slate-400" /> Location Details
			</h3>
			<p class="text-slate-600">{consumer.address}</p>
			<div class="mt-4 flex gap-4 text-sm text-slate-500">
				<span>Lat: {consumer.latitude}</span>
				<span>Lng: {consumer.longitude}</span>
			</div>
		</div>

		<!-- Faults / Outages Section -->
		{#if status?.status !== 'power_on'}
			<div class="rounded-3xl border border-red-100 bg-red-50 p-6" in:fade>
				<div class="mb-4 flex items-center gap-3 text-red-700">
					<AlertTriangle class="h-6 w-6" />
					<h3 class="text-lg font-bold">Active Fault Detected</h3>
				</div>
				<p class="mb-4 text-sm font-medium text-red-600">
					This connection is currently experiencing an outage.
				</p>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded-2xl bg-white/50 p-4">
						<p class="mb-1 text-xs font-bold text-red-800 uppercase">Diagnosis</p>
						<p class="font-medium text-red-700">Transformer overload or line break suspected.</p>
					</div>
					<div class="rounded-2xl bg-white/50 p-4">
						<p class="mb-1 text-xs font-bold text-red-800 uppercase">Action</p>
						<p class="font-medium text-red-700">Team dispatched. Est. resolution: 2 hours.</p>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="py-12 text-center">
			<p class="text-slate-500">Consumer not found.</p>
		</div>
	{/if}
</div>
