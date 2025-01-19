<script lang="ts">

  import { user } from '$lib/stores/userStore';
  import { onMount } from 'svelte';
  import pb, { subscribeToUserUpdate,unsubscribeFromUserUpdates } from '$lib/pocketbase';
  async function loginWithDiscord() {
    try {     
      unsubscribeFromUserUpdates();
      const authData = await pb.collection('users').authWithOAuth2({ provider: 'discord' });
      user.set(authData.record);
       await subscribeToUserUpdate(authData.record.id, (updatedUser) => {
        user.set(updatedUser);
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  function logout() {
    pb.authStore.clear();
    user.set(null);
    unsubscribeFromUserUpdates();
  }

  onMount(async () => {
    const currentUser = pb.authStore.record;
    if (currentUser) {
      console.debug('User already logged in:', currentUser);
      
      user.set(currentUser);
       await subscribeToUserUpdate(currentUser.id, (updatedUser) => {
        user.set(updatedUser);
      });
    }
  });
</script>

<nav class="navbar bg-base-100">
  <div class="flex-1">
    <a class="btn btn-ghost normal-case text-xl" href="/">Auction House</a>
  </div>
  {#if $user}
  <div data-tip="Your current tokens and usable tokens." class="tooltip tooltip-bottom tooltip-info ml-4">
    <span>Tokens: {$user.tokens} ({$user.tokens - $user.reservedTokens})</span>
  </div>
  {/if}

  <div class="flex-none">
    {#if $user}
     <!--  <div class="ml-4">
        <span>Tokens: {$user.tokens} ({$user.tokens - $user.reservedTokens})</span>
      </div> -->
      <div class="dropdown dropdown-end">
        <button class="btn btn-ghost btn-circle avatar" aria-label="User menu">
          <div class="w-10 rounded-full">
            <img src="{pb.files.getURL($user, $user.avatar, {'thumb': '100x100'})}" alt="User Avatar" />
          </div>
        </button>
        <ul class="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52" style="z-index: 100;">
         <!-- <li><a href="/profile">Profile</a></li>         -->  
          {#if $user.role.includes('manager')}
          <li><a href="/create-auction">Create Auction</a></li> <!-- New link added here -->
          <li><a href="/manage-users">Manage users</a></li> <!-- New link added here -->
          <li><a href="/auction-results">Auction results</a></li> <!-- New link added here -->
          {/if}
          <li><button type="button" on:click={logout} aria-label="Logout">Logout</button></li>
        </ul>
      </div>
    {:else}
      <button class="btn btn-primary" on:click={loginWithDiscord}>Login with Discord</button>
    {/if}
  </div>
</nav>
