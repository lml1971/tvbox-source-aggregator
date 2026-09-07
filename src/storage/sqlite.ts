// SQLite 存储实现

import type { Storage } from './interface';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class SQLiteStorage implements Storage {
  private db: Database.Database;
  private stmtGet: Database.Statement;
  private stmtPut: Database.Statement;

  constructor(dbPath: string) {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    this.stmtGet = this.db.prepare('SELECT value FROM kv WHERE key = ?');
    this.stmtPut = this.db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)');
  }

  async get(key: string): Promise<string | null> {
    const row = this.stmtGet.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  async put(key: string, value: string): Promise<void> {
    this.stmtPut.run(key, value);
  }

  close(): void {
    this.db.close();
  }
}
