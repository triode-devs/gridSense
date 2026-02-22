<script>
	import {
		LifeBuoy,
		Send,
		MessageSquare,
		PhoneCall,
		Mail,
		Globe,
		CheckCircle2,
		X,
		ArrowRight
	} from 'lucide-svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let formState = $state({
		subject: '',
		message: '',
		category: 'outage'
	});
	let isSubmitted = $state(false);

	function handleSubmit(e) {
		e.preventDefault();
		// In a real app, send to API
		isSubmitted = true;
		setTimeout(() => {
			isSubmitted = false;
			formState = { subject: '', message: '', category: 'outage' };
		}, 3000);
	}
</script>

<svelte:head>
	<title>Support Center | GridSense</title>
	<meta
		name="description"
		content="Get help with your electricity connection or billing. Contact our support team via phone, email, or live chat."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="text-center">
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-sm"
		>
			<LifeBuoy class="h-8 w-8" />
		</div>
		<h1 class="text-3xl font-bold text-slate-900">Support Center</h1>
		<p class="mx-auto mt-2 max-w-sm font-medium text-slate-500">
			Need help with your connection or billing? Our team is available 24/7.
		</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Contact Options -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-lg"
			>
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
					>
						<PhoneCall class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Toll-Free Helpline</h3>
						<p class="text-xs font-bold tracking-wider text-emerald-600">1800-456-7890</p>
					</div>
				</div>
			</div>

			<div
				class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-lg"
			>
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
					>
						<Mail class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Email Support</h3>
						<p class="text-xs font-bold tracking-wider text-blue-600">help@gridsense.io</p>
					</div>
				</div>
			</div>

			<div
				class="rounded-3xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-lg"
			>
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"
					>
						<Globe class="h-6 w-6" />
					</div>
					<div>
						<h3 class="font-bold text-slate-900">Global Website</h3>
						<p class="text-xs font-bold tracking-wider text-purple-600">www.gridsense.io</p>
					</div>
				</div>
			</div>

			<div class="p-6">
				<h4 class="mb-4 px-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
					Social Channels
				</h4>
				<div class="flex gap-3">
					<button
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-900 hover:text-white"
						><MessageSquare class="h-5 w-5" /></button
					>
					<button
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-900 hover:text-white"
						><Globe class="h-5 w-5" /></button
					>
				</div>
			</div>
		</div>

		<!-- Support Form -->
		<div class="relative lg:col-span-3">
			<div
				class="overflow-hidden rounded-[2.5rem] border border-white bg-white p-8 shadow-2xl transition-all md:p-12"
			>
				<div class="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl"></div>

				<div class="relative">
					{#if isSubmitted}
						<div class="flex flex-col items-center justify-center py-12 text-center" in:scale>
							<div
								class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
							>
								<CheckCircle2 class="h-10 w-10" />
							</div>
							<h3 class="text-2xl font-bold text-slate-900">Message Received!</h3>
							<p class="mt-2 font-medium text-slate-500">
								Ticket #GS-{Math.floor(Math.random() * 90000 + 10000)} created.
							</p>
							<button
								onclick={() => (isSubmitted = false)}
								class="mt-8 flex items-center gap-2 font-bold text-blue-600"
							>
								Send Another Message <ArrowRight class="h-4 w-4" />
							</button>
						</div>
					{:else}
						<h3 class="mb-6 text-xl font-bold text-slate-900">Send an Inquiry</h3>
						<form onsubmit={handleSubmit} class="space-y-6">
							<div class="space-y-2">
								<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Category</label>
								<div class="flex flex-wrap gap-2">
									{#each ['outage', 'billing', 'technical', 'other'] as cat}
										<button
											type="button"
											onclick={() => (formState.category = cat)}
											class={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${formState.category === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
										>
											{cat.charAt(0).toUpperCase() + cat.slice(1)}
										</button>
									{/each}
								</div>
							</div>

							<div class="space-y-2">
								<label class="px-1 text-[10px] font-bold text-slate-500 uppercase">Subject</label>
								<input
									type="text"
									bind:value={formState.subject}
									placeholder="e.g. Voltage fluctuation in Sector 4"
									required
									class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>

							<div class="space-y-2">
								<label class="px-1 text-[10px] font-bold text-slate-500 uppercase"
									>Message Details</label
								>
								<textarea
									rows="5"
									bind:value={formState.message}
									placeholder="Describe your issue in detail..."
									required
									class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
								></textarea>
							</div>

							<button
								type="submit"
								class="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-5 font-bold text-white shadow-xl shadow-blue-500/30 transition-transform hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
							>
								Submit Request <Send class="h-5 w-5" />
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
