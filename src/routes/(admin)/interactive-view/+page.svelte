<script>
	import GridMap from '$lib/components/ui/GridMap.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>Interactive Grid Map — GridSense</title>
</svelte:head>

<div class="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
	<div>
		<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Interactive View</p>
		<h1 class="text-xl font-bold text-zinc-900">Global Grid Overview</h1>
	</div>
</div>

<div class="p-6">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3" in:fade>
		<div class="flex items-center gap-2">
			<span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
				{data.gridData.length} Transformers
			</span>
			<span class="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
				{data.gridData.reduce((acc, t) => acc + (t.poles?.length || 0), 0)} Poles
			</span>
			<span class="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-100">
				{data.gridData.reduce((acc, t) => acc + (t.consumers?.length || 0), 0)} Consumers
			</span>
		</div>
		<div class="text-xs text-gray-400">
			Zoom in to see connections and consumer status
		</div>
	</div>

	<div class="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
		<GridMap transformers={data.gridData} height="calc(100vh - 240px)" />
	</div>
</div>

<style>
    /* Add fade in for the header stats */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    div.mb-4 {
        animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
</style>
