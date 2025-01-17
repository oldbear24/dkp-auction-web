<script lang="ts">
  import '../app.css';
  import NavBar from '../components/NavBar.svelte';
  import { writable } from 'svelte/store';
  import type { RecordModel } from 'pocketbase';
  import { getUser } from '../lib/pocketbase';

  let user = writable<RecordModel | null>(getUser());
</script>

<NavBar/>

<main class="container mx-auto p-4">
  <slot />
</main>
