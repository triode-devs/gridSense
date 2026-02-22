<script>
	import { API_BASE_URL } from '$lib/index.js';
	import { Plus, Save, Loader, AlertCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let tariffs = $state([]);
	let isLoading = $state(false);
	let isSaving = $state(false);
	let error = $state('');
	let message = $state('');

	let newTariff = $state({
		category: '',
		base_pay: 0,
		free_units: 0,
		unit_range_start: 0,
		unit_range_end: null,
		rate_per_unit: 0,
		effective_from: new Date().toISOString().split('T')[0]
	});

	async function fetchTariffs() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/tariffs`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				tariffs = data.data;
			}
		} catch (e) {
			error = 'Failed to load tariffs';
		} finally {
			isLoading = false;
		}
	}

	async function createTariff() {
		isSaving = true;
		error = '';
		message = '';
		try {
			// Convert empty string/null for unit_range_end to null for API
			const payload = { ...newTariff };
			if (payload.unit_range_end === '' || payload.unit_range_end === 0) {
				payload.unit_range_end = null;
			}

			const res = await fetch(`${API_BASE_URL}/admin/tariffs`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (data.success) {
				message = 'Tariff created successfully';
				await fetchTariffs();
				newTariff = {
					category: '',
					base_pay: 0,
					free_units: 0,
					unit_range_start: 0,
					unit_range_end: null,
					rate_per_unit: 0,
					effective_from: new Date().toISOString().split('T')[0]
				};
			} else {
				error = data.message || 'Failed to create tariff';
			}
		} catch (e) {
			error = 'Network error';
		} finally {
			isSaving = false;
		}
	}

	onMount(fetchTariffs);
</script>

<svelte:head>
	<title>Tariff Configuration | GridSense Admin</title>
	<meta
		name="description"
		content="Configure electricity pricing categories, base rates, and per-unit tariff schedules."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Tariff Configuration</h1>
			<p class="text-slate-500">Manage pricing categories and unit rates.</p>
		</div>
	</div>

	{#if error}
		<div
			in:fade
			class="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600"
		>
			<AlertCircle class="h-5 w-5" />
			{error}
		</div>
	{/if}

	{#if message}
		<div in:fade class="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-600">
			{message}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Add Form -->
		<div class="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-bold text-slate-900">Add New Tariff</h2>
			<div class="space-y-4">
				<div class="space-y-2">
					<label class="text-xs font-bold text-slate-500 uppercase">Category</label>
					<input
						type="text"
						bind:value={newTariff.category}
						placeholder="e.g. Residential"
						class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label for="base_pay" class="text-xs font-bold text-slate-500 uppercase"
							>Base Pay (₹)</label
						>
						<input
							id="base_pay"
							type="number"
							bind:value={newTariff.base_pay}
							class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
						/>
					</div>
					<div class="space-y-2">
						<label for="free_units" class="text-xs font-bold text-slate-500 uppercase"
							>Free Units</label
						>
						<input
							id="free_units"
							type="number"
							bind:value={newTariff.free_units}
							class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label for="range_start" class="text-xs font-bold text-slate-500 uppercase"
							>Slab Start</label
						>
						<input
							id="range_start"
							type="number"
							bind:value={newTariff.unit_range_start}
							class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
						/>
					</div>
					<div class="space-y-2">
						<label for="range_end" class="text-xs font-bold text-slate-500 uppercase"
							>Slab End</label
						>
						<input
							id="range_end"
							type="number"
							bind:value={newTariff.unit_range_end}
							placeholder="Max"
							class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
						/>
					</div>
				</div>
				<div class="space-y-2">
					<label for="rate" class="text-xs font-bold text-slate-500 uppercase"
						>Rate per Unit (₹)</label
					>
					<input
						id="rate"
						type="number"
						step="0.01"
						bind:value={newTariff.rate_per_unit}
						class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
					/>
				</div>
				<div class="space-y-2">
					<label for="effective" class="text-xs font-bold text-slate-500 uppercase"
						>Effective From</label
					>
					<input
						id="effective"
						type="date"
						bind:value={newTariff.effective_from}
						class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
					/>
				</div>
				<button
					disabled={isSaving}
					onclick={createTariff}
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-70"
				>
					{#if isSaving}
						<Loader class="h-4 w-4 animate-spin" />
					{:else}
						<Plus class="h-4 w-4" /> Create Tariff
					{/if}
				</button>
			</div>
		</div>

		<!-- List -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2"
		>
			<table class="w-full text-left">
				<thead class="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
					<tr>
						<th class="px-6 py-4">Category</th>
						<th class="px-6 py-4 text-center">Base</th>
						<th class="px-6 py-4 text-center">Free</th>
						<th class="px-6 py-4 text-center">Range</th>
						<th class="px-6 py-4 text-center">Rate</th>
						<th class="px-6 py-4">Effective</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if isLoading}
						<tr>
							<td colspan="6" class="py-12 text-center">
								<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
							</td>
						</tr>
					{:else if tariffs.length === 0}
						<tr>
							<td colspan="6" class="py-12 text-center text-slate-500">No tariffs configured.</td>
						</tr>
					{:else}
						{#each tariffs as tariff}
							<tr class="transition-colors hover:bg-slate-50">
								<td class="px-6 py-4 font-bold text-slate-900">{tariff.category}</td>
								<td class="px-6 py-4 text-center font-medium text-slate-600">₹{tariff.base_pay}</td>
								<td class="px-6 py-4 text-center font-medium text-slate-600">{tariff.free_units}</td
								>
								<td class="px-6 py-4 text-center font-medium text-slate-600">
									{tariff.unit_range_start} - {tariff.unit_range_end ?? '∞'}
								</td>
								<td class="px-6 py-4 text-center font-bold text-blue-600"
									>₹{tariff.rate_per_unit}</td
								>
								<td class="px-6 py-4 text-xs font-bold text-slate-500">{tariff.effective_from}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
