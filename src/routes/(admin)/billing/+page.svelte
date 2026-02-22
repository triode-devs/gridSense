<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Search,
		CreditCard,
		Calendar,
		TrendingUp,
		TrendingDown,
		Zap,
		Filter,
		ChevronRight,
		Loader,
		ArrowUpRight,
		Download,
		Printer,
		FileText
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let billingData = $state([]);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let sorting = $state({ field: 'estimated_bill', direction: 'desc' });

	// Modal for detailed billing
	let showDetailModal = $state(false);
	let selectedConsumer = $state(null);
	let detailedBilling = $state(null);
	let isDetailLoading = $state(false);

	async function fetchGlobalBilling() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/users/billing/current`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				billingData = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch global billing');
		} finally {
			isLoading = false;
		}
	}

	async function fetchDetailedBilling(consumerId) {
		isDetailLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/users/billing/${consumerId}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				detailedBilling = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch detailed billing');
		} finally {
			isDetailLoading = false;
		}
	}

	const filteredBilling = $derived(
		billingData
			.filter(
				(item) =>
					item.consumer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					item.consumer_id.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.sort((a, b) => {
				const valA = a[sorting.field];
				const valB = b[sorting.field];
				if (sorting.direction === 'asc') return valA > valB ? 1 : -1;
				return valA < valB ? 1 : -1;
			})
	);

	function toggleSort(field) {
		if (sorting.field === field) {
			sorting.direction = sorting.direction === 'asc' ? 'desc' : 'asc';
		} else {
			sorting.field = field;
			sorting.direction = 'desc';
		}
	}

	onMount(fetchGlobalBilling);

	const stats = $derived.by(() => {
		if (billingData.length === 0) return { total: 0, avg: 0, high_usage: 0 };
		const total = billingData.reduce((acc, curr) => acc + curr.estimated_bill, 0);
		const high_usage = billingData.filter((d) => d.current_month_kwh > 500).length;
		return {
			total: total.toFixed(2),
			avg: (total / billingData.length).toFixed(2),
			high_usage
		};
	});
</script>

<svelte:head>
	<title>Billing Overview | GridSense Admin</title>
	<meta
		name="description"
		content="Global billing dashboard to track current month revenue, estimated bills, and consumer usage slabs."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Billing & Revenue</h1>
			<p class="text-slate-500">
				Live estimated bills for the current billing cycle ({new Date().toLocaleString('default', {
					month: 'long',
					year: 'numeric'
				})}).
			</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
			>
				<Download class="h-4 w-4" /> Export
			</button>
			<button
				class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700"
			>
				<Printer class="h-4 w-4" /> Reports
			</button>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md">
			<div class="flex items-center justify-between">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
				>
					<CreditCard class="h-5 w-5" />
				</div>
				<span class="flex items-center gap-1 text-xs font-bold text-emerald-600">
					<TrendingUp class="h-3 w-3" /> +12%
				</span>
			</div>
			<div class="mt-4">
				<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					Estimated Revenue
				</p>
				<p class="text-3xl font-black text-slate-900">₹{stats.total}</p>
			</div>
		</div>

		<div class="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md">
			<div class="flex items-center justify-between">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
				>
					<Zap class="h-5 w-5" />
				</div>
				<span class="flex items-center gap-1 text-xs font-bold text-blue-600"> Current Cycle </span>
			</div>
			<div class="mt-4">
				<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Average Bill</p>
				<p class="text-3xl font-black text-slate-900">₹{stats.avg}</p>
			</div>
		</div>

		<div class="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md">
			<div class="flex items-center justify-between">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"
				>
					<TrendingUp class="h-5 w-5" />
				</div>
				<span class="flex items-center gap-1 text-xs font-bold text-amber-600"> Watchlist </span>
			</div>
			<div class="mt-4">
				<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
					High Usage (500+ kWh)
				</p>
				<p class="text-3xl font-black text-slate-900">{stats.high_usage}</p>
			</div>
		</div>
	</div>

	<!-- Controls -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center">
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search consumer name or ID..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl border border-white/60 bg-white/40 pr-4 pl-12 text-sm font-medium shadow-sm backdrop-blur-md outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
		<button
			onclick={fetchGlobalBilling}
			class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
		>
			{#if isLoading}
				<Loader class="h-4 w-4 animate-spin" />
			{:else}
				<Calendar class="h-4 w-4" />
			{/if}
			Refresh Data
		</button>
	</div>

	<!-- Billing Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-slate-50 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
					<tr>
						<th class="px-6 py-4">
							<button
								onclick={() => toggleSort('consumer_name')}
								class="flex items-center gap-1 hover:text-blue-600"
							>
								Consumer Details
							</button>
						</th>
						<th class="px-6 py-4">
							<button
								onclick={() => toggleSort('current_month_kwh')}
								class="flex items-center gap-1 hover:text-blue-600"
							>
								Usage (kWh)
							</button>
						</th>
						<th class="px-6 py-4">
							<button
								onclick={() => toggleSort('estimated_bill')}
								class="flex items-center gap-1 hover:text-blue-600"
							>
								Estimated Bill
							</button>
						</th>
						<th class="px-6 py-4">Period</th>
						<th class="px-6 py-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if isLoading && billingData.length === 0}
						<tr>
							<td colspan="5" class="py-20 text-center">
								<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
								<p class="mt-2 text-xs font-bold text-slate-400">Calculating estimated bills...</p>
							</td>
						</tr>
					{:else if filteredBilling.length === 0}
						<tr>
							<td colspan="5" class="py-20 text-center font-medium text-slate-500">
								No billing records found.
							</td>
						</tr>
					{:else}
						{#each filteredBilling as item (item.consumer_id)}
							<tr class="group transition-colors hover:bg-blue-50/30">
								<td class="px-6 py-4">
									<div>
										<p class="font-bold text-slate-900 group-hover:text-blue-600">
											{item.consumer_name}
										</p>
										<p class="font-mono text-[9px] tracking-tighter text-slate-400 uppercase">
											{item.consumer_id}
										</p>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold text-slate-700"
											>{item.current_month_kwh} units</span
										>
										{#if item.current_month_kwh > 500}
											<span
												class="rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-black text-red-600 uppercase"
												>High</span
											>
										{:else if item.current_month_kwh < 100}
											<span
												class="rounded bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-600 uppercase"
												>Free Slab</span
											>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4">
									<p class="text-sm font-black text-slate-900">₹{item.estimated_bill.toFixed(2)}</p>
								</td>
								<td class="px-6 py-4">
									<span class="text-xs font-bold text-slate-500">{item.billing_month}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<button
										onclick={() => {
											selectedConsumer = item;
											showDetailModal = true;
											fetchDetailedBilling(item.consumer_id);
										}}
										class="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
									>
										<ChevronRight class="h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Detailed Billing Modal -->
{#if showDetailModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
		in:fade
	>
		<div
			class="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
			in:scale={{ start: 0.95 }}
		>
			<!-- Modal Header -->
			<div class="relative bg-slate-900 px-8 py-10 text-white">
				<button
					onclick={() => {
						showDetailModal = false;
						detailedBilling = null;
					}}
					class="absolute top-6 right-6 text-slate-400 hover:text-white"
				>
					<Download class="h-6 w-6 rotate-180" />
				</button>

				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 backdrop-blur-md"
					>
						<FileText class="h-6 w-6" />
					</div>
					<div>
						<h3 class="text-xl font-black">{selectedConsumer?.consumer_name}</h3>
						<p class="flex items-center gap-2 text-xs font-bold text-slate-400">
							CONSUMER ID: <span class="text-white">{selectedConsumer?.consumer_id}</span>
						</p>
					</div>
				</div>

				<div class="mt-10 grid grid-cols-2 gap-8">
					<div>
						<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Current Month Usage
						</p>
						<p class="text-3xl font-black">
							{selectedConsumer?.current_month_kwh} kW<span class="text-lg text-blue-400">h</span>
						</p>
					</div>
					<div>
						<p class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Live Bill Estimate
						</p>
						<p class="text-3xl font-black text-emerald-400">
							₹{selectedConsumer?.estimated_bill?.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="p-8">
				{#if isDetailLoading}
					<div class="flex h-40 items-center justify-center">
						<Loader class="h-8 w-8 animate-spin text-blue-500" />
					</div>
				{:else if detailedBilling}
					<div class="space-y-6">
						<!-- Tariff Application -->
						<section>
							<h4 class="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
								Tariff Slabs Applied
							</h4>
							<div class="space-y-2">
								{#each detailedBilling.applicable_tariffs as tariff}
									<div
										class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
									>
										<div>
											<p class="text-sm font-bold text-slate-900">
												{tariff.category} ({tariff.unit_range_start}-{tariff.unit_range_end ?? '∞'} units)
											</p>
											<p class="text-[10px] font-medium text-slate-500">
												Base Pay: ₹{tariff.base_pay} | Rate: ₹{tariff.rate_per_unit}/unit
											</p>
										</div>
										<ArrowUpRight class="h-4 w-4 text-slate-300" />
									</div>
								{/each}
							</div>
						</section>

						<!-- History -->
						<section>
							<h4 class="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
								Consumption History
							</h4>
							<div class="overflow-hidden rounded-2xl border border-slate-100">
								<table class="w-full text-left text-xs">
									<thead class="bg-slate-50 font-bold text-slate-500">
										<tr>
											<th class="px-4 py-3">Month</th>
											<th class="px-4 py-3 text-right">Units (kWh)</th>
											<th class="px-4 py-3 text-right">Trend</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-50">
										{#each detailedBilling.billing_history as history}
											<tr class="hover:bg-slate-50">
												<td class="px-4 py-3 font-bold"
													>{history.year}-{history.month.toString().padStart(2, '0')}</td
												>
												<td class="px-4 py-3 text-right font-mono font-bold text-slate-700"
													>{history.monthly_kwh}</td
												>
												<td class="px-4 py-3 text-right">
													{#if history.monthly_kwh > 200}
														<TrendingUp class="ml-auto h-3 w-3 text-amber-500" />
													{:else}
														<TrendingDown class="ml-auto h-3 w-3 text-emerald-500" />
													{/if}
												</td>
											</tr>
										{:else}
											<tr>
												<td colspan="3" class="px-4 py-10 text-center text-slate-400"
													>No previous history available.</td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</section>
					</div>
				{:else}
					<div class="flex h-40 flex-col items-center justify-center text-center">
						<TrendingDown class="mb-2 h-8 w-8 text-slate-200" />
						<p class="text-sm font-medium text-slate-400">
							Unable to load detailed billing metrics.
						</p>
					</div>
				{/if}

				<div class="mt-8 flex gap-3">
					<button
						class="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-black text-slate-600 transition-all hover:bg-slate-200"
					>
						DOWNLOAD INVOICE
					</button>
					<button
						class="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
					>
						NOTIFY CONSUMER
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Hide number input spinners */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
