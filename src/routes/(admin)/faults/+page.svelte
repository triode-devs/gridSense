<script>
	import { fade, fly } from 'svelte/transition';
	import {
		Search,
		Filter,
		AlertTriangle,
		Zap,
		AlertOctagon,
		ArrowRight,
		MapPin,
		Clock
	} from 'lucide-svelte';
	import { faultsList } from '$lib/stores/data';

	let searchTerm = $state('');
	let statusFilter = $state('All'); // All, Pending, Investigating, Resolved

	// Filter faults based on search and status
	let filteredFaults = $derived(
		faultsList.filter((f) => {
			const matchesSearch =
				f.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
				f.id.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	function getSeverityColor(sev) {
		if (sev === 'Critical') return 'text-red-600 bg-red-50 ring-red-200';
		if (sev === 'Warning') return 'text-amber-600 bg-amber-50 ring-amber-200';
		return 'text-blue-600 bg-blue-50 ring-blue-200';
	}

	function getStatusBadge(status) {
		if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700';
		if (status === 'Investigating') return 'bg-blue-100 text-blue-700';
		return 'bg-slate-100 text-slate-700';
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Fault Management</h1>
			<p class="text-slate-500">Track and assign detected grid anomalies</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
			>
				<Zap class="h-4 w-4" /> Report New Fault
			</button>
		</div>
	</div>

	<!-- Filters & Search -->
	<div
		class="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md md:flex-row"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by ID, Location..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white/50 pr-4 pl-10 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
		<div class="flex gap-1 overflow-x-auto p-1">
			{#each ['All', 'Pending', 'Investigating', 'Resolved'] as status}
				<button
					onclick={() => (statusFilter = status)}
					class={`rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
				>
					{status}
				</button>
			{/each}
		</div>
	</div>

	<!-- Faults Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredFaults as fault (fault.id)}
			<a
				href={`/faults/detail/${fault.id}`}
				class="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
				in:fade={{ duration: 300 }}
			>
				<div class="flex items-start justify-between">
					<div
						class={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${getSeverityColor(fault.severity)}`}
					>
						<AlertTriangle class="h-5 w-5" />
					</div>
					<span
						class={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getStatusBadge(fault.status)}`}
					>
						{fault.status}
					</span>
				</div>

				<div class="mt-4">
					<h3 class="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
						{fault.location}
					</h3>
					<p class="mt-1 text-xs font-medium text-slate-500">
						Fault ID: <span class="text-slate-900">{fault.id}</span>
					</p>
				</div>

				<div class="mt-4 space-y-2 border-t border-slate-100 pt-4">
					<div class="flex items-center gap-2 text-xs text-slate-600">
						<AlertOctagon class="h-3.5 w-3.5 text-slate-400" />
						<span>{fault.type}</span>
					</div>
					<div class="flex items-center gap-2 text-xs text-slate-600">
						<Clock class="h-3.5 w-3.5 text-slate-400" />
						<span>Reported at {fault.time}</span>
					</div>
				</div>

				<div class="mt-4 flex items-center justify-between">
					<div class="flex -space-x-2">
						{#if fault.status === 'Resolved'}
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white ring-2 ring-white"
							>
								✓
							</div>
						{:else}
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500 ring-2 ring-white"
							>
								?
							</div>
						{/if}
					</div>
					<span
						class="flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
					>
						View Details <ArrowRight class="h-3 w-3" />
					</span>
				</div>
			</a>
		{/each}

		{#if filteredFaults.length === 0}
			<div class="col-span-full py-12 text-center">
				<div
					class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300"
				>
					<Search class="h-8 w-8" />
				</div>
				<h3 class="font-bold text-slate-900">No faults found</h3>
				<p class="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
			</div>
		{/if}
	</div>
</div>
