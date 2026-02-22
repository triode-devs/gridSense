<script>
	import { X, User, Lock, ArrowRight, Loader, Eye, EyeOff } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { API_BASE_URL } from '$lib/index.js';

	export let isOpen = false;
	export let onClose = () => {};

	let activeTab = 'login'; // 'login' | 'register'
	let isLoading = false;
	let role = 'user'; // 'user' | 'admin'

	// Form States
	let username = '';
	let password = '';
	let loginError = '';
	let showPassword = false;

	async function handleSubmit() {
		isLoading = true;
		loginError = '';

		try {
			const endpoint = activeTab === 'register' ? '/auth/register' : '/auth/login';

			// Use the API_BASE_URL for authentication
			const res = await fetch(`${API_BASE_URL}${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username,
					userid: username, // Alias for systems using userid
					password,
					role, // Include role in case the backend needs it to distinguish
					// Additional fields for registration (if backend supports)
					full_name: activeTab === 'register' ? username : undefined
				})
			});

			const data = await res.json();

			if (data.success) {
				// For registration, we might get a token directly or need to login
				// Assuming standard flow: register returns token or success message
				if (activeTab === 'register') {
					// Auto-login or just notify
					if (data.data && data.data.token) {
						localStorage.setItem('token', data.data.token);
						localStorage.setItem('user', JSON.stringify(data.data.user));
						window.location.href = data.data.user.role === 'admin' ? '/dashboard' : '/my-home';
					} else {
						// Fallback to login tab if no token returned
						activeTab = 'login';
						loginError = 'Registration successful! Please login.';
					}
				} else {
					localStorage.setItem('token', data.data.token);
					localStorage.setItem('user', JSON.stringify(data.data.user));

					// Redirect based on role from response, fallback to local role state if needed
					if (data.data.user.role === 'admin' || data.data.user.role === 'super_admin') {
						window.location.href = '/dashboard';
					} else {
						window.location.href = '/my-home';
					}
				}
			} else {
				if (res.status === 401) {
					loginError = 'Invalid credentials. Please check your username and password.';
				} else {
					loginError = data.message || `Error: ${res.status}`;
				}
			}
		} catch (e) {
			loginError = 'Network error. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
			onclick={onClose}
			in:fade
			role="presentation"
		></div>

		<!-- Drawer/Modal -->
		<div
			class="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
			in:fly={{ y: 300, duration: 400 }}
		>
			<div
				class="absolute top-4 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-slate-200 sm:hidden"
			></div>

			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-slate-900">
					{activeTab === 'login' ? 'Welcome Back' : 'Join GridSense'}
				</h2>
				<button
					onclick={onClose}
					class="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Tabs -->
			<div class="mb-6 flex rounded-xl bg-slate-100 p-1">
				<button
					class={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
					onclick={() => (activeTab = 'login')}
				>
					Login
				</button>
				<button
					class={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
					onclick={() => (activeTab = 'register')}
				>
					Register
				</button>
			</div>

			<!-- Role Selector -->
			<div class="mb-6 flex gap-2">
				<button
					type="button"
					onclick={() => (role = 'user')}
					class={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${role === 'user' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
				>
					Consumer
				</button>
				<button
					type="button"
					onclick={() => (role = 'admin')}
					class={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${role === 'admin' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
				>
					Administrator
				</button>
			</div>

			{#if loginError}
				<div class="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">
					{loginError}
				</div>
			{/if}

			<!-- Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				{#if activeTab === 'register'}
					<div class="space-y-1">
						<label class="text-xs font-bold text-slate-500 uppercase">Full Name</label>
						<div class="relative">
							<User class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
							<input
								type="text"
								placeholder="John Doe"
								class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-medium outline-none focus:border-blue-500 focus:bg-white"
							/>
						</div>
					</div>
				{/if}

				<div class="space-y-1">
					<label class="text-xs font-bold text-slate-500 uppercase">Username / ID</label>
					<div class="relative">
						<User class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
						<input
							type="text"
							bind:value={username}
							placeholder="Enter your username"
							class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-medium outline-none focus:border-blue-500 focus:bg-white"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<label class="text-xs font-bold text-slate-500 uppercase">Password</label>
					<div class="relative">
						<Lock class="absolute top-3 left-3 h-5 w-5 text-slate-400" />
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••"
							class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-12 pl-10 font-medium outline-none focus:border-blue-500 focus:bg-white"
						/>
						<button
							type="button"
							class="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
							onclick={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-70"
				>
					{#if isLoading}
						<Loader class="h-5 w-5 animate-spin" />
						Processing...
					{:else}
						{activeTab === 'login' ? 'Login' : 'Create Account'} <ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>

			<p class="mt-6 text-center text-xs font-medium text-slate-500">
				By continuing, you agree to our <a href="#" class="text-blue-600 hover:underline"
					>Terms of Service</a
				>.
				<br />
				<span class="text-slate-400">Default: admin/admin or user/user</span>
			</p>
		</div>
	</div>
{/if}
