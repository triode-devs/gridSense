<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		MapPin,
		Activity,
		Loader,
		ChevronRight,
		ShieldCheck,
		Clock,
		RefreshCw
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);
	let connections = $state([]);
	let isLoading = $state(true);
	let statuses = $state({});

	async function fetchConnections() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers?userid=${id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				connections = data.data || [];
				connections.forEach((conn) => fetchStatus(conn.consumer_id));
			}
		} catch (e) {
			console.error('Failed to fetch connections');
		} finally {
			isLoading = false;
		}
	}

	async function fetchStatus(consumerId) {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers/${consumerId}/status`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				statuses[consumerId] = data;
			}
		} catch (e) {
			console.error(`Failed to fetch status for ${consumerId}`);
		}
	}

	onMount(fetchConnections);
</script>

<svelte:head>
	<title>My Home | GridSense</title>
	<meta
		name="description"
		content="View and monitor your linked electricity meters, real-time power status, and grid health."
	/>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">My Home</h1>
			<p class="text-slate-500">Monitor your connected meters and live power health.</p>
		</div>
		<button
			onclick={fetchConnections}
			class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
		>
			<RefreshCw class="h-4 w-4" /> Refresh
		</button>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="animate-pulse font-medium text-slate-500">Checking your grid status...</p>
			</div>
		</div>
	{:else if connections.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-24 text-center backdrop-blur-md"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
			>
				<Zap class="h-8 w-8" />
			</div>
			<h2 class="text-xl font-bold text-slate-900">No meters linked</h2>
			<p class="mx-auto mt-2 max-w-sm text-slate-500">
				Your account has no linked smart meters yet. Please contact your local grid administrator.
			</p>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each connections as conn}
				<div
					class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
					in:fade
				>
					<div class="p-6 md:p-8">
						<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div class="flex items-center gap-5">
								<!-- Status Icon -->
								<div
									class={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-all group-hover:scale-105 ${statuses[conn.consumer_id]?.status === 'power_on' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'animate-pulse border-red-100 bg-red-50 text-red-600'}`}
								>
									<Zap
										class="h-7 w-7"
										fill={statuses[conn.consumer_id]?.status === 'power_on'
											? 'currentColor'
											: 'none'}
									/>
								</div>

								<div>
									<div class="flex items-center gap-2">
										<h3 class="text-xl font-bold text-slate-900">{conn.consumer_name}</h3>
										<span
											class={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${statuses[conn.consumer_id]?.status === 'power_on' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
										>
											{statuses[conn.consumer_id]?.status === 'power_on'
												? 'Online'
												: statuses[conn.consumer_id]
													? 'Outage'
													: 'Checking…'}
										</span>
									</div>
									<div class="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
										<MapPin class="h-3.5 w-3.5 text-slate-400" />
										{conn.address}
									</div>
								</div>
							</div>

							<!-- Action -->
							<div class="flex items-center gap-3">
								<a
									href={`/${id}/my-home/${conn.consumer_id}`}
									class="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
								>
									<Activity class="h-4 w-4" /> View Details
								</a>
								<a
									href={`/${id}/my-home/${conn.consumer_id}`}
									class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
								>
									<ChevronRight class="h-5 w-5" />
								</a>
							</div>
						</div>

						<!-- Status Row -->
						{#if statuses[conn.consumer_id]}
							<div
								class="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3"
								transition:slide
							>
								<div>
									<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
										Transformer
									</p>
									<div class="flex items-center gap-2">
										<ShieldCheck
											class={`h-4 w-4 ${statuses[conn.consumer_id].details?.transformer_status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}
										/>
										<span class="text-sm font-bold text-slate-700 capitalize"
											>{statuses[conn.consumer_id].details?.transformer_status ?? '—'}</span
										>
									</div>
								</div>
								<div>
									<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
										Last Updated
									</p>
									<div class="flex items-center gap-2">
										<Clock class="h-4 w-4 text-slate-400" />
										<span class="text-sm font-bold text-slate-700"
											>{statuses[conn.consumer_id].details?.last_update
												? new Date(
														statuses[conn.consumer_id].details.last_update
													).toLocaleTimeString()
												: '—'}</span
										>
									</div>
								</div>
								<div>
									<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
										Meter ID
									</p>
									<span class="font-mono text-sm font-bold text-slate-500">{conn.consumer_id}</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
