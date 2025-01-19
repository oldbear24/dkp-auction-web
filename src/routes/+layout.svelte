<script lang="ts">
  import '../app.css';
  import NavBar from '../components/NavBar.svelte';
  import { writable } from 'svelte/store';
  import type { RecordModel } from 'pocketbase';
  import { getUser } from '../lib/pocketbase';

  let user = writable<RecordModel | null>(getUser());

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }
</script>

<NavBar/>

<main class="container mx-auto p-4">
  <slot />
</main>
