<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		MapPin,
		Activity,
		AlertCircle,
		Loader,
		ChevronRight,
		ShieldCheck,
		Clock
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	let connections = $state([]);
	let isLoading = $state(true);
	let statuses = $state({});

	async function fetchConnections() {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				connections = data.data;
				// After fetching connections, fetch their individual status
				connections.forEach((conn) => fetchStatus(conn.consumer_id));
			}
		} catch (e) {
			console.error('Failed to fetch connections');
		} finally {
			isLoading = false;
		}
	}

	async function fetchStatus(id) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers/${id}/status`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				statuses[id] = data;
			}
		} catch (e) {
			console.error(`Failed to fetch status for ${id}`);
		}
	}

	onMount(fetchConnections);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Welcome Home</h1>
			<p class="text-slate-500">Monitor your connected meters and power health.</p>
		</div>
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm"
		>
			<Zap class="h-6 w-6" />
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Checking your grid status...</p>
			</div>
		</div>
	{:else if connections.length === 0}
		<div class="rounded-3xl border border-dashed border-slate-200 p-12 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300"
			>
				<Zap class="h-8 w-8" />
			</div>
			<h2 class="text-xl font-bold text-slate-900">No connections linked</h2>
			<p class="mx-auto mt-2 max-w-sm text-slate-500">
				It seems your account hasn't been linked to any smart meters yet. Please contact your local
				grid administrator.
			</p>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each connections as conn}
				<div
					class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-8 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-xl"
				>
					<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
						<div class="flex items-center gap-5">
							<div
								class={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-all group-hover:scale-105 ${statuses[conn.consumer_id]?.status === 'power_on' ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'animate-pulse border-red-100 bg-red-50 text-red-600'}`}
							>
								<Zap
									class="h-8 w-8"
									fill={statuses[conn.consumer_id]?.status === 'power_on' ? 'currentColor' : 'none'}
								/>
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h3 class="text-xl font-bold text-slate-900">{conn.consumer_name}</h3>
									<span
										class={`rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${statuses[conn.consumer_id]?.status === 'power_on' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
									>
										{statuses[conn.consumer_id]?.status || 'Checking...'}
									</span>
								</div>
								<div class="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
									<MapPin class="h-4 w-4 text-slate-300" />
									{conn.address}
								</div>
							</div>
						</div>

						<div class="flex gap-3">
							<a
								href={`/my-home/${conn.consumer_id}`}
								class="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-transform hover:bg-slate-800 active:scale-95"
							>
								<Activity class="h-4 w-4" /> View Details
							</a>
							<a
								href={`/my-home/${conn.consumer_id}`}
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
							>
								<ChevronRight class="h-5 w-5" />
							</a>
						</div>
					</div>

					{#if statuses[conn.consumer_id]}
						<div
							class="mt-8 grid grid-cols-1 gap-4 divide-slate-100 border-t border-slate-50 pt-8 sm:grid-cols-2 md:grid-cols-3 md:divide-x"
							transition:slide
						>
							<div class="px-2">
								<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
									Transformer Health
								</p>
								<div class="flex items-center gap-2">
									<ShieldCheck
										class={`h-4 w-4 ${statuses[conn.consumer_id].details.transformer_status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}
									/>
									<span class="text-sm font-bold text-slate-700"
										>{statuses[conn.consumer_id].details.transformer_status}</span
									>
								</div>
							</div>
							<div class="px-2">
								<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
									Last Updated
								</p>
								<div class="flex items-center gap-2">
									<Clock class="h-4 w-4 text-slate-400" />
									<span class="text-sm font-bold text-slate-700"
										>{new Date(
											statuses[conn.consumer_id].details.last_update
										).toLocaleTimeString()}</span
									>
								</div>
							</div>
							<div class="px-2">
								<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
									Meter ID
								</p>
								<span class="font-mono text-sm font-bold text-slate-500">{conn.consumer_id}</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
