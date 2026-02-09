<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import {
		User,
		Phone,
		Zap,
		Home,
		MapPin,
		Briefcase,
		Activity,
		Share2,
		ArrowRight
	} from 'lucide-svelte';
	import { consumersData } from '$lib/stores/data';

	let mobile = $derived($page.params.mobile);
	let ownerConsumers = $derived(consumersData.filter((c) => c.mobile === mobile));
	let ownerInfo = $derived(ownerConsumers.length > 0 ? ownerConsumers[0] : null);

	// Calculate aggregations
	let totalUsageYear = $derived(
		ownerConsumers.reduce((acc, c) => {
			const lastYear = c.usage.yearly[c.usage.yearly.length - 1] || 0;
			return acc + lastYear;
		}, 0)
	);

	let totalConnections = $derived(ownerConsumers.length);
</script>

{#if !ownerInfo}
	<div class="flex h-96 flex-col items-center justify-center text-center">
		<User class="mb-4 h-16 w-16 text-slate-300" />
		<h2 class="text-xl font-bold text-slate-900">Owner Not Found</h2>
		<p class="text-slate-500">No records found for mobile: {mobile}</p>
	</div>
{:else}
	<div class="space-y-6" in:fade>
		<!-- Owner Profile Card -->
		<div class="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
			<div
				class="absolute top-0 right-0 h-64 w-64 translate-x-1/4 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl"
			></div>

			<div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-6">
					<div
						class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl font-bold shadow-inner backdrop-blur-md"
					>
						{ownerInfo.owner.charAt(0)}
					</div>
					<div>
						<h1 class="text-3xl font-bold tracking-tight">{ownerInfo.owner}</h1>
						<div class="mt-2 flex items-center gap-4 text-slate-400">
							<span
								class="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-3 py-1 text-sm font-medium"
							>
								<Phone class="h-4 w-4" />
								{ownerInfo.mobile}
							</span>
							<span
								class="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-3 py-1 text-sm font-medium"
							>
								<Activity class="h-4 w-4" />
								{totalConnections} Connections
							</span>
						</div>
					</div>
				</div>

				<div class="flex gap-3">
					<button
						class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 active:scale-95"
					>
						<Share2 class="h-4 w-4" /> Export Report
					</button>
				</div>
			</div>
		</div>

		<!-- Stats Overview -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">
					Total Usage (This Year)
				</p>
				<p class="mt-2 text-3xl font-bold text-slate-900">
					{totalUsageYear} <span class="text-sm font-medium text-slate-400">kWh</span>
				</p>
			</div>
			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Active Status</p>
				<div class="mt-2 flex items-center gap-2">
					<div class="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></div>
					<span class="text-xl font-bold text-emerald-600">Good Standing</span>
				</div>
			</div>
			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Primary Region</p>
				<p class="mt-2 truncate text-xl font-bold text-slate-900">North Circle</p>
			</div>
		</div>

		<!-- Owned Connections List -->
		<div>
			<h2 class="mb-4 text-lg font-bold text-slate-900">Owned Connections</h2>
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{#each ownerConsumers as con}
					<a
						href={`/connection/${con.id}`}
						class="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
					>
						<div class="flex items-center gap-4">
							<div
								class={`flex h-12 w-12 items-center justify-center rounded-xl border text-slate-600 shadow-sm
                                ${
																	con.type === 'Agricultural'
																		? 'border-green-100 bg-green-50 text-green-600'
																		: con.type === 'Commercial'
																			? 'border-amber-100 bg-amber-50 text-amber-600'
																			: 'border-blue-100 bg-blue-50 text-blue-600'
																}`}
							>
								{#if con.type === 'Agricultural'}
									<Zap class="h-6 w-6" />
								{:else if con.type === 'Commercial'}
									<Briefcase class="h-6 w-6" />
								{:else}
									<Home class="h-6 w-6" />
								{/if}
							</div>
							<div>
								<h3 class="font-bold text-slate-900 transition-colors group-hover:text-blue-600">
									{con.type} Connection
								</h3>
								<p class="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
									<MapPin class="h-3 w-3" />
									{con.address}
								</p>
								<span class="sr-only">View details for subscription {con.id}</span>
							</div>
						</div>

						<div class="flex items-center gap-4">
							<div class="hidden text-right sm:block">
								<p class="text-xs font-bold text-slate-400 uppercase">ID</p>
								<p class="font-mono text-sm font-bold text-slate-700">{con.id}</p>
							</div>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-blue-600 group-hover:text-white"
							>
								<ArrowRight class="h-4 w-4" />
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}
