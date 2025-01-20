<script lang="ts">
  import type { RecordModel } from 'pocketbase';
  import pb, { subscribeToAuctionUpdate, unsubscribeFromAuctionUpdates } from '../lib/pocketbase';
  import AuctionItem from '../components/AuctionItem.svelte';
  import { user } from '$lib/stores/store';
  let items: { id: string; name: string; bid: number; imageUrl: string; description: string; state: string; endTime: string }[] = [];
  let currentPage = 1;
  const itemsPerPage = 9;
  let totalPages = 1;
  let searchQuery = '';
  async function fetchItems(page: number) {
    let filterString = '';
    if (searchQuery != '') {
      filterString = `itemName ~ '${searchQuery}%'`;
    }
    const records = await pb.collection('auctions').getList(page, itemsPerPage, { sort: "-endTime", filter: filterString });
    items = records.items.map(record => ({
      id: record.id,
      name: record.itemName,
      bid: record.currentBid,
      imageUrl: pb.files.getURL(record, record.mainImage, { 'thumb': '500x200' }) || '/no_image_placeholder_dark.png',
      description: record.description,
      state: record.state,
      endTime: record.endTime
    }));
    totalPages = Math.ceil(records.totalItems / itemsPerPage);
  }

  function updateItem(record: RecordModel) {
    const index = items.findIndex(item => item.id === record.id);
    console.debug('Updating item:', record.id, index);

    if (index !== -1) {
      items[index].bid = record.currentBid;
      let imgUrl = pb.files.getURL(record, record.mainImage, { 'thumb': '500x200' });
      if (!imgUrl) {
        imgUrl = "/no_image_placeholder_dark.png";
      }
      items[index].imageUrl = imgUrl;
      items[index].description = record.description;
      items[index].state = record.state;
      items[index].endTime = record.endTime;
    }
  }

  async function subscribeToCurrentPage() {
    await unsubscribeFromAuctionUpdates();
    console.debug('Subscribing to updates for current page');
    const recordIds = items.map(item => item.id);
    recordIds.forEach(recordId => subscribeToAuctionUpdate(recordId, updateItem));
  }

  function changePage(page: number) {
    currentPage = page;
    fetchItems(currentPage).then(subscribeToCurrentPage);
  }

  function handleSearch() {
    fetchItems(1).then(subscribeToCurrentPage);
  }

  fetchItems(currentPage).then(subscribeToCurrentPage);
</script>
{#if $user}
<div class="container mx-auto px-4 overflow-x-auto">
  <div class="flex justify-between items-center mb-4">
    <input 
      type="text" 
      placeholder="Search auctions..." 
      class="input input-bordered w-full max-w-xs" 
      bind:value={searchQuery}
      on:input={handleSearch} 
    />
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each items as item}
      <AuctionItem {item} />
    {/each}
  </div>
  <div class="mt-4 flex justify-between items-center">
    <button class="btn btn-primary" on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
    <span>Page {currentPage} of {totalPages}</span>
    <button class="btn btn-primary" on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
  </div>
</div>
{:else}
<div class="flex justify-center items-center h-screen">
  <p class="text-xl">You are not logged in. Please log in to view the auction items.</p>
</div>
{/if}