<script>
	import {
		FileText,
		Download,
		CreditCard,
		CheckCircle2,
		Clock,
		AlertCircle,
		Receipt,
		ChevronRight,
		Loader,
		ArrowRight,
		Zap,
		History
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { API_BASE_URL } from '$lib/index.js';

	let bills = $state([
		{ id: 'BILL-8821', month: 'January 2026', amount: 450.5, status: 'Paid', date: '2026-01-05' },
		{ id: 'BILL-7712', month: 'December 2025', amount: 380.2, status: 'Paid', date: '2025-12-05' },
		{
			id: 'BILL-6603',
			month: 'November 2025',
			amount: 410.85,
			status: 'Overdue',
			date: '2025-11-05'
		}
	]);

	let isLoading = $state(true);
	let currentUsage = $state(0);

	async function fetchBillingPreview() {
		// Mock delay for premium feel
		setTimeout(() => {
			isLoading = false;
		}, 800);
	}

	onMount(fetchBillingPreview);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Billing & Payments</h1>
			<p class="font-medium text-slate-500">Manage your invoices and view payment history.</p>
		</div>
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm"
		>
			<Receipt class="h-6 w-6" />
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<Loader class="h-10 w-10 animate-spin text-blue-600" />
		</div>
	{:else}
		<!-- Active Bill Card -->
		<div class="group relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl">
			<div
				class="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-transparent to-transparent"
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
						<p class="text-sm font-medium text-slate-400">Amount Due for February 2026</p>
						<h2 class="mt-1 text-5xl font-bold text-white">₹512.40</h2>
					</div>
					<div class="flex items-center gap-6">
						<div class="flex items-center gap-2 text-slate-300">
							<Zap class="h-4 w-4 text-emerald-400" />
							<span class="text-sm font-bold">93.1 kWh used</span>
						</div>
						<div class="h-4 w-px bg-slate-800"></div>
						<p class="text-sm font-medium text-slate-400 italic">Due in 12 days</p>
					</div>
				</div>

				<button
					class="group flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-5 font-bold text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95"
				>
					<CreditCard class="h-5 w-5" /> Pay Invoice Now <ArrowRight
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
				{#each bills as bill}
					<div
						class="group flex flex-col gap-4 rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex items-center gap-4">
							<div
								class={`flex h-12 w-12 items-center justify-center rounded-2xl ${bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
							>
								<FileText class="h-6 w-6" />
							</div>
							<div>
								<h4 class="font-bold text-slate-900">{bill.month}</h4>
								<p class="font-mono text-xs tracking-tighter text-slate-400 uppercase">
									{bill.id} • Issued {bill.date}
								</p>
							</div>
						</div>

						<div class="flex items-center justify-between gap-8 pl-16 sm:pl-0">
							<div class="text-right">
								<p class="text-lg font-bold text-slate-900">₹{bill.amount.toFixed(2)}</p>
								<div class="flex items-center justify-end gap-1">
									{#if bill.status === 'Paid'}
										<CheckCircle2 class="h-3 w-3 text-emerald-500" />
									{:else}
										<AlertCircle class="h-3 w-3 text-red-500" />
									{/if}
									<span
										class={`text-[10px] font-bold tracking-widest uppercase ${bill.status === 'Paid' ? 'text-emerald-600' : 'text-red-600'}`}
										>{bill.status}</span
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
