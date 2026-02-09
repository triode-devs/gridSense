<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Activity,
		Download,
		Database,
		Cloud,
		Loader,
		ShieldCheck,
		AlertTriangle
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let health = $state(null);
	let isLoading = $state(false);
	let isExporting = $state(false);

	async function fetchHealth() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/system`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			health = await res.json();
		} catch (e) {
			console.error('Failed to fetch health');
		} finally {
			isLoading = false;
		}
	}

	async function runExport() {
		isExporting = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/export`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `gridsense_export_${new Date().toISOString().split('T')[0]}.json`;
				a.click();
			}
		} catch (e) {
			console.error('Export failed');
		} finally {
			isExporting = false;
		}
	}

	onMount(fetchHealth);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">System Administration</h1>
			<p class="text-slate-500">Monitor platform health and manage data exports.</p>
		</div>
		<button
			disabled={isExporting}
			onclick={runExport}
			class="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:opacity-70"
		>
			{#if isExporting}
				<Loader class="h-4 w-4 animate-spin" />
				Preparing Export...
			{:else}
				<Download class="h-4 w-4" /> Export All Data
			{/if}
		</button>
	</div>

	<!-- Health Cards -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
					<Database class="h-5 w-5" />
				</div>
				<span
					class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase"
				>
					{health?.database || 'checking...'}
				</span>
			</div>
			<h3 class="text-lg font-bold text-slate-900">Database Engine</h3>
			<p class="text-sm text-slate-500">PostgreSQL instance running on Cloudflare D1 / Neon.</p>
		</div>

		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
				>
					<Cloud class="h-5 w-5" />
				</div>
				<span
					class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase"
				>
					Online
				</span>
			</div>
			<h3 class="text-lg font-bold text-slate-900">Platform</h3>
			<p class="text-sm text-slate-500">Deployed on {health?.platform || 'Cloudflare Pages'}.</p>
		</div>

		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
				>
					<Activity class="h-5 w-5" />
				</div>
				<span
					class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase"
				>
					Healthy
				</span>
			</div>
			<h3 class="text-lg font-bold text-slate-900">API Response</h3>
			<p class="text-sm text-slate-500">Latency is within acceptable limits (avg 45ms).</p>
		</div>
	</div>

	<!-- Status List -->
	<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-100 bg-slate-50 px-6 py-4">
			<h3 class="font-bold text-slate-800">Operational Status</h3>
		</div>
		<div class="divide-y divide-slate-100">
			<div class="flex items-center justify-between px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
					<span class="text-sm font-medium text-slate-700">Transformer Monitoring Service</span>
				</div>
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="flex items-center justify-between px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
					<span class="text-sm font-medium text-slate-700">Billing Automation Worker</span>
				</div>
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="flex items-center justify-between px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
					<span class="text-sm font-medium text-slate-700">Fault Detection Logic</span>
				</div>
				<ShieldCheck class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="flex items-center justify-between px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-amber-500"></div>
					<span class="text-sm font-medium text-slate-700">Email Notification Queue</span>
				</div>
				<div class="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
					<AlertTriangle class="h-3 w-3" /> Processing Lag
				</div>
			</div>
		</div>
	</div>
</div>
