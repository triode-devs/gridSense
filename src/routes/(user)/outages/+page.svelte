<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		AlertTriangle,
		MapPin,
		Activity,
		Clock,
		Loader,
		ChevronRight,
		ZapOff,
		Zap,
		ShieldCheck,
		Search
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	let connections = $state([]);
	let isLoading = $state(true);
	let statuses = $state({});
	let searchTerm = $state('');

	async function fetchConnections() {
		try {
			const res = await fetch(`${API_BASE_URL}/users/consumers`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				connections = data.data;
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
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				statuses[id] = data;
			}
		} catch (e) {
			console.error(`Failed to fetch status for ${id}`);
		}
	}

	const filteredConnections = $derived(
		connections.filter(
			(c) =>
				c.consumer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.consumer_id.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(fetchConnections);
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-bold text-slate-900">Grid Status & Outages</h1>
		<p class="font-medium text-slate-500">
			Real-time monitoring of your connection and local grid health.
		</p>
	</div>

	<div
		class="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search your connections..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white pr-4 pl-12 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
			/>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-[400px] w-full items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-10 w-10 animate-spin text-emerald-600" />
				<p class="font-medium text-slate-500">Scanning local grid topology...</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each filteredConnections as conn}
				{@const status = statuses[conn.consumer_id]}
				<div
					class="group relative overflow-hidden rounded-3xl border border-white bg-white/60 p-8 shadow-sm backdrop-blur-md transition-all hover:border-emerald-100 hover:bg-white"
				>
					<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex items-start gap-5">
							<div
								class={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-all group-hover:scale-105 ${status?.status === 'power_on' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'animate-pulse border-red-100 bg-red-50 text-red-600'}`}
							>
								{#if status?.status === 'power_on'}
									<Zap class="h-8 w-8" fill="currentColor" />
								{:else}
									<ZapOff class="h-8 w-8" />
								{/if}
							</div>
							<div>
								<h3 class="text-xl font-bold text-slate-900">{conn.consumer_name}</h3>
								<div class="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
									<MapPin class="h-4 w-4 text-slate-300" />
									{conn.address}
								</div>
								<div class="mt-4 flex items-center gap-3">
									<span
										class={`rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${status?.status === 'power_on' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 shadow-lg shadow-red-500/20'}`}
									>
										{status?.status === 'power_on' ? 'Power Online' : 'Outage Detected'}
									</span>
									{#if status}
										<span class="flex items-center gap-1.5 text-xs font-bold text-slate-400">
											<Clock class="h-3 w-3" /> Updated {new Date(
												status.details.last_update
											).toLocaleTimeString()}
										</span>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex min-w-[240px] flex-col gap-4">
							<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 group-hover:bg-white">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase"
										>Local Transformer</span
									>
									<span
										class={`h-2 w-2 rounded-full ${status?.details.transformer_status === 'active' ? 'bg-emerald-500' : 'animate-ping bg-red-500'}`}
									></span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm font-bold text-slate-700">Status</span>
									<span
										class={`text-sm font-bold ${status?.details.transformer_status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}
									>
										{status?.details.transformer_status || '...'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{#if status?.status !== 'power_on' && status}
						<div class="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6" in:slide>
							<div class="mb-4 flex items-center gap-3 text-red-700">
								<AlertTriangle class="h-5 w-5" />
								<h4 class="font-bold">Outage Information</h4>
							</div>
							<p class="text-sm font-medium text-red-600">
								A power failure has been detected near your location. Our systems have identified a
								possible fault at the local distribution node. Personnel will be assigned shortly.
							</p>
							<div class="mt-4 flex flex-wrap gap-4">
								<div class="flex items-center gap-2 text-xs font-bold text-red-700">
									<Activity class="h-3.5 w-3.5" /> Discovery Algorithm: ACTIVE
								</div>
								<div class="flex items-center gap-2 text-xs font-bold text-red-700">
									<ShieldCheck class="h-3.5 w-3.5" /> Safety Relay: TRIPPED
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Global Outage Map Callout -->
	<div class="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl">
		<div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
		<div class="relative flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="max-w-md">
				<h2 class="mb-2 text-2xl font-bold text-white">Local Grid Map</h2>
				<p class="text-sm leading-relaxed text-slate-400">
					View the live status of the entire distribution network in your area. Track resolution
					progress in real-time.
				</p>
			</div>
			<button
				class="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-slate-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
			>
				Open Live Map <ChevronRight class="h-5 w-5" />
			</button>
		</div>
	</div>
</div>
