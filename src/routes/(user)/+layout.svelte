<script>
	let { children } = $props();
	import { Home, BarChart2, FileText, ZapOff, LifeBuoy, Zap, LogOut } from 'lucide-svelte';
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/my-home', label: 'Home', icon: Home },
		{ href: '/usage', label: 'Usage', icon: BarChart2 },
		{ href: '/billing', label: 'Bills', icon: FileText },
		{ href: '/outages', label: 'Outages', icon: ZapOff },
		{ href: '/support', label: 'Support', icon: LifeBuoy }
	];
</script>

<div class="flex min-h-screen bg-slate-50 font-sans">
	<!-- Desktop Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-slate-200 bg-white shadow-xl lg:flex"
	>
		<div class="flex h-20 items-center gap-3 border-b border-slate-100 px-8">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20"
			>
				<Zap class="h-5 w-5 text-white" fill="currentColor" />
			</div>
			<div class="flex flex-col">
				<h1 class="text-lg font-bold tracking-wider text-slate-900">GridSense</h1>
				<span class="text-[10px] font-bold tracking-widest text-emerald-500 uppercase"
					>Consumer</span
				>
			</div>
		</div>

		<nav class="flex-1 space-y-2 px-4 py-8">
			{#each navItems as item}
				{@const isActive = $page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 
                    ${
											isActive
												? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-200'
												: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
										}`}
				>
					<item.icon
						class={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
					/>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="border-t border-slate-100 p-4">
			<div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
				<div class="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
					<img
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
						alt="User"
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="flex flex-1 flex-col overflow-hidden">
					<span class="truncate text-sm font-bold text-slate-900">John Doe</span>
					<span class="truncate text-xs text-slate-500">Consumer ID: 8829</span>
				</div>
				<button class="text-slate-400 transition-colors hover:text-red-500">
					<LogOut class="h-5 w-5" />
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto pb-24 lg:pb-0 lg:pl-72">
		<div class="animate-in fade-in zoom-in-95 mx-auto max-w-5xl p-4 duration-300 md:p-8">
			{@render children()}
		</div>
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav
		class="fixed right-4 bottom-4 left-4 z-50 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-2xl shadow-slate-200/50 backdrop-blur-xl lg:hidden"
	>
		<div class="flex items-center justify-around">
			{#each navItems as item}
				{@const isActive = $page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class={`relative flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-300 
                    ${isActive ? 'scale-105 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
				>
					{#if isActive}
						<div class="absolute -top-1 h-1 w-8 rounded-full bg-emerald-500 shadow-sm"></div>
					{/if}
					<item.icon class={`h-6 w-6 ${isActive ? 'fill-emerald-100' : ''}`} />
					<span class="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
