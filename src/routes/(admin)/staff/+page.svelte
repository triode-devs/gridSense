<script>
	import { API_BASE_URL } from '$lib/index.js';
	import {
		UserPlus,
		User,
		Shield,
		Mail,
		Loader,
		Search,
		Settings,
		X,
		Plus,
		Key
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let users = $state([]);
	let isLoading = $state(false);
	let searchTerm = $state('');

	let showAddModal = $state(false);
	let newUser = $state({
		username: '',
		password: '',
		role: 'staff'
	});

	async function fetchUsers() {
		isLoading = true;
		try {
			const res = await fetch(`${API_BASE_URL}/admin/users`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await res.json();
			if (data.success) {
				users = data.data;
			}
		} catch (e) {
			console.error('Failed to fetch users');
		} finally {
			isLoading = false;
		}
	}

	async function createUser() {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(newUser)
			});
			const data = await res.json();
			if (data.success) {
				showAddModal = false;
				fetchUsers();
				newUser = { username: '', password: '', role: 'staff' };
			}
		} catch (e) {
			console.error('Create user failed');
		}
	}

	const filteredUsers = $derived(
		users.filter(
			(u) =>
				u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
				u.role.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(fetchUsers);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">User Management</h1>
			<p class="text-slate-500">Manage administrative access and roles.</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-700"
		>
			<UserPlus class="h-4 w-4" /> Add User
		</button>
	</div>

	<div
		class="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 p-1 shadow-sm backdrop-blur-md"
	>
		<div class="relative flex-1">
			<Search class="absolute top-3 left-4 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by username or role..."
				bind:value={searchTerm}
				class="h-11 w-full rounded-xl bg-white pr-4 pl-12 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if isLoading}
			<div class="col-span-full py-20 text-center">
				<Loader class="mx-auto h-8 w-8 animate-spin text-blue-500" />
			</div>
		{:else if filteredUsers.length === 0}
			<div class="col-span-full py-20 text-center text-slate-500">No users found.</div>
		{:else}
			{#each filteredUsers as user}
				<div
					class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600"
							>
								<User class="h-6 w-6" />
							</div>
							<div>
								<h3 class="font-bold text-slate-900">{user.username}</h3>
								<div
									class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-600 uppercase"
								>
									<Shield class="h-3 w-3" />
									{user.role}
								</div>
							</div>
						</div>
						<button class="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
							<Settings class="h-4 w-4" />
						</button>
					</div>

					<div class="mt-6 flex items-center gap-3 border-t border-slate-50 pt-6">
						<div class="flex flex-1 items-center gap-2 text-xs text-slate-500">
							<Mail class="h-3.5 w-3.5" />
							<span>{user.userid}</span>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if showAddModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
			in:fade
		>
			<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" in:scale={{ start: 0.95 }}>
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
						>
							<UserPlus class="h-5 w-5" />
						</div>
						<div>
							<h4 class="font-bold text-slate-900">Create New User</h4>
							<p class="text-xs text-slate-500">Add an administrator or staff member.</p>
						</div>
					</div>
					<button
						onclick={() => (showAddModal = false)}
						class="text-slate-400 hover:text-slate-600"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Username</label>
						<input
							type="text"
							bind:value={newUser.username}
							placeholder="admin_john"
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Password</label>
						<div class="relative">
							<Key class="absolute top-3.5 left-4 h-4 w-4 text-slate-400" />
							<input
								type="password"
								bind:value={newUser.password}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Role</label>
						<select
							bind:value={newUser.role}
							class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="admin">Administrator</option>
							<option value="staff">Staff Member</option>
							<option value="technician">Technician</option>
						</select>
					</div>

					<button
						onclick={createUser}
						disabled={!newUser.username || !newUser.password}
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
					>
						<Plus class="h-5 w-5" /> Create User
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
