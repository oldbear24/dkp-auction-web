import { writable } from 'svelte/store';
import type { RecordModel } from 'pocketbase';

export const user = writable<RecordModel | null>(null);