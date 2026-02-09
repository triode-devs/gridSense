<script>
	import { onMount } from 'svelte';
	import { fade, fly, slide, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import {
		dashboardData as initialData,
		liveFaults as initialFaults,
		shutdowns as initialShutdowns,
		areaUsage as initialUsage
	} from '$lib/stores/data';

	// Lucide Icons Import
	import {
		Search,
		Zap,
		Activity,
		AlertCircle,
		CalendarClock,
		ArrowUp,
		ZapOff,
		BarChart3,
		PowerOff,
		Plus,
		FileText,
		HardHat,
		Loader
	} from 'lucide-svelte';

	// --- MOCK DATA STATE ---
	let dashboardData = $state(initialData);
	let liveFaults = $state(initialFaults);
	let shutdowns = $state(initialShutdowns);
	let areaUsage = $state(initialUsage);

	let isLoading = $state(true);

	onMount(() => {
		setTimeout(() => {
			isLoading = false;
		}, 1000);
	});

	function getSeverityColor(sev) {
		if (sev === 'Critical') return 'text-red-600 bg-red-50 border-red-200';
		if (sev === 'Warning') return 'text-amber-600 bg-amber-50 border-amber-200';
		return 'text-blue-600 bg-blue-50 border-blue-200';
	}

	function getLoadColor(percentage) {
		if (percentage > 90) return 'bg-red-500';
		if (percentage > 70) return 'bg-amber-500';
		return 'bg-emerald-500';
	}
</script>

<svelte:head>
	<title>Dashboard - GridSense</title>
</svelte:head>

<div class="font-poppins fixed inset-0 -z-10 h-screen w-screen overflow-hidden bg-slate-50">
	<div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50"></div>
	<div
		class="animate-blob absolute top-0 -left-4 h-96 w-96 rounded-full bg-blue-300 opacity-60 mix-blend-multiply blur-3xl filter"
	></div>
	<div
		class="animate-blob animation-delay-2000 absolute top-0 -right-4 h-96 w-96 rounded-full bg-cyan-200 opacity-60 mix-blend-multiply blur-3xl filter"
	></div>
	<div
		class="animate-blob animation-delay-4000 absolute -bottom-32 left-20 h-96 w-96 rounded-full bg-indigo-200 opacity-60 mix-blend-multiply blur-3xl filter"
	></div>
	<div
		class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"
	></div>
</div>

<div
	class="relative flex min-h-screen w-full flex-col overflow-hidden bg-white/40 pb-12 backdrop-blur-md"
>
	<div class="mx-auto w-full max-w-7xl">
		<header class="flex flex-col gap-4 px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
						Power Management System
					</p>
					<h1 class="text-xl font-bold text-zinc-900 sm:text-2xl">GridSense Dashboard</h1>
				</div>
				<div
					class="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-2 ring-blue-100 transition-transform hover:scale-110"
				>
					<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Engineer" alt="User" />
				</div>
			</div>

			<div
				class="group relative flex items-center rounded-2xl border border-white/60 bg-white/40 px-4 shadow-sm backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-blue-500/20 hover:bg-white/60"
			>
				<Search class="h-5 w-5 text-gray-500" />
				<input
					type="text"
					placeholder="Search feeder, area, or fault ID..."
					class="h-12 w-full bg-transparent px-3 text-sm text-zinc-800 outline-none placeholder:text-gray-400"
				/>
			</div>
		</header>

		{#if isLoading}
			<div class="flex h-96 w-full items-center justify-center">
				<Loader class="h-12 w-12 animate-spin text-blue-500" />
			</div>
		{:else}
			<div class="space-y-4 px-4 sm:space-y-6 sm:px-6" in:fade={{ duration: 300 }}>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div
						class="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02]"
					>
						<div
							class="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-100 opacity-50 blur-xl"
						></div>
						<div class="mb-2 flex items-center gap-3">
							<div class="rounded-lg bg-blue-100 p-2 text-blue-600">
								<Zap class="h-5 w-5" />
							</div>
							<span class="text-xs font-bold tracking-wider text-gray-400 uppercase"
								>Total Load</span
							>
						</div>
						<div class="flex items-baseline gap-1">
							<h3 class="text-3xl font-bold text-zinc-900">{dashboardData.totalLoad}</h3>
							<span class="text-sm font-medium text-gray-500">MW</span>
						</div>
						<p class="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
							<ArrowUp class="h-3 w-3" /> +2.4% vs yesterday
						</p>
					</div>

					<div
						class="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02]"
					>
						<div class="mb-2 flex items-center gap-3">
							<div class="rounded-lg bg-emerald-100 p-2 text-emerald-600">
								<Activity class="h-5 w-5" />
							</div>
							<span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Frequency</span
							>
						</div>
						<div class="flex items-baseline gap-1">
							<h3 class="text-3xl font-bold text-zinc-900">{dashboardData.gridFrequency}</h3>
							<span class="text-sm font-medium text-gray-500">Hz</span>
						</div>
						<p class="mt-2 text-xs font-medium text-emerald-600">Stable</p>
					</div>

					<div
						class="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02]"
					>
						<div class="mb-2 flex items-center gap-3">
							<div class="rounded-lg bg-red-100 p-2 text-red-600">
								<AlertCircle class="h-5 w-5" />
							</div>
							<span class="text-xs font-bold tracking-wider text-red-400 uppercase"
								>Active Faults</span
							>
						</div>
						<h3 class="text-3xl font-bold text-red-700">{dashboardData.activeFaults}</h3>
						<p class="mt-2 text-xs font-medium text-red-600">Requires immediate attention</p>
					</div>

					<div
						class="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02]"
					>
						<div class="mb-2 flex items-center gap-3">
							<div class="rounded-lg bg-amber-100 p-2 text-amber-600">
								<CalendarClock class="h-5 w-5" />
							</div>
							<span class="text-xs font-bold tracking-wider text-gray-400 uppercase">Shutdowns</span
							>
						</div>
						<h3 class="text-3xl font-bold text-zinc-900">{dashboardData.scheduledShutdowns}</h3>
						<p class="mt-2 text-xs font-medium text-gray-500">Areas planned for today</p>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div class="flex flex-col gap-6 lg:col-span-2">
						<div
							class="rounded-3xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:p-6"
						>
							<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<h2 class="flex items-center gap-2 text-lg font-bold text-zinc-900">
									<ZapOff class="h-5 w-5 text-red-500" />
									Live Line Faults
								</h2>
								<button
									class="w-full rounded-full bg-blue-50 px-3 py-1.5 text-center text-xs font-bold text-blue-600 transition-colors hover:text-blue-800 sm:w-auto"
								>
									View All
								</button>
							</div>

							<div class="space-y-3">
								{#each liveFaults as fault}
									<div
										class="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white bg-white/60 p-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="flex items-center gap-4">
											<div
												class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${fault.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
											>
												<ZapOff class="h-6 w-6" />
											</div>
											<div>
												<div class="flex flex-wrap items-center gap-2">
													<h4 class="font-bold text-zinc-900">{fault.location}</h4>
													<span
														class={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getSeverityColor(fault.severity)}`}
													>
														{fault.severity}
													</span>
												</div>
												<p class="mt-0.5 line-clamp-1 text-xs font-medium text-gray-500">
													{fault.type} • ID: {fault.id}
												</p>
											</div>
										</div>
										<div
											class="flex items-center justify-between pl-16 sm:block sm:pl-0 sm:text-right"
										>
											<p class="text-sm font-bold text-zinc-700">{fault.time}</p>
											<span
												class={`text-xs font-bold ${fault.status === 'Resolved' ? 'text-green-600' : 'text-zinc-400'}`}
											>
												{fault.status}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div
							class="rounded-3xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:p-6"
						>
							<div class="mb-6 flex items-center justify-between">
								<h2 class="flex items-center gap-2 text-lg font-bold text-zinc-900">
									<BarChart3 class="h-5 w-5 text-blue-500" />
									Area Consumption Stats
								</h2>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#each areaUsage as area}
									<div
										class="rounded-2xl border border-white bg-white/30 p-4 transition-colors hover:bg-white/50"
									>
										<div class="mb-2 flex items-center justify-between">
											<span class="font-bold text-zinc-800">{area.name}</span>
											<span class="rounded-md bg-zinc-900 px-2 py-1 text-xs font-bold text-white"
												>{area.units.toLocaleString()} Units</span
											>
										</div>
										<div class="flex items-center gap-2">
											<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
												<div
													class={`h-full rounded-full ${getLoadColor(area.load)}`}
													style={`width: ${area.load}%`}
												></div>
											</div>
											<span class="w-8 text-right text-xs font-bold text-gray-500"
												>{area.load}%</span
											>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-6">
						<div
							class="h-fit rounded-3xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:p-6"
						>
							<h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
								<PowerOff class="h-5 w-5 text-zinc-600" />
								Shutdown Areas
								<span
									class="ml-auto rounded-md bg-zinc-200 px-2 py-1 text-xs font-bold text-zinc-600"
									>Today</span
								>
							</h2>

							<div class="space-y-4">
								{#each shutdowns as sd}
									<div class="relative border-l-2 border-zinc-300 pl-4">
										<div
											class="absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full bg-zinc-800 ring-4 ring-white"
										></div>
										<h4 class="text-sm font-bold text-zinc-900">{sd.area}</h4>
										<p class="mt-1 text-xs font-bold text-blue-600">{sd.time}</p>
										<p class="mt-0.5 text-xs text-gray-500">Reason: {sd.reason}</p>
									</div>
								{/each}
							</div>

							<button
								class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-lg shadow-zinc-900/20 transition-transform hover:bg-zinc-800 active:scale-95"
							>
								<Plus class="h-4 w-4" /> Schedule New Shutdown
							</button>
						</div>

						<div
							class="rounded-3xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:p-6"
						>
							<h2 class="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
								Quick Control
							</h2>
							<div class="grid grid-cols-2 gap-3">
								<button
									class="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white bg-white/50 p-4 transition-all hover:bg-white"
								>
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white"
									>
										<FileText class="h-5 w-5" />
									</div>
									<span class="text-xs font-bold text-zinc-700">Reports</span>
								</button>
								<button
									class="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white bg-white/50 p-4 transition-all hover:bg-white"
								>
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white"
									>
										<HardHat class="h-5 w-5" />
									</div>
									<span class="text-xs font-bold text-zinc-700">Staff</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	@keyframes blob {
		0% {
			transform: translate(0px, 0px) scale(1);
		}
		33% {
			transform: translate(30px, -50px) scale(1.1);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.9);
		}
		100% {
			transform: translate(0px, 0px) scale(1);
		}
	}
	.animate-blob {
		animation: blob 20s infinite;
	}
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>
