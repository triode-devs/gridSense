<script>
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	import StatusPanel from '$lib/components/StatusPanel.svelte';
	import { gridLines } from '$lib/data/gridData.js';

	// In a real app, this might come from a store or API
	let lines = $state(gridLines);
</script>

<div class="flex h-screen w-screen overflow-hidden bg-gray-950 font-sans text-gray-200">
	<!-- Sidebar -->
	<aside
		class="relative z-10 flex w-96 flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900/95 backdrop-blur-xl transition-all duration-300"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-5">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h1
					class="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-xl font-bold tracking-tight text-transparent text-white"
				>
					GridSense
				</h1>
			</div>
			<div
				class="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
			></div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-hidden p-4">
			<StatusPanel {lines} />
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-800 p-4 text-center text-xs text-gray-600">
			Monitoring System v1.0 • Secure Connection
		</div>
	</aside>

	<!-- Map Area -->
	<main class="relative z-0 flex-1">
		<GoogleMap {lines} />

		<!-- Floating overlay controls (example) -->
		<div class="absolute right-6 bottom-6 z-10 flex flex-col gap-2">
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-900/80 text-white shadow-lg backdrop-blur transition-colors hover:bg-emerald-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
			</button>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-900/80 text-white shadow-lg backdrop-blur transition-colors hover:bg-emerald-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
				</svg>
			</button>
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #030712; /* gray-950 */
		overflow: hidden;
	}
</style>
