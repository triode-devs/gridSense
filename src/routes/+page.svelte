<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import {
		ArrowRight,
		Zap,
		Activity,
		ShieldCheck,
		Smartphone,
		Github,
		Code2,
		Cpu,
		GraduationCap,
		CheckCircle2,
		ChevronDown
	} from 'lucide-svelte';

	import { API_BASE_URL } from '$lib/index.js';
	import AuthDrawer from '$lib/components/ui/AuthDrawer.svelte';

	// --- STATE ---
	let mounted = $state(false);
	let scrollY = $state(0);
	let mouseX = $state(0);
	let mouseY = $state(0);

	// --- LOGIN STATE ---
	let showLoginModal = $state(false);

	// Section Refs for intersection observer
	let statsSection;

	// --- MOUSE TRACKING GLOW ---
	function handleMouseMove(e) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	// --- ANIMATED COUNTERS ---
	function animateValue(start, end, duration) {
		let current = start;
		const range = end - start;
		const increment = end > start ? 1 : -1;
		const stepTime = Math.abs(Math.floor(duration / range));

		return new Promise((resolve) => {
			const timer = setInterval(
				() => {
					current += increment;
					if (end === 12000) statLoad = current;
					if (end === 450) statFaults = current;
					if (end === 99) statUptime = current;

					if (current == end) {
						clearInterval(timer);
						resolve();
					}
				},
				stepTime > 10 ? 10 : stepTime
			);
		});
	}

	let statLoad = $state(0);
	let statFaults = $state(0);
	let statUptime = $state(0);

	// --- LIFECYCLE ---
	onMount(() => {
		mounted = true;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (statLoad === 0) {
							animateValue(11500, 12000, 1500);
							animateValue(0, 450, 1500);
							animateValue(0, 99, 1500);
						}
					}
				});
			},
			{ threshold: 0.5 }
		);

		if (statsSection) observer.observe(statsSection);

		return () => {
			if (statsSection) observer.unobserve(statsSection);
		};
	});

	function scrollToSection(id) {
		document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
	}
</script>

<svelte:window bind:scrollY on:mousemove={handleMouseMove} />

<svelte:head>
	<title>GridSense | Smart Grid Management System</title>
	<meta name="description" content="GridSense is an open-source smart grid management system for real-time power monitoring, automated fault detection, and billing — built for modern energy needs." />
	<meta name="keywords" content="GridSense, smart grid, power monitoring, fault detection, SCADA, IoT, energy management, open source" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="GridSense | Smart Grid Management System" />
	<meta property="og:description" content="An open-source IoT solution for real-time power monitoring, fault detection, and automated billing." />
	<meta property="og:site_name" content="GridSense" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="GridSense | Smart Grid Management System" />
	<meta name="twitter:description" content="Open-source smart grid management — real-time monitoring, fault detection, and automated billing." />
</svelte:head>

<div
	class="font-poppins fixed inset-0 -z-20 h-screen w-screen overflow-hidden bg-slate-50 text-zinc-900"
>
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

	<div
		class="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-75"
		style="left: {mouseX}px; top: {mouseY}px; width: 400px; height: 400px;"
	></div>
</div>

<nav
	class="fixed top-0 right-0 left-0 z-50 px-6 py-6 transition-all duration-300 {scrollY > 50
		? 'py-4'
		: 'py-6'}"
>
	<div
		class="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/60 bg-white/40 px-6 py-3 shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:bg-white/60"
	>
		<div class="flex cursor-pointer items-center gap-2" onclick={() => scrollToSection('hero')}>
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
			>
				<Zap class="h-5 w-5" fill="currentColor" />
			</div>
			<span class="text-lg font-bold tracking-tight text-zinc-900">GridSense</span>
		</div>

		<div class="hidden gap-8 text-sm font-semibold text-zinc-600 md:flex">
			<button
				onclick={() => {
					showLoginModal = true;
				}}
				class="transition-colors hover:text-blue-600">Login</button
			>
			<button
				onclick={() => scrollToSection('features')}
				class="transition-colors hover:text-blue-600">Features</button
			>
			<button onclick={() => scrollToSection('stats')} class="transition-colors hover:text-blue-600"
				>Impact</button
			>
		</div>

		<a
			href="https://github.com"
			target="_blank"
			class="group relative overflow-hidden rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 transition-transform active:scale-95"
		>
			<div
				class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
			></div>
			<span class="flex items-center gap-2"><Github class="h-4 w-4" /> Open Source</span>
		</a>
	</div>
</nav>

