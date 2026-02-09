<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import {
		User,
		Zap,
		Calendar,
		FileText,
		ArrowUpRight,
		ArrowDownRight,
		Clock
	} from 'lucide-svelte';
	import { consumersData } from '$lib/stores/data';
	import Chart from 'chart.js/auto';

	let id = $derived($page.params.id);
	let consumer = $derived(consumersData.find((c) => c.id === id));

	let chartCanvas = $state(null);
	let chartInstance = $state(null);

	let chartData = $derived(
		consumer
			? {
					labels: [
						'Jan',
						'Feb',
						'Mar',
						'Apr',
						'May',
						'Jun',
						'Jul',
						'Aug',
						'Sep',
						'Oct',
						'Nov',
						'Dec'
					],
					datasets: [
						{
							label: 'Usage (kWh)',
							data: consumer.usage.monthly,
							borderColor: consumer.type === 'Agricultural' ? '#10b981' : '#3b82f6',
							backgroundColor:
								consumer.type === 'Agricultural'
									? 'rgba(16, 185, 129, 0.1)'
									: 'rgba(59, 130, 246, 0.1)',
							fill: true,
							tension: 0.4
						}
					]
				}
			: null
	);

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				grid: {
					color: 'rgba(0,0,0,0.05)'
				}
			},
			x: {
				grid: {
					display: false
				}
			}
		}
	};

	$effect(() => {
		if (chartCanvas && chartData) {
			if (chartInstance) chartInstance.destroy();
			chartInstance = new Chart(chartCanvas, {
				type: 'line',
				data: chartData,
				options: chartOptions
			});
		}
	});
</script>

{#if !consumer}
	<div class="flex h-96 flex-col items-center justify-center text-center">
		<h2 class="text-xl font-bold text-slate-900">Consumer Not Found</h2>
		<a href="/consumer" class="mt-4 text-blue-600 hover:underline">Back to Consumers</a>
	</div>
{:else}
	<div class="space-y-6" in:fade>
		<!-- Header / Identity -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-4">
				<div
					class={`flex h-16 w-16 items-center justify-center rounded-2xl border bg-white text-2xl shadow-sm
                    ${
											consumer.type === 'Agricultural'
												? 'border-green-200 text-green-600'
												: consumer.type === 'Commercial'
													? 'border-amber-200 text-amber-600'
													: 'border-slate-200 text-slate-600'
										}`}
				>
					{#if consumer.type === 'Agricultural'}
						<Zap />
					{:else if consumer.type === 'Commercial'}
						<FileText />
					{:else}
						<User />
					{/if}
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-2xl font-bold text-slate-900">{consumer.id}</h1>
						<span
							class={`rounded border px-2 py-0.5 text-xs font-bold tracking-wider uppercase ${
								consumer.type === 'Agricultural'
									? 'border-green-200 bg-green-50 text-green-700'
									: consumer.type === 'Commercial'
										? 'border-amber-200 bg-amber-50 text-amber-700'
										: 'border-blue-200 bg-blue-50 text-blue-700'
							}`}
						>
							{consumer.type}
						</span>
					</div>
					<a
						href={`/consumer/${consumer.mobile}`}
						class="group flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
					>
						Owned by <span class="font-bold text-slate-900 group-hover:text-blue-600"
							>{consumer.owner}</span
						>
						<ArrowUpRight class="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
					</a>
				</div>
			</div>

			<div class="flex gap-2">
				<div class="text-right">
					<p class="text-xs font-bold text-slate-400 uppercase">Current Status</p>
					<p
						class={`font-bold ${consumer.status === 'No Power' ? 'text-red-500' : 'text-emerald-500'}`}
					>
						{consumer.status}
					</p>
				</div>
			</div>
		</div>

		<!-- Charts -->
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold text-slate-900">Monthly Usage</h3>
				<div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
					<button class="rounded-md bg-white px-3 py-1 text-xs font-bold shadow-sm">2025</button>
					<button class="rounded-md px-3 py-1 text-xs font-bold text-slate-500 hover:bg-white/50"
						>2024</button
					>
				</div>
			</div>
			<div class="relative h-64 w-full">
				<canvas bind:this={chartCanvas}></canvas>
			</div>
		</div>

		<!-- Yearly Stats & Bills -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Yearly Summary -->
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-bold text-slate-900">Yearly History</h3>
				<div class="space-y-3">
					{#each consumer.usage.yearly as use, i}
						<div class="flex items-center justify-between rounded-xl bg-slate-50 p-3">
							<span class="font-bold text-slate-600">{2023 + i}</span>
							<div class="flex items-center gap-2">
								<span class="font-mono font-bold text-slate-900">{use} kWh</span>
								{#if i > 0 && use > consumer.usage.yearly[i - 1]}
									<ArrowUpRight class="h-4 w-4 text-red-500" />
								{:else if i > 0}
									<ArrowDownRight class="h-4 w-4 text-emerald-500" />
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Billing Info -->
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-bold text-slate-900">Recent Bills</h3>
				{#if consumer.type === 'Agricultural'}
					<div class="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
						<Zap class="mx-auto mb-2 h-6 w-6 text-green-600" />
						<h4 class="font-bold text-green-900">Free Electricity Scheme</h4>
						<p class="text-xs text-green-700">
							This line is subsidized under the Govt Agri Scheme.
						</p>
					</div>
				{/if}

				<div class="space-y-3">
					{#each consumer.bills as bill}
						<div
							class="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
						>
							<div class="flex items-center gap-3">
								<div class="rounded-lg bg-slate-100 p-2">
									<Calendar class="h-4 w-4 text-slate-500" />
								</div>
								<span class="font-bold text-slate-700">{bill.month}</span>
							</div>
							<div class="text-right">
								<p class="font-bold text-slate-900">₹{bill.amount}</p>
								<span
									class={`text-[10px] font-bold uppercase ${
										bill.status === 'Free'
											? 'text-green-600'
											: bill.status === 'Paid'
												? 'text-emerald-600'
												: 'text-red-500'
									}`}>{bill.status}</span
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
