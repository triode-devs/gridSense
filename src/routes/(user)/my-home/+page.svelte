<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Home, Zap, FileText, User, Bell } from 'lucide-svelte';

	let usage = 450;
	let bill = 1250;
	let status = 'Active';
</script>

<svelte:head>
	<title>User Dashboard - GridSense</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 font-sans">
	<header class="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
		<h1 class="flex items-center gap-2 text-xl font-bold text-slate-800">
			<Zap class="h-6 w-6 text-blue-600" /> GridSense User
		</h1>
		<div class="flex items-center gap-4">
			<button class="p-2 text-slate-500 transition-colors hover:text-blue-600">
				<Bell class="h-5 w-5" />
			</button>
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600"
			>
				U
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl space-y-6 p-6" in:fade>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-sm font-medium tracking-wide text-slate-500 uppercase">Current Usage</p>
				<div class="mt-2 flex items-baseline gap-1">
					<span class="text-3xl font-bold text-slate-900">{usage}</span>
					<span class="text-sm text-slate-500">kWh</span>
				</div>
			</div>

			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-sm font-medium tracking-wide text-slate-500 uppercase">Pending Bill</p>
				<div class="mt-2 flex items-baseline gap-1">
					<span class="text-3xl font-bold text-slate-900">₹{bill}</span>
				</div>
				<button
					class="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
				>
					Pay Now
				</button>
			</div>

			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-sm font-medium tracking-wide text-slate-500 uppercase">Connection Status</p>
				<div class="mt-2 text-3xl font-bold text-emerald-600">
					{status}
				</div>
			</div>
		</div>

		<section class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-bold text-slate-800">Recent Activity</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
					<div>
						<p class="font-bold text-slate-700">Bill Payment</p>
						<p class="text-xs text-slate-500">Oct 24, 2026</p>
					</div>
					<span class="text-sm font-bold text-slate-900">-₹1,100</span>
				</div>
				<div class="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
					<div>
						<p class="font-bold text-slate-700">Usage Alert</p>
						<p class="text-xs text-slate-500">Oct 20, 2026</p>
					</div>
					<span class="text-xs font-bold text-amber-600">High Usage</span>
				</div>
			</div>
		</section>
	</main>
</div>
