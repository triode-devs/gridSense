<script>
	import {
		Search,
		Filter,
		User,
		MapPin,
		Zap,
		Briefcase,
		Home,
		ArrowRight,
		Phone
	} from 'lucide-svelte';
	import { consumersData } from '$lib/stores/data';
	import { fade } from 'svelte/transition';

	let searchTerm = $state('');
	let typeFilter = $state('All');

	// Aggregate unique owners? Or just list connections?
	// User asked to "list all the consumer". This usually means the subscriber base.
	// Each record in consumersData is a connection, but has owner info.
	// Displaying as a list of connections seems most detailed.

	let filteredConsumers = $derived(
		consumersData.filter((c) => {
			const matchesSearch =
				c.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.mobile.includes(searchTerm);
			const matchesType = typeFilter === 'All' || c.type === typeFilter;
			return matchesSearch && matchesType;
		})
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Consumer Directory</h1>
			<p class="text-slate-500">Manage all registered consumers and their connections</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
			>
				<User class="h-4 w-4" /> Add Consumer
			</button>
		</div>
	</div>

	<!-- Filters -->
	<div
		class="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md md:flex-row"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by Name, mobile, or ID..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white/50 pr-4 pl-10 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
		<div class="flex gap-1 overflow-x-auto p-1">
			{#each ['All', 'Household', 'Commercial', 'Agricultural'] as type}
				<button
					onclick={() => (typeFilter = type)}
					class={`rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${typeFilter === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
				>
					{type}
				</button>
			{/each}
		</div>
	</div>

	<!-- Consumers List -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredConsumers as consumer (consumer.id)}
			<div
				in:fade={{ duration: 300 }}
				class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
			>
				<div class="flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div
							class={`flex h-12 w-12 items-center justify-center rounded-xl border text-slate-600 shadow-sm
                            ${
															consumer.type === 'Agricultural'
																? 'border-green-100 bg-green-50 text-green-600'
																: consumer.type === 'Commercial'
																	? 'border-amber-100 bg-amber-50 text-amber-600'
																	: 'border-blue-100 bg-blue-50 text-blue-600'
														}`}
						>
							{#if consumer.type === 'Agricultural'}
								<Zap class="h-6 w-6" />
							{:else if consumer.type === 'Commercial'}
								<Briefcase class="h-6 w-6" />
							{:else}
								<Home class="h-6 w-6" />
							{/if}
						</div>
						<div>
							<!-- Link to Owner Profile (csid = mobile) -->
							<a
								href={`/consumer/${consumer.mobile}`}
								class="text-lg font-bold text-slate-900 decoration-blue-200 underline-offset-4 transition-all hover:text-blue-600 hover:underline"
							>
								{consumer.owner}
							</a>
							<div class="flex items-center gap-2 text-xs text-slate-500">
								<Phone class="h-3 w-3" />
								{consumer.mobile}
							</div>
						</div>
					</div>
				</div>

				<div class="mt-4 space-y-2 border-t border-slate-100 pt-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-slate-400 uppercase">Connection ID</span>
						<!-- Link to Connection Details (cnid = id) -->
						<a
							href={`/connection/${consumer.id}`}
							class="flex items-center gap-1 rounded bg-slate-50 px-2 py-1 font-mono text-xs font-bold text-slate-700 transition-colors hover:text-blue-600"
						>
							{consumer.id}
							<ArrowRight class="h-3 w-3" />
						</a>
					</div>
					<div class="flex items-center gap-2 text-xs text-slate-600">
						<MapPin class="h-3.5 w-3.5 text-slate-400" />
						<span class="truncate">{consumer.address}</span>
					</div>
				</div>

				<div class="mt-4 flex items-center justify-between">
					<span
						class={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase 
                        ${
													consumer.status === 'No Power'
														? 'bg-red-100 text-red-600'
														: consumer.status === 'Low Voltage'
															? 'bg-amber-100 text-amber-600'
															: 'bg-emerald-100 text-emerald-600'
												}`}
					>
						{consumer.status}
					</span>
					<span
						class={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
							consumer.type === 'Commercial'
								? 'border-amber-200 bg-amber-50 text-amber-700'
								: consumer.type === 'Agricultural'
									? 'border-green-200 bg-green-50 text-green-700'
									: 'border-blue-200 bg-blue-50 text-blue-700'
						}`}
					>
						{consumer.type}
					</span>
				</div>
			</div>
		{/each}

		{#if filteredConsumers.length === 0}
			<div class="col-span-full py-12 text-center text-slate-500">
				No consumers found matching your criteria.
			</div>
		{/if}
	</div>
</div>
