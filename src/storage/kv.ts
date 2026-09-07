// Cloudflare KV 适配

import type { Storage } from './interface';

export class KVStorage implements Storage {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<string | null> {
    return this.kv.get(key);
  }

  async put(key: string, value: string): Promise<void> {
    await this.kv.put(key, value);
  }
}
