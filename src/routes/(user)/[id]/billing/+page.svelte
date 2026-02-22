<script>
	import {
		FileText,
		Download,
		CreditCard,
		CheckCircle2,
		Clock,
		AlertCircle,
		ChevronRight,
		Loader,
		ArrowRight,
		Zap,
		History,
		MapPin,
		RefreshCw,
		Receipt
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { API_BASE_URL } from '$lib/index.js';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);
	let billingData = $state(null);
	let usageSummary = $state(null);
	let connections = $state([]);
	let selectedConsumerId = $state('');
	let isLoading = $state(true);

	async function fetchUserData() {
		try {
			// 1. Fetch linked meters
			const connRes = await fetch(`${API_BASE_URL}/users/consumers?userid=${id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const connData = await connRes.json();
			if (connData.success && connData.data.length > 0) {
				connections = connData.data;
				selectedConsumerId = connections[0].consumer_id;
				await Promise.all([fetchBillingDetails(selectedConsumerId), fetchUsageSummary()]);
			}
		} catch (e) {
			console.error('Failed to fetch user data');
		} finally {
			isLoading = false;
		}
	}

	async function fetchBillingDetails(consumerId) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/billing/${consumerId}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				billingData = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch billing details');
		}
	}

	async function fetchUsageSummary() {
		try {
			const res = await fetch(`${API_BASE_URL}/users/usage/summary?userid=${id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				usageSummary = data.totals;
			}
		} catch (e) {
			console.error('Failed to fetch usage summary');
		}
	}

	$effect(() => {
		if (selectedConsumerId) {
			fetchBillingDetails(selectedConsumerId);
		}
	});

	onMount(fetchUserData);
</script>

<svelte:head>
	<title>Billing & Payments | GridSense</title>
	<meta
		name="description"
		content="View your current electricity bill, payment history, and manage saved payment methods."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Billing & Payments</h1>
			<p class="text-slate-500">Manage your invoices and view payment history.</p>
		</div>

		<div class="flex items-center gap-2">
			{#if connections.length > 1}
				<div
					class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
				>
					<MapPin class="h-3.5 w-3.5 text-emerald-500" />
					<select
						bind:value={selectedConsumerId}
						class="bg-transparent text-sm font-bold text-slate-700 outline-none"
					>
						{#each connections as conn}
							<option value={conn.consumer_id}>{conn.consumer_name}</option>
						{/each}
					</select>
				</div>
			{/if}
			<button
				onclick={fetchUserData}
				class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
			>
				<RefreshCw class="h-4 w-4" /> Refresh
			</button>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<Loader class="h-10 w-10 animate-spin text-emerald-600" />
		</div>
	{:else if billingData}
		<!-- Active Bill Card -->
		<div class="group relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl">
			<div
				class="absolute inset-0 bg-linear-to-br from-blue-600/30 via-transparent to-transparent"
			></div>
			<div
				class="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
			></div>

			<div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
				<div class="space-y-4">
					<div
						class="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/20 px-4 py-1.5 text-xs font-bold text-blue-400"
					>
						<Clock class="h-3.5 w-3.5" /> Current Billing Period
					</div>
					<div>
						<p class="text-sm font-medium text-slate-400">
							Estimated Bill for {new Date().toLocaleString('default', {
								month: 'long',
								year: 'numeric'
							})}
						</p>
						<h2 class="mt-1 text-5xl font-bold text-white">
							₹{billingData.estimated_bill || '0.00'}
						</h2>
					</div>
					<div class="flex items-center gap-6">
						<div class="flex items-center gap-2 text-slate-300">
							<Zap class="h-4 w-4 text-emerald-400" />
							<span class="text-sm font-bold"
								>{billingData.consumer.current_month_usage || 0} kWh used</span
							>
						</div>
						<div class="h-4 w-px bg-slate-800"></div>
						<p class="text-sm font-medium text-slate-400 italic">Bill generated automatically</p>
					</div>
				</div>

				<button
					class="group flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-5 font-bold text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95"
				>
					<CreditCard class="h-5 w-5" /> Pay Now <ArrowRight
						class="h-5 w-5 transition-transform group-hover:translate-x-1"
					/>
				</button>
			</div>
		</div>

		<!-- History Table -->
		<div class="space-y-6">
			<div class="flex items-center justify-between px-2">
				<h3 class="flex items-center gap-2 text-xl font-bold text-slate-900">
					<History class="h-5 w-5 text-slate-400" /> Payment History
				</h3>
				<button class="text-sm font-bold text-blue-600 hover:underline">View All</button>
			</div>

			<div class="grid gap-4">
				{#if billingData.billing_history && billingData.billing_history.length > 0}
					{#each billingData.billing_history as bill}
						<div
							class="group flex flex-col gap-4 rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="flex items-center gap-4">
								<div
									class={`flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600`}
								>
									<FileText class="h-6 w-6" />
								</div>
								<div>
									<h4 class="font-bold text-slate-900">
										{new Date(bill.year, bill.month - 1).toLocaleString('default', {
											month: 'long',
											year: 'numeric'
										})}
									</h4>
									<p class="font-mono text-xs tracking-tighter text-slate-400 uppercase">
										INV-{bill.year}{bill.month} • Consumption: {bill.monthly_usage} kWh
									</p>
								</div>
							</div>

							<div class="flex items-center justify-between gap-8 pl-16 sm:pl-0">
								<div class="text-right">
									<p class="text-lg font-bold text-slate-900">
										₹{bill.bill_amount?.toFixed(2) || '0.00'}
									</p>
									<div class="flex items-center justify-end gap-1">
										<CheckCircle2 class="h-3 w-3 text-emerald-500" />
										<span class="text-[10px] font-bold tracking-widest text-emerald-600 uppercase"
											>PAID</span
										>
									</div>
								</div>
								<button
									class="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
								>
									<Download class="h-5 w-5" />
								</button>
							</div>
						</div>
					{/each}
				{:else}
					<div
						class="rounded-3xl border border-dashed border-slate-200 py-12 text-center text-slate-400"
					>
						No billing history found for this meter.
					</div>
				{/if}
			</div>
		</div>

		<!-- Billing Information -->
		<div class="grid gap-6 md:grid-cols-2">
			<div class="rounded-3xl border border-white bg-slate-50 p-6">
				<h4 class="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Saved Payment Methods
				</h4>
				<div
					class="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
				>
					<div
						class="flex h-10 w-12 items-center justify-center rounded-lg bg-slate-950 font-bold text-white italic"
					>
						VISA
					</div>
					<div class="flex-1">
						<p class="text-sm font-bold text-slate-800">•••• 4421</p>
						<p class="text-[10px] font-medium text-slate-500">Expires 12/28</p>
					</div>
					<button class="text-slate-400 hover:text-red-500"><AlertCircle class="h-4 w-4" /></button>
				</div>
				<button
					class="mt-4 w-full rounded-2xl border border-dashed border-slate-300 py-4 text-xs font-bold text-slate-500 transition-all hover:border-slate-400 hover:bg-white"
				>
					+ Add New Method
				</button>
			</div>

			<div class="flex flex-col justify-between rounded-3xl border border-white bg-slate-50 p-6">
				<h4 class="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Billing Address
				</h4>
				<div class="p-2">
					<p class="text-sm font-bold text-slate-800">John Doe</p>
					<p class="text-sm leading-relaxed font-medium text-slate-600">
						12/4 Main Street, Sector 4 North,<br />
						Coimbatore, Tamil Nadu 641001
					</p>
				</div>
				<button class="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
					Edit Billing Details <ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
</div>
