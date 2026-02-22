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
		TrendingUp,
		MapPin,
		Loader
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	// The outer [id] is the userid; [consumer_id] is the specific meter
	let userid = $derived($page.params.id);
	let consumerId = $derived($page.params.consumer_id);
	let consumer = $state(null);
	let status = $state(null);
	let billingData = $state(null);
	let isLoading = $state(true);

	async function fetchData() {
		isLoading = true;
		try {
			const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

			// 1. Fetch linked consumers for this user and find the matching one
			const consRes = await fetch(`${API_BASE_URL}/users/consumers?userid=${userid}`, { headers });
			const consData = await consRes.json();
			if (consData.success) {
				consumer = consData.data.find((c) => c.consumer_id === consumerId) || null;
			}

			// 2. Fetch real-time status
			const statusRes = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/status`, {
				headers
			});
			const statusData = await statusRes.json();
			if (statusData.success) {
				status = statusData;
			}

			// 3. Fetch billing + usage history
			const billingRes = await fetch(`${API_BASE_URL}/users/billing/${consumerId}`, { headers });
			const billingJson = await billingRes.json();
			if (billingJson.success) {
				billingData = billingJson.data;
			}
		} catch (e) {
			console.error('Failed to fetch connection details', e);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchData);
</script>

<svelte:head>
	<title
		>{consumer ? `${consumer.consumer_name} | GridSense` : 'Connection Details | GridSense'}</title
	>
	<meta
		name="description"
		content="Detailed view of your grid connection — live power status, energy usage history, and current billing estimate."
	/>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href={`/${userid}/my-home`}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-3xl font-bold text-slate-900">
				{consumer?.consumer_name || 'Connection Details'}
			</h1>
			<p class="font-mono text-sm font-medium text-slate-500">{consumerId}</p>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Loading connection details...</p>
			</div>
		</div>
	{:else if consumer}
		<!-- Info Cards -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Live Status Card -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class={`flex h-12 w-12 items-center justify-center rounded-2xl ${status?.status === 'power_on' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
					>
						<Activity class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Live Status</h3>
						<p class="text-xs text-slate-500">Real-time connection health</p>
					</div>
				</div>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Power State</span>
						<span
							class={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${status?.status === 'power_on' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
						>
							{status?.status === 'power_on' ? 'Active' : 'Outage'}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Transformer</span>
						<span class="text-sm font-bold text-slate-900"
							>{status?.details?.transformer_status ?? '—'}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Last Update</span>
						<span class="text-sm font-bold text-slate-900"
							>{status?.details?.last_update
								? new Date(status.details.last_update).toLocaleTimeString()
								: '—'}</span
						>
					</div>
				</div>
			</div>

			<!-- Consumption Card -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
					>
						<Zap class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">This Month</h3>
						<p class="text-xs text-slate-500">Energy consumption</p>
					</div>
				</div>
				{#if billingData}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-slate-500">Used</span>
							<span class="text-xl font-bold text-slate-900"
								>{billingData.consumer?.current_month_usage ?? 0} kWh</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-slate-500">Est. Bill</span>
							<span class="text-xl font-bold text-emerald-600"
								>₹{billingData.estimated_bill ?? '0.00'}</span
							>
						</div>
						<div class="flex items-center gap-2 text-xs font-bold text-slate-400">
							<TrendingUp class="h-3.5 w-3.5" />
							Based on active tariff slabs
						</div>
					</div>
				{:else}
					<p class="text-sm text-slate-400">No usage data available.</p>
				{/if}
			</div>

			<!-- Billing Card -->
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<div class="mb-6 flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
					>
						<FileText class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Tariff & Type</h3>
						<p class="text-xs text-slate-500">Current billing plan</p>
					</div>
				</div>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Type</span>
						<span
							class="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700 capitalize"
							>{consumer.connection_type ?? 'Residential'}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Transformer</span>
						<span class="text-sm font-bold text-slate-900">{consumer.transformer_id ?? '—'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500">Cycle</span>
						<span class="text-sm font-bold text-slate-900">Monthly</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Location -->
		<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
			<h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
				<MapPin class="h-5 w-5 text-slate-400" /> Location Details
			</h3>
			<p class="text-slate-600">{consumer.address}</p>
			{#if consumer.latitude && consumer.longitude}
				<div class="mt-3 flex gap-6 font-mono text-sm text-slate-500">
					<span>Lat: {consumer.latitude}</span>
					<span>Lng: {consumer.longitude}</span>
				</div>
			{/if}
		</div>

		<!-- Billing History -->
		{#if billingData?.billing_history?.length > 0}
			<div class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md">
				<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
					<FileText class="h-5 w-5 text-slate-400" /> Billing History
				</h3>
				<div class="space-y-3">
					{#each billingData.billing_history as bill}
						<div
							class="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 transition-colors hover:bg-white"
						>
							<div>
								<p class="font-bold text-slate-900">
									{new Date(bill.year, bill.month - 1).toLocaleString('default', {
										month: 'long',
										year: 'numeric'
									})}
								</p>
								<p class="text-xs text-slate-500">{bill.monthly_usage} kWh consumed</p>
							</div>
							<div class="text-right">
								<p class="font-bold text-slate-900">₹{bill.bill_amount?.toFixed(2) ?? '0.00'}</p>
								<p class="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Paid</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Outage Alert -->
		{#if status && status.status !== 'power_on'}
			<div class="rounded-3xl border border-red-100 bg-red-50 p-6" in:fade>
				<div class="mb-4 flex items-center gap-3 text-red-700">
					<AlertTriangle class="h-6 w-6" />
					<h3 class="text-lg font-bold">Active Outage Detected</h3>
				</div>
				<p class="mb-4 text-sm font-medium text-red-600">
					This connection is currently experiencing a power outage. Our team has been notified and
					is working to resolve it.
				</p>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded-2xl bg-white/50 p-4">
						<p class="mb-1 text-xs font-bold text-red-800 uppercase">Diagnosis</p>
						<p class="font-medium text-red-700">Transformer overload or line fault detected.</p>
					</div>
					<div class="rounded-2xl bg-white/50 p-4">
						<p class="mb-1 text-xs font-bold text-red-800 uppercase">Action</p>
						<p class="font-medium text-red-700">Field team dispatched. Est. resolution: 2 hours.</p>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="py-12 text-center">
			<p class="text-slate-500">Consumer connection not found.</p>
		</div>
	{/if}
</div>
