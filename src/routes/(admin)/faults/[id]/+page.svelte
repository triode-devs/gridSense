<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import {
		ArrowLeft,
		Zap,
		Thermometer,
		Activity,
		Calendar,
		MapPin,
		AlertTriangle,
		CheckCircle2,
		XCircle,
		Home,
		ArrowRight
	} from 'lucide-svelte';
	import { faultsList, transformerDetails } from '$lib/stores/data';
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	import { gridLines } from '$lib/data/gridData.js';

	// Get ID from URL
	let faultId = $derived($page.params.id);

	// Find fault and transformer data
	let fault = $derived(faultsList.find((f) => f.id === faultId));
	let transformer = $derived(fault ? transformerDetails[fault.transformerId] : null);

	// In a real app, query lines connected to this fault/transformer
	// For demo, just showing all lines or filtering specific ones
	let lines = $state(gridLines);

	function getStatusColor(status) {
		if (status === 'Online') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
		if (status === 'Offline') return 'text-slate-500 bg-slate-100 border-slate-200';
		return 'text-amber-600 bg-amber-50 border-amber-200'; // Warning/Overload
	}
</script>

{#if !fault}
	<div class="flex h-96 flex-col items-center justify-center text-center">
		<h2 class="text-xl font-bold text-slate-900">Fault Not Found</h2>
		<p class="text-slate-500">The requested fault ID could not be located.</p>
		<a
			href="/faults"
			class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
		>
			Back to Faults
		</a>
	</div>
{:else}
	<div class="space-y-6" in:fade>
		<!-- Header -->
		<div class="flex items-center gap-4">
			<a
				href="/faults"
				class="rounded-full bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
			>
				<ArrowLeft class="h-5 w-5" />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-slate-900">Fault Details: {fault.id}</h1>
				<p class="flex items-center gap-2 text-sm text-slate-500">
					<MapPin class="h-3.5 w-3.5" />
					{fault.location}
				</p>
			</div>
			<div class="ml-auto flex gap-2">
				<span
					class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase"
				>
					{fault.status}
				</span>
				<span
					class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold tracking-wider text-red-600 uppercase"
				>
					{fault.severity}
				</span>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Map Section (Full width on key view) -->
			<div
				class="h-[400px] overflow-hidden rounded-2xl border border-slate-200 shadow-lg lg:col-span-3"
			>
				<GoogleMap {lines} />
			</div>

			<!-- Transformer Stats -->
			<div class="space-y-6 lg:col-span-2">
				{#if transformer}
					<div
						class="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md"
					>
						<div class="mb-6 flex items-center justify-between">
							<h2 class="flex items-center gap-2 text-lg font-bold text-slate-900">
								<Zap class="h-5 w-5 text-blue-500" /> Transformer Status
							</h2>
							<span class="font-mono text-xs font-bold text-slate-400">ID: {transformer.id}</span>
						</div>

						<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
							<div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
								<p class="text-xs font-bold text-slate-400 uppercase">Load</p>
								<div class="mt-1 flex items-center gap-2">
									<Activity class="h-5 w-5 text-blue-500" />
									<span class="text-xl font-bold text-slate-900">{transformer.load}</span>
								</div>
							</div>
							<div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
								<p class="text-xs font-bold text-slate-400 uppercase">Temp</p>
								<div class="mt-1 flex items-center gap-2">
									<Thermometer class="h-5 w-5 text-amber-500" />
									<span
										class={`text-xl font-bold ${parseInt(transformer.temperature) > 80 ? 'text-red-600' : 'text-slate-900'}`}
									>
										{transformer.temperature}
									</span>
								</div>
							</div>
							<div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
								<p class="text-xs font-bold text-slate-400 uppercase">Capacity</p>
								<p class="mt-1 text-xl font-bold text-slate-900">{transformer.capacity}</p>
							</div>
							<div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
								<p class="text-xs font-bold text-slate-400 uppercase">Last Maint.</p>
								<p class="mt-1 text-sm font-bold text-slate-900">{transformer.lastMaintenance}</p>
							</div>
						</div>
					</div>

					<!-- Connected Lines -->
					<div
						class="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md"
					>
						<h2 class="mb-4 text-lg font-bold text-slate-900">Connected Lines</h2>
						<div class="space-y-3">
							{#each transformer.lines as line}
								<div
									class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
								>
									<div class="flex items-center gap-3">
										<div
											class={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg 
                                            ${
																							line.status === 'Online'
																								? 'border-emerald-200 bg-emerald-50 text-emerald-600'
																								: line.status === 'Offline'
																									? 'border-red-200 bg-red-50 text-red-600'
																									: 'border-amber-200 bg-amber-50 text-amber-600'
																						}`}
										>
											<Activity class="h-5 w-5" />
										</div>
										<div>
											<p class="font-bold text-slate-900">{line.name}</p>
											<p class="text-xs font-medium text-slate-500">ID: {line.id}</p>
										</div>
									</div>
									<div class="text-right">
										<span
											class={`rounded border px-2 py-1 text-xs font-bold uppercase ${getStatusColor(line.status)}`}
										>
											{line.status}
										</span>
										<p class="mt-1 text-xs font-bold text-slate-400">{line.load}% Load</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div
						class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800"
					>
						<AlertTriangle class="mx-auto mb-2 h-8 w-8" />
						<h3 class="font-bold">Transformer Data Unavailable</h3>
						<p class="text-sm">
							Could not retrieve technical details for ID: {fault.transformerId}
						</p>
					</div>
				{/if}
			</div>

			<!-- Affected Consumers Sidebar -->
			<div class="space-y-6">
				<div
					class="sticky top-6 rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md"
				>
					<h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
						<Home class="h-5 w-5 text-slate-500" />
						Affected Houses
						{#if transformer}
							<span class="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600"
								>{transformer.connectedHouses.length}</span
							>
						{/if}
					</h2>

					{#if transformer}
						<div class="flex flex-col gap-3">
							{#each transformer.connectedHouses as house}
								<div
									class="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
								>
									<div class="flex items-center gap-3">
										<a
											href={`/connection/${house.id}`}
											class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition-colors hover:bg-blue-600 hover:text-white"
										>
											{house.id.split('-').pop()}
										</a>
										<div>
											<a
												href={`/consumer/${house.mobile || '9876543210'}`}
												class="mb-1 block w-fit text-sm font-bold text-slate-900 underline decoration-slate-200 underline-offset-2 transition-colors hover:text-blue-600"
												>{house.owner}</a
											>
											<a href={`/connection/${house.id}`} class="group/link block">
												<div class="flex flex-wrap items-center gap-1.5">
													<span
														class="text-[10px] text-slate-500 transition-colors group-hover/link:text-slate-700"
														>{house.address}</span
													>
													<span
														class={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
															house.type === 'Commercial'
																? 'border-amber-200 bg-amber-50 text-amber-700'
																: house.type === 'Agricultural'
																	? 'border-green-200 bg-green-50 text-green-700'
																	: 'border-blue-200 bg-blue-50 text-blue-700'
														}`}
													>
														{house.type || 'Household'}
													</span>
													<ArrowRight
														class="h-3 w-3 -translate-x-2 text-slate-300 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
													/>
												</div>
											</a>
										</div>
									</div>
									<div class="text-right">
										<p
											class={`text-xs font-bold ${house.status === 'No Power' ? 'text-red-600' : 'text-emerald-600'}`}
										>
											{house.status}
										</p>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-6 border-t border-slate-200 pt-4">
							<button
								class="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
							>
								Notify All Users
							</button>
							<button
								class="mt-2 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
							>
								Assign Staff
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
