<script lang="ts">
	import pb from '$lib/pocketbase';
	import { user } from '$lib/stores/store';
	import { writable } from 'svelte/store';
	import AuthGuard from '../../components/AuthGuard.svelte';
    let deleteToggle = false
    function deleteUser(){

     //   pb.collection("users").delete($user?.id)
    }
const openModal= writable(false)
const enableDelete= writable(false)

function getHumanReadableRole(role: string)  {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
      case 'manager':
      return 'Manager';
      case 'lootCouncil':
      return 'Loot council';
    default:
      return role;
  }
}
</script>


  <div class="flex w-full flex-col">
    <div class="stats stats-vertical lg:stats-horizontal shadow">
        <div class="stat">
            <div class="flex items-center gap-3">
                <div class="avatar avatar-placeholder">
                    <div class="w-18 rounded-full ring-primary ring-offset-base-100 ring ring-offset-1">
                        {#if $user?.avatar}
                        <img
                            src={pb.files.getURL($user, $user?.avatar)}
                            alt="{$user?.name} profile image"
                        />
                        {:else}
                        <span class="text-xl">{$user?.name.substring(0,2)}</span>
                        {/if}
                    </div>
                </div>                
            </div>
        </div>
      
        <div class="stat">
          <div class="stat-title">Username</div>
          <div class="stat-value">{$user?.name}</div>
        </div>
      
        <div class="stat">
          <div class="stat-title">Roles</div>
          <div class="text-info flex flex-wrap">{#each $user?.role as r}
            <div class="badge badge-outline badge-accent m-1">{getHumanReadableRole(r)}</div>
            {/each}
          </div>
        </div>
      </div>   
       <div class="divider"></div>
      <div class="stats stats-vertical lg:stats-horizontal shadow">
        <div class="stat">
          <div class="stat-title">Tokens</div>
          <div class="stat-value text-accent">{$user?.tokens}</div>
        </div>
      
        <div class="stat">
          <div class="stat-title">Reserved tokens</div>
          <div class="stat-value text-error">{$user?.reservedTokens}</div>
        </div>
      
        <div class="stat">
          <div class="stat-title">Usable tokens</div>
          <div class="stat-value text-info">{$user?.tokens-$user?.reservedTokens}</div>
        </div>
      </div> 
      <div class="divider"></div>
      <div>      <input type="checkbox" class="toggle toggle-error" bind:checked={deleteToggle} />
      <button disabled={!deleteToggle}  class="btn btn-error w-45">Delete my account</button>
    </div> 
    </div>
    <!--  {#if $showModal && item.state === 'ongoing'}
     <div class="modal modal-open">
       <div class="modal-box">
         <h2 class="card-title">{item.name}</h2>
         <figure>
           <img src={item.imageUrl} alt={item.name} class="w-full h-48 object-cover rounded-lg" />
         </figure>
         <p>{item.description}</p>
         <p>Current Bid: ${item.bid}</p>
         <div class="form-control">
           <label class="label" for="bidAmount">
             <span class="label-text">Your Bid Amount</span>
           </label>
           <input type="number" id="bidAmount" class="input input-bordered" bind:value={$bidAmount} min={item.bid} />
         </div>
         <div class="modal-action">
           <button class="btn btn-primary" on:click={confirmBid}>Confirm Bid</button>
           <button class="btn" on:click={closeModal}>Close</button>
         </div>
       </div>
     </div>
   {/if} -->
<AuthGuard />