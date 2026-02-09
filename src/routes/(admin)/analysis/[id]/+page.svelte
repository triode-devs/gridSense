<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		Zap,
		AlertTriangle,
		Activity,
		MapPin,
		Users,
		Loader,
		ArrowLeft,
		Target,
		ChevronRight,
		ShieldAlert,
		ShieldCheck,
		Clock,
		GitMerge,
		ArrowRight
	} from 'lucide-svelte';
	import GridMap from '$lib/components/ui/GridMap.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, fly, scale } from 'svelte/transition';

	let analysisId = $state($page.params.id);
	let analysisData = $state(null);
	let isLoading = $state(true);

	async function fetchAnalysis() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/api/fault-analysis/${analysisId}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			});
			const data = await res.json();
			if (data.success) {
				analysisData = data;
			}
		} catch (e) {
			console.error('Analysis failed');
		} finally {
			isLoading = false;
		}
	}

	const mapAnalysisNodes = $derived(
		analysisData?.map_data?.features?.map((f) => ({
			id: f.properties.id,
			type: f.properties.type,
			lat: f.geometry.coordinates[1],
			lng: f.geometry.coordinates[0],
			status: f.properties.status
		})) || []
	);

	const mapCenter = $derived(
		mapAnalysisNodes.length > 0
			? { lat: mapAnalysisNodes[0].lat, lng: mapAnalysisNodes[0].lng }
			: { lat: 12.9716, lng: 77.5946 }
	);

	onMount(fetchAnalysis);
</script>

<div class="space-y-8">
	<div class="flex items-center gap-4">
		<a
			href="/faults"
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Fault Analysis Report</h1>
			<p class="font-medium tracking-tight text-slate-500">
				Advanced diagnostic for <span class="font-bold text-blue-600">#{analysisId}</span>
			</p>
		</div>
	</div>

	{#if isLoading}
		<div
			class="flex h-[400px] w-full flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm"
		>
			<div class="relative">
				<div class="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
				<Target class="relative h-12 w-12 text-blue-600" />
			</div>
			<div class="text-center">
				<p class="text-lg font-bold text-slate-900">Running Discovery Algorithm...</p>
				<p class="text-sm text-slate-400">
					Tracing LCA (Lowest Common Ancestor) for affected nodes.
				</p>
			</div>
		</div>
	{:else if analysisData}
		<div class="grid gap-8 lg:grid-cols-12">
			<!-- Visual Map HUD -->
			<div class="mb-4 h-[300px] lg:col-span-12">
				<GridMap nodes={mapAnalysisNodes} center={mapCenter} zoom={18} />
			</div>

			<!-- Diagnostic Result -->
			<div class="lg:col-span-12">
				<div
					class={`relative overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl ${analysisData.fault_analysis.fault_detected ? 'border-red-900 bg-red-950 text-red-50' : 'border-emerald-900 bg-emerald-950 text-emerald-50'}`}
				>
					<div
						class="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white opacity-20 blur-3xl"
					></div>
					<div class="relative flex flex-col items-center gap-6 md:flex-row">
						<div
							class={`flex h-20 w-20 items-center justify-center rounded-3xl ${analysisData.fault_analysis.fault_detected ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} border border-white/10 shadow-inner`}
						>
							{#if analysisData.fault_analysis.fault_detected}
								<ShieldAlert class="h-10 w-10" />
							{:else}
								<ShieldCheck class="h-10 w-10" />
							{/if}
						</div>
						<div class="flex-1 text-center md:text-left">
							<h2 class="text-3xl font-bold">
								Fault Node: <span class="font-mono">{analysisData.fault_analysis.fault_node}</span>
							</h2>
							<p
								class={`mt-2 text-lg font-medium ${analysisData.fault_analysis.fault_detected ? 'text-red-200' : 'text-emerald-200'}`}
							>
								{analysisData.fault_analysis.analysis}
							</p>
						</div>
						<div
							class="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 px-10 backdrop-blur-md"
						>
							<p class="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
								Total Affected
							</p>
							<p class="text-4xl font-black">{analysisData.fault_analysis.total_affected}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Details & Map -->
			<div class="flex flex-col gap-6 lg:col-span-8">
				<!-- Affected Consumers -->
				<div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
					<h3 class="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
						<Users class="h-5 w-5 text-blue-600" /> Affected Consumers
					</h3>
					<div class="grid gap-3 md:grid-cols-2">
						{#each analysisData.fault_analysis?.affected_consumers || [] as cons}
							<div
								class="group flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:border-blue-100 hover:bg-white hover:shadow-md"
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all group-hover:bg-blue-600 group-hover:text-white"
									>
										<Zap class="h-4 w-4" />
									</div>
									<span class="text-sm font-bold text-slate-700">{cons}</span>
								</div>
								<ArrowRight
									class="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-1"
								/>
							</div>
						{/each}
					</div>
				</div>

				<!-- Transformer Detail -->
				<div
					class="group flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-8"
				>
					<div class="flex items-center gap-5">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-sm transition-transform group-hover:scale-105"
						>
							<GitMerge class="h-7 w-7" />
						</div>
						<div>
							<p class="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
								Parent Infrastructure
							</p>
							<h4 class="text-xl font-bold text-slate-900">
								{analysisData.transformer.transformer_id}
							</h4>
							<p class="text-xs font-medium text-slate-500">
								{analysisData.transformer.location_description}
							</p>
						</div>
					</div>
					<a
						href={`/topology?id=${analysisData.transformer.transformer_id}`}
						class="flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-all hover:bg-slate-800"
					>
						View Topology
					</a>
				</div>
			</div>

			<!-- Meta Info -->
			<div class="space-y-6 lg:col-span-4">
				<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
					<h3 class="mb-6 text-sm font-bold tracking-widest text-slate-400 uppercase">
						Diagnostic Data
					</h3>
					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<MapPin class="h-5 w-5 text-slate-400" />
								<span class="text-xs font-bold text-slate-600">Geo-Coordinates</span>
							</div>
							<span class="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-900">
								{analysisData.map_data?.features?.[0]?.geometry?.coordinates?.join(', ') ||
									'GPS N/A'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Activity class="h-5 w-5 text-slate-400" />
								<span class="text-xs font-bold text-slate-600">Health Probe</span>
							</div>
							<span class="text-[10px] font-black text-red-600 uppercase">Critical Outage</span>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Clock class="h-5 w-5 text-slate-400" />
								<span class="text-xs font-bold text-slate-600">Analysis Time</span>
							</div>
							<span class="text-xs font-bold text-slate-500">{new Date().toLocaleTimeString()}</span
							>
						</div>
					</div>
				</div>

				<button
					class="flex w-full items-center justify-center gap-3 rounded-3xl bg-blue-600 py-6 text-sm font-bold text-white shadow-xl shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
				>
					Generate Incident Report
				</button>
			</div>
		</div>
	{/if}
</div>
