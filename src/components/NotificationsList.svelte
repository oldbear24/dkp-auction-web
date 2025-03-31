<script lang="ts">
	import pb from "$lib/pocketbase";
	import { onMount } from "svelte";
import type {RecordModel } from 'pocketbase';
import { writable } from 'svelte/store';
export let notificationCount = writable(0);

const notifications = writable<RecordModel[]>();
    onMount(() => {
       pb.collection('notifications').getFullList( { fields: 'id,text' }).then((resp) => {
          notifications.set(resp);
       });
    });


 export function clearAll() {
    pb.send("/api/seen-notifications",{method:"POST"}).then(() => {
      notifications.set([]);
      notificationCount.set(0);
    });
  }

  function clearNotification(id: string) {
    pb.send("/api/seen-notifications/"+id,{method:"POST"}).then(() => {
      notifications.update((notifications) => {
        notificationCount.update((count) => count - 1);
        return notifications.filter((notification) => notification.id !== id);
      });
    });
  }
</script>
<div class="overflow-auto rounded-box border border-base-content/5 bg-base-100 h-96">
    <table class="table table-pin-rows">
      <tbody>
        {#each $notifications as notification} 
        <tr>
            <th>{notification.text}</th>
            <td><button class="btn btn-error btn-sm" on:click="{()=>clearNotification(notification.id)}">Clear</button></td>
          </tr>  
        {/each}                  
      </tbody>
    </table>
  </div>

