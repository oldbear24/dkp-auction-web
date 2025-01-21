<script lang="ts">
  export const ssr = false;

  import pb from '$lib/pocketbase';
  import { writable } from 'svelte/store';
  import { onDestroy, onMount } from 'svelte';
  import { showToast,user } from '$lib/stores/store';
  interface AuctionItem {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    bid: number;
    state: string;
    endTime: string; // Assuming endTime is a string in ISO format
    winner:string
  }

  export let item: AuctionItem;
  let showModal = writable(false);
  let bidAmount = writable(item.bid);
  let countdown = writable({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  function openModal() {
    if (item.state !== 'ongoing') return;
    showModal.set(true);
  }

  function closeModal() {
    showModal.set(false);
  }

  async function confirmBid() {
    try {
      console.debug('Placing bid:', item);
      const response = await pb.send(`/api/bid/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: $bidAmount })
      });
      // Update the item with the new bid amount
      //item.bid = $bidAmount;
      showToast('Bid placed successfully!', 'success');
    } catch (error:any) {
      showToast(error.message, 'error');
    } finally {
      closeModal();
    }
  }

  function updateCountdown() {
    const endTime = new Date(item.endTime).getTime();
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
      countdown.set({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const years = Math.floor(distance / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((distance % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((distance % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdown.set({ years, months, days, hours, minutes, seconds });
  }

  onMount(() => {
    console.debug('Setting interval');
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => {
      console.debug('Clearing interval');
      clearInterval(interval);}
  });

  onDestroy( () => {
        console.log("Date Component removed")
    });
</script>

<div class="card bg-base-200 shadow-lg {item.winner==$user?.id?'border border-accent':''}	">
  <figure>
    <img src={item.imageUrl} alt={item.name} class="w-full h-48 object-cover rounded-lg" />
  </figure>
  <div class="card-body">
    <h2 class="card-title">{item.name}</h2>
    <p>{item.description}</p>
    <p>Current Bid: ${item.bid}</p>
    <div class="flex space-x-2">
      {#if $countdown.years > 0}
        <div class="countdown">
          <span style="--value:{$countdown.years};"></span>y
        </div>
      {/if}
      {#if $countdown.months > 0}
        <div class="countdown">
          <span style="--value:{$countdown.months};"></span>m
        </div>
      {/if}
      {#if $countdown.days > 0}
        <div class="countdown">
          <span style="--value:{$countdown.days};"></span>d
        </div>
      {/if}
      {#if $countdown.hours > 0}
        <div class="countdown">
          <span style="--value:{$countdown.hours};"></span>h
        </div>
      {/if}
      {#if $countdown.minutes > 0}
        <div class="countdown">
          <span style="--value:{$countdown.minutes};"></span>m
        </div>
      {/if}
      {#if $countdown.seconds > 0}
        <div class="countdown">
          <span style="--value:{$countdown.seconds};"></span>s
        </div>
      {/if}
    </div>
    
    {#if item.state === 'ongoing'}
      <button class="btn btn-primary" on:click={openModal}>Place Bid</button>
    {:else if item.state === 'pending'}
      <div class="text-warning">Auction not started</div>
      <button class="btn btn-disabled">Waiting to Start</button>
    {:else}
      <div class="text-error">Auction ended</div>
      <button class="btn btn-disabled">Completed</button>
    {/if}
  </div>
</div>

{#if $showModal && item.state === 'ongoing'}
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
{/if}