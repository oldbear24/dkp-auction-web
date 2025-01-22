<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import pb from '$lib/pocketbase';
	import type { RecordModel } from 'pocketbase';
	import AuthGuard from '../../components/AuthGuard.svelte';

	let users = writable<RecordModel[]>([]);
	let searchQuery = writable('');
	let verifiedFilter = writable('');
	let selectedUsers = writable<string[]>([]);
	let showDialog = writable(false);
	let tokensToAdd = writable(0);
	$: allSelected = $users.length === $selectedUsers.length;
	const userFields = 'id,name,avatar,tokens,validated,collectionId,discordId';
	async function fetchUsers() {
		try {
			let query = '';
			if($searchQuery!=''){
				query+=`name ~ '${$searchQuery}'`
			}
			if (query != '' && $verifiedFilter!='') {
				query += ' && ';
			}
			if($verifiedFilter!='')
			{
				query+='validated = '+ $verifiedFilter
			}
			console.debug(query)
			selectedUsers.set([]);
			const response = await pb.collection('users').getFullList({
				filter: query ? `${query}` : '',
				sort: '+name:lower',
				fields: userFields,
				requestKey:"get_users_management"
				
			});
			users.set(response);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	}

	onMount(() => {
		pb.realtime.subscribe('manage_users_update', userUpdateCallback);
		fetchUsers();
	});
	onDestroy(() => {
		pb.realtime.unsubscribe('manage_users_update');
	});

	let updateQueue: string[] = [];
	function userUpdateCallback(data: any) {
		updateQueue.push(data.userId);
	}

	function updateUserInTableWorker() {
		if (updateQueue.length > 0) {
			let id = updateQueue.shift();
			if (id) {
				console.debug('User update', id, updateQueue.length),
					pb
						.collection('users')
						.getOne(id, { fields: userFields })
						.then((rec) => {
							users.update((currentItems) => {
								return currentItems.map((item) =>
									item.id === rec.id ? { ...item, ...rec } : item
								);
							});
						});
			}
		}
	}
	setInterval(updateUserInTableWorker, 1);

	searchQuery.subscribe((query) => {
		fetchUsers();
	});
	verifiedFilter.subscribe((filter) => {
		fetchUsers();
	});
	function toggleAllCheckboxes() {
		console.debug('All checked:', allSelected);

		if (allSelected) {
			selectedUsers.set([]);
		} else {
			selectedUsers.set([...$users.map((user) => user.id)]);
		}

		console.debug('Selected users:', $selectedUsers);
	}

	async function changeValidation(userId: string, validated: boolean) {
		pb.send(`/api/set-validated/${userId}`, {
			method: 'POST',
			body: JSON.stringify({ validated: !validated })
		}).catch((err) => {
			console.error(err);
		});
	}

	function openDialog() {
		if ($selectedUsers.length > 0) {
			showDialog.set(true);
		}
	}

	function closeDialog() {
		showDialog.set(false);
		tokensToAdd.set(0);
	}

	async function addTokens() {
		try {
			const userIds = $selectedUsers;
			const newTokens = $tokensToAdd;
			await pb.send('/api/change-tokens', {
				method: 'POST',
				body: JSON.stringify({ userIds: userIds, amount: newTokens })
			});

			closeDialog();
		} catch (error) {
			console.error('Error adding tokens:', error);
		}
	}

	function openFileDialog() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv';
		input.onchange = async (event: Event) => {
			const target = event.target as HTMLInputElement;
			if (target.files && target.files.length > 0) {
				const file = target.files[0];
				file.text().then(async (text) => {
					const userIds = text.split("\n").map(id => id.trim());	
					console.log(userIds)			
					selectedUsers.set($users.map(user => user.id));
					selectedUsers.set($users.filter(user => userIds.includes(user.discordId)).map(user => user.id));
					console.log($selectedUsers)
				});
			}
		};
		input.click();
	}

	function filterVerified(filter: string) {
		verifiedFilter.set(filter);
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
	<div class="mb-4 flex space-x-2">
		<button class="btn btn-primary" on:click={openDialog} disabled={$selectedUsers.length === 0}>
			Add Tokens to Selected Users
		</button>
		<button class="btn btn-secondary" on:click={openFileDialog}>
			Import users
		</button>
	</div>
	<div class="filter">
		<input
			class="btn filter-reset"
			on:click={() => filterVerified('')}
			type="radio"
			name="metaframeworks"
			aria-label="All"
		/>
		<input
			class="btn"
			type="radio"
			on:click={() => filterVerified('true')}
			name="metaframeworks"
			aria-label="Validated"
		/>
		<input
			class="btn"
			type="radio"
			on:click={() => filterVerified('false')}
			name="metaframeworks"
			aria-label="Unvalidated"
		/>
	</div>
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
					<th>Validated</th>
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
						<td><div class="flex items-center gap-3">
								<div class="avatar avatar-placeholder">
									<div class="w-12 rounded-full ring-primary ring-offset-base-100 ring ring-offset-1">
										{#if user.avatar}
										<img
											src={pb.files.getURL(user, user.avatar, { thumb: '100x100' })}
											alt="{user.name} profile image"
										/>
										{:else}
										<span class="text-xl">{user.name.substring(0,2)}</span>
										{/if}
									</div>
								</div>
								<div>
									<div class="font-bold">{user.name}</div>
								</div>
							
							</div>
						</td>
						<td>{user.tokens}</td>
						<td>
							<input
								type="checkbox"
								on:click={() => changeValidation(user.id, user.validated)}
								bind:checked={user.validated}
								class="toggle text-error checked:text-success"
							/>
						</td>
					</tr>
				{/each}
			</tbody>
			<!-- foot -->
			<tfoot> </tfoot>
		</table>
	</div>
</div>

{#if $showDialog}
	<div class="modal modal-open">
		<div class=" rounded p-6 shadow-lg modal-box">
			<h2 class="mb-4 text-xl font-bold">Add Tokens</h2>
			<p>Selected Users: {$selectedUsers.length}</p>
			<label class="mb-2 block" for="tokensToAdd">Tokens to Add</label>
			<input
				id="tokensToAdd"
				type="number"
				class="input input-bordered mb-4 w-full"
				bind:value={$tokensToAdd}
			/>
			<div class="flex justify-end">
				<button class="btn btn-secondary mr-2" on:click={closeDialog}>Cancel</button>
				<button class="btn btn-primary" on:click={addTokens}>Submit</button>
			</div>
		</div>
	</div>
{/if}
<AuthGuard requiredRole="manager" />