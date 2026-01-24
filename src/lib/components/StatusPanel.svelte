<script>
	let { lines = [] } = $props();

	// Derived state for stats
	let totalLines = $derived(lines.length);
	let damagedLines = $derived(lines.filter((l) => l.status === 'damaged').length);
	let activeLines = $derived(lines.filter((l) => l.status === 'ok').length);

	function getStatusClass(status) {
		switch (status) {
			case 'ok':
				return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
			case 'damaged':
				return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
			case 'warning':
				return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
			default:
				return 'bg-gray-700 text-gray-400';
		}
	}
</script>

<div class="flex h-full flex-col gap-4">
	<!-- Stats Cards -->
	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 shadow-lg backdrop-blur-md">
			<h3 class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Grid Status</h3>
			<div class="flex items-center gap-2 text-2xl font-bold text-white">
				{#if damagedLines > 0}
					<span class="h-3 w-3 animate-ping rounded-full bg-red-500"></span>
					Alert
				{:else}
					<span class="h-3 w-3 rounded-full bg-emerald-500"></span>
					Stable
				{/if}
			</div>
		</div>
		<div class="rounded-xl border border-gray-700 bg-gray-800/60 p-4 shadow-lg backdrop-blur-md">
			<h3 class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Affected Lines
			</h3>
			<div class="text-2xl font-bold text-white">
				{damagedLines} <span class="text-sm font-normal text-gray-400">/ {totalLines}</span>
			</div>
		</div>
	</div>

	<!-- List -->
	<div
		class="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-800/60 shadow-lg backdrop-blur-md"
	>
		<div class="border-b border-gray-700 bg-gray-800/80 p-4">
			<h2 class="font-bold text-white">Transmission Lines</h2>
		</div>
		<div class="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
			{#each lines as line}
				<div
					class="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-700/50 bg-gray-900/30 p-3 transition-colors hover:bg-gray-700/50"
				>
					<div>
						<div class="text-sm font-medium text-gray-200 transition-colors group-hover:text-white">
							{line.name}
						</div>
						<div class="mt-0.5 font-mono text-xs text-gray-500">{line.id} • {line.voltage}</div>
					</div>
					<div class="flex flex-col items-end gap-1">
						<span
							class={`rounded border px-2 py-0.5 text-xs font-medium ${getStatusClass(line.status)}`}
						>
							{line.status.toUpperCase()}
						</span>
						<span class="font-mono text-[10px] text-gray-600">{line.load} Load</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
