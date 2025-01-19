<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import pb from '$lib/pocketbase';
	import type { RecordModel } from 'pocketbase';
	import { user } from '$lib/stores/userStore';

	let users = writable<RecordModel[]>([]);
	let currentPage = writable(1);
	let searchQuery = writable('');
	let selectedUsers = writable<string[]>([]);
	$: allSelected = $users.length === $selectedUsers.length;
	async function fetchUsers(query: string = '') {
		try {
			const response = await pb.collection('users').getFullList({
				filter: query ? `name ~ "${query}"` : '',
				sort: '+name:lower'
			});
			users.set(response);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	}

	onMount(() => {
		fetchUsers($searchQuery);
	});

	currentPage.subscribe((page) => {
		fetchUsers($searchQuery);
	});

	searchQuery.subscribe((query) => {
		fetchUsers(query);
	});

	function editUser(user: any) {
		// Implement user editing logic here
		console.log('Edit user:', user);
	}

	function toggleAllCheckboxes() {
		console.debug('All checked:', allSelected);

		if (allSelected) {
			selectedUsers.set([]);
		} else {
			selectedUsers.set([...$users.map((user) => user.id)]);
		}

		console.debug('Selected users:', $selectedUsers);
	}
</script>

<div class="container mx-auto">
	<h1 class="mb-4 text-2xl font-bold">Manage Users</h1>
	<input
		type="text"
		placeholder="Search by name"
		class="input input-bordered mb-4 w-full"
		bind:value={$searchQuery}
	/>
	<div class="h-250 overflow-x-auto">
		<table class="table-pin-cols table-pin-rows table">
			<!-- head -->
			<thead>
				<tr>
					<th>
						<label>
							<input
								type="checkbox"
								class="checkbox"
                                bind:checked={allSelected}
								on:click={toggleAllCheckboxes}
							/>
						</label>
					</th>
					<th>Name</th>
					<th>Tokens</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each $users as user}
					<tr>
						<th>
							<label>
								<input
									type="checkbox"
									bind:group={$selectedUsers}
									name={user.id}
									value={user.id}
									class="checkbox user-checkbox"
								/>
							</label>
						</th>
						<td>
							<div class="flex items-center gap-3">
								<div class="avatar">
									<div class="mask mask-squircle h-12 w-12">
										<img
											src={pb.files.getURL(user, user.avatar, { thumb: '100x100' })}
											alt="{user.name} profile image"
										/>
									</div>
								</div>
								<div>
									<div class="font-bold">{user.name}</div>
								</div>
							</div>
						</td>
						<td>{user.tokens}</td>
						<td>
							<button class="btn btn-sm btn-primary" on:click={() => editUser(user)}>Edit</button>
						</td>
					</tr>
				{/each}
			</tbody>
			<!-- foot -->
			<tfoot> </tfoot>
		</table>
	</div>
</div>