<main class="w-full overflow-hidden">
	<section
		id="hero"
		class="relative flex min-h-screen w-full flex-col items-center justify-center px-6 pt-20 text-center"
	>
		{#if mounted}
			<div
				in:fly={{ y: 30, duration: 800 }}
				class="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-bold tracking-wide text-emerald-600 uppercase shadow-sm backdrop-blur-sm"
			>
				<CheckCircle2 class="h-4 w-4" />
				Project Available for Sale
			</div>

			<h1
				in:fly={{ y: 50, duration: 1000, delay: 100 }}
				class="max-w-5xl text-5xl leading-tight font-extrabold tracking-tight text-zinc-900 md:text-8xl"
			>
				Smart Grid <br />
				<span
					class="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent"
					>Management System</span
				>
			</h1>

			<p
				in:fly={{ y: 50, duration: 1000, delay: 200 }}
				class="mt-8 max-w-2xl text-lg leading-relaxed font-medium text-zinc-500 md:text-xl"
			>
				A complete Open Source solution for real-time power monitoring, fault detection, and
				automated billing.
			</p>

			<div
				in:fly={{ y: 50, duration: 1000, delay: 300 }}
				class="mt-12 flex flex-col gap-4 sm:flex-row"
			>
				<button
					onclick={() => (showLoginModal = true)}
					class="group flex items-center justify-center gap-3 rounded-2xl bg-zinc-900 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-zinc-900/30 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
				>
					Login to Dashboard
					<ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
				</button>
				<a
					href="/dashboard"
					class="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/40 px-8 py-4 text-lg font-bold text-zinc-800 backdrop-blur-md transition-all hover:bg-white hover:shadow-lg active:scale-95"
				>
					Live Demo
				</a>
			</div>

			<button
				onclick={() => scrollToSection('features')}
				class="absolute bottom-10 animate-bounce cursor-pointer text-zinc-400 hover:text-zinc-900"
			>
				<ChevronDown class="h-8 w-8" />
			</button>
		{/if}
	</section>

	<section id="features" class="flex w-full flex-col items-center justify-center px-6 py-20">
		<div class="mx-auto w-full max-w-7xl">
			<div class="mb-16 text-center">
				<h2 class="text-3xl font-bold text-zinc-900 md:text-5xl">Technical Features</h2>
				<p class="mt-4 text-zinc-500">A robust stack built for modern energy needs.</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				<div
					class="rounded-[2rem] border border-white/60 bg-white/40 p-8 shadow-lg backdrop-blur-md transition-all hover:bg-white/60"
				>
					<div
						class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
					>
						<Activity class="h-7 w-7" />
					</div>
					<h3 class="mb-3 text-xl font-bold text-zinc-900">Live SCADA</h3>
					<p class="text-sm text-zinc-600">
						Monitor voltage, current, and frequency across all substations in real-time.
					</p>
				</div>

				<div
					class="rounded-[2rem] border border-white/60 bg-white/40 p-8 shadow-lg backdrop-blur-md transition-all hover:bg-white/60"
				>
					<div
						class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"
					>
						<ShieldCheck class="h-7 w-7" />
					</div>
					<h3 class="mb-3 text-xl font-bold text-zinc-900">Fault Detection</h3>
					<p class="text-sm text-zinc-600">
						Automatic alerts for line breaks and transformer overloads using IoT sensors.
					</p>
				</div>

				<div
					class="rounded-[2rem] border border-white/60 bg-white/40 p-8 shadow-lg backdrop-blur-md transition-all hover:bg-white/60"
				>
					<div
						class="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
					>
						<Smartphone class="h-7 w-7" />
					</div>
					<h3 class="mb-3 text-xl font-bold text-zinc-900">Mobile App</h3>
					<p class="text-sm text-zinc-600">
						User-friendly mobile interface for consumers to view bills and report outages.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section
		id="stats"
		bind:this={statsSection}
		class="relative flex w-full items-center justify-center overflow-hidden bg-blue-50/50 px-6 py-24"
	>
		<div
			class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:2rem_2rem]"
		></div>

		<div class="relative z-10 mx-auto w-full max-w-7xl text-center">
			<h2 class="text-3xl font-bold text-zinc-900 md:text-5xl">System Performance</h2>
			<p class="mt-4 text-zinc-500">Real-world metrics from our prototype testing.</p>

			<div class="mt-16 grid gap-10 md:grid-cols-3">
				<div class="flex flex-col items-center">
					<span class="text-6xl font-extrabold text-blue-600 md:text-7xl">
						{statLoad.toLocaleString()}+
					</span>
					<span class="mt-4 text-lg font-bold text-zinc-700">Readings Processed</span>
				</div>
				<div class="flex flex-col items-center">
					<span class="text-6xl font-extrabold text-red-500 md:text-7xl">
						{statFaults}
					</span>
					<span class="mt-4 text-lg font-bold text-zinc-700">Faults Simulated</span>
				</div>
				<div class="flex flex-col items-center">
					<span class="text-6xl font-extrabold text-emerald-600 md:text-7xl">
						{statUptime}%
					</span>
					<span class="mt-4 text-lg font-bold text-zinc-700">Uptime Reliability</span>
				</div>
			</div>
		</div>
	</section>

	<section id="cta" class="flex w-full flex-col justify-between bg-white px-6 pt-20 pb-10">
		<div class="flex flex-1 flex-col items-center justify-center text-center">
			<div class="mb-8 rounded-full bg-blue-50 px-6 py-2 text-sm font-bold text-blue-600">
				Open Source & Available
			</div>
			<h2 class="max-w-3xl text-4xl font-extrabold text-zinc-900 md:text-6xl">
				Interested in this project?
			</h2>
			<p class="mt-4 max-w-xl text-lg text-zinc-500">
				This full-stack IoT solution is available for educational purposes or commercial
				implementation.
			</p>
			<div class="mt-10 flex flex-col gap-4 sm:flex-row">
				<button
					onclick={() => (showLoginModal = true)}
					class="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-zinc-900/20 transition-all hover:scale-105 active:scale-95"
				>
					Explore Dashboard
				</button>
			</div>
		</div>

		<footer class="mt-20 border-t border-zinc-100 pt-8 text-center text-sm text-zinc-500">
			<p>&copy; 2026 GridSense. All rights reserved.</p>
		</footer>
	</section>

	<AuthDrawer bind:isOpen={showLoginModal} onClose={() => (showLoginModal = false)} />
</main>

<style>
	:global(html) {
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-behavior: smooth;
	}
	:global(body) {
		margin: 0;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	:global(body::-webkit-scrollbar) {
		display: none;
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
