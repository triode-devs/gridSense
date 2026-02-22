<script>
	import { API_BASE_URL } from '$lib/index.js';
	import { goto } from '$app/navigation';
	import { Zap, MapPin, Loader, ArrowRight, Network } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let transformers = $state([]);
	let isLoading = $state(true);
	let searchTerm = $state('');

	async function fetchTransformers() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/transformer`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) transformers = data.data;
		} catch (e) {
			console.error('Failed to fetch transformers');
		} finally {
			isLoading = false;
		}
	}

	const filtered = $derived(
		transformers.filter(
			(t) =>
				t.transformer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				t.location_description.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(fetchTransformers);
</script>

<svelte:head>
	<title>Grid Topology | GridSense Admin</title>
	<meta
		name="description"
		content="Visual network topology map for each transformer and its grid infrastructure."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Grid Topology</h1>
			<p class="font-medium text-slate-500">Select a transformer to view its topology map.</p>
		</div>
		<div class="relative">
			<Network class="absolute top-3.5 left-4 h-4 w-4 text-slate-400" />
			<input
				type="text"
				placeholder="Search transformers..."
				bind:value={searchTerm}
				class="h-11 rounded-2xl border border-slate-200 bg-white py-2 pr-4 pl-11 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
	</div>

	{#if isLoading}
		<div
			class="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm"
		>
			<div class="flex flex-col items-center gap-4">
				<Loader class="h-8 w-8 animate-spin text-blue-500" />
				<p class="text-xs font-bold tracking-widest text-slate-400 uppercase">
					Loading Transformers...
				</p>
			</div>
		</div>
	{:else if filtered.length === 0}
		<div
			class="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm"
		>
			<p class="text-slate-400">No transformers found.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filtered as t}
				<button
					onclick={() => goto(`/topology/${t.transformer_id}`)}
					class="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white"
							>
								<Zap class="h-6 w-6" />
							</div>
							<div>
								<h3 class="leading-tight font-bold text-slate-900">{t.location_description}</h3>
								<div class="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
									{t.transformer_id}
								</div>
							</div>
						</div>
						<ArrowRight
							class="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-500"
						/>
					</div>

					<div class="flex items-center gap-2 text-[11px] font-medium text-slate-400">
						<MapPin class="h-3.5 w-3.5 text-slate-300" />
						<span class="truncate font-mono">{t.latitude}, {t.longitude}</span>
					</div>

					<div class="flex items-center justify-between border-t border-slate-50 pt-3">
						<span
							class={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
						>
							{t.status}
						</span>
						<span class="text-[11px] font-semibold text-blue-600">View Topology →</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
