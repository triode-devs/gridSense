<script>
	let { children } = $props();
	import {
		LayoutDashboard,
		Activity,
		AlertTriangle,
		Calendar,
		Users,
		Briefcase,
		Menu,
		X,
		LogOut,
		Hexagon,
		Zap,
		Network,
		CreditCard,
		FileText,
		Banknote
	} from 'lucide-svelte';
	import { page } from '$app/stores';

	let isSidebarOpen = $state(false);

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/transformers', label: 'Transformers', icon: Zap },
		// { href: '/live-monitoring', label: 'Live Monitoring', icon: Activity },
		{ href: '/faults', label: 'Faults', icon: AlertTriangle },
		// { href: '/shutdowns', label: 'Shutdowns', icon: Calendar },
		{ href: '/topology', label: 'Topology', icon: Hexagon },
		{ href: '/nodes', label: 'Grid Nodes', icon: Network },
		{ href: '/consumer', label: 'Consumers', icon: Users },
		{ href: '/staff', label: 'Staff/Users', icon: Briefcase },
		{ href: '/billing', label: 'Billing', icon: Banknote },
		{ href: '/tariffs', label: 'Tariffs', icon: CreditCard },
		{ href: '/system', label: 'System', icon: LayoutDashboard }
	];

	function handleLogout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/';
	}
</script>

<div class="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
	<!-- Sidebar -->
	<!-- Mobile Overlay -->
	{#if isSidebarOpen}
		<button
			onclick={() => (isSidebarOpen = false)}
			class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
			aria-label="Close sidebar"
		></button>
	{/if}

	<aside
		class={`fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-950 text-white transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
			isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
		} flex flex-col border-r border-slate-800 shadow-2xl`}
	>
		<!-- Logo Section -->
		<div class="flex h-20 items-center gap-3 border-b border-slate-900 bg-slate-950 px-8">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20"
			>
				<Hexagon class="h-5 w-5 text-white" fill="currentColor" />
			</div>
			<div class="flex flex-col">
				<h1 class="text-lg font-bold tracking-wider text-white">GridSense</h1>
				<span class="text-[10px] font-bold tracking-widest text-blue-500 uppercase"
					>Admin Portal</span
				>
			</div>
			<button
				class="ml-auto text-slate-400 hover:text-white lg:hidden"
				onclick={() => (isSidebarOpen = false)}
			>
				<X class="h-6 w-6" />
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-1 overflow-y-auto px-4 py-8">
			<div class="mb-4 px-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
				Main Menu
			</div>
			{#each navItems as item}
				{@const isActive = $page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class={`group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 
                    ${
											isActive
												? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' // Active State
												: 'text-slate-400 hover:bg-slate-900 hover:text-white' // Inactive State
										}`}
				>
					<!-- Active Indicator Bar -->
					{#if isActive}
						<div class="absolute left-0 h-8 w-1 rounded-r-full bg-white/20"></div>
					{/if}

					<item.icon
						class={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
					/>
					<span>{item.label}</span>

					{#if isActive}
						<div class="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm"></div>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Footer User Profile -->
		<div class="border-t border-slate-900 bg-slate-950 p-4">
			<div
				class="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3 transition-colors hover:bg-slate-900"
			>
				<div class="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-700">
					<img
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
						alt="Admin"
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="flex flex-1 flex-col overflow-hidden">
					<span class="truncate text-sm font-bold text-white">System Admin</span>
					<span class="truncate text-xs text-slate-500">admin@gridsense.com</span>
				</div>
				<button
					onclick={handleLogout}
					class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
				>
					<LogOut class="h-5 w-5" />
				</button>
			</div>
		</div>
	</aside>

	<!-- Content Area -->
	<div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
		<!-- Mobile Header -->
		<header
			class="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md lg:hidden"
		>
			<div class="flex items-center gap-3">
				<button
					class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
					onclick={() => (isSidebarOpen = true)}
				>
					<Menu class="h-6 w-6" />
				</button>
				<span class="font-bold text-slate-900">GridSense Admin</span>
			</div>
			<div class="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
				<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Profile" />
			</div>
		</header>

		<!-- Main View -->
		<main class="flex-1 overflow-y-auto scroll-smooth">
			<div class="animate-in fade-in zoom-in-95 mx-auto max-w-7xl p-4 duration-300 lg:p-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>
