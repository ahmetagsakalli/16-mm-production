import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient, type Transaction, type InValue } from '@libsql/client/http';
import type { DatabaseSync } from 'node:sqlite';

type Value = string | number | bigint | null | Uint8Array;
type Row = Record<string, Value>;
// Each request uses its own remote transaction. Local transactions also queue
// outside reads, so an async action cannot expose uncommitted state.
export function createDatabase(local: () => DatabaseSync) {
  const remote = process.env.TURSO_DATABASE_URL
    ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }) : null;
  const context = new AsyncLocalStorage<Transaction | 'local'>();
  let pending: Promise<unknown> = Promise.resolve();
  async function exclusive<T>(action: () => Promise<T>): Promise<T> {
    const result = pending.then(action, action);
    pending = result.catch(() => {});
    return result;
  }
  async function execute(sql: string, args: Value[], mode: 'all' | 'get' | 'run') {
    if (remote) {
      const tx = context.getStore();
      const result = await (tx && tx !== 'local' ? tx : remote).execute({ sql, args: args as InValue[] });
      return mode === 'run' ? { changes: result.rowsAffected } : mode === 'get' ? result.rows[0] : result.rows;
    }
    if (process.env.VERCEL) throw new Error('Vercel requires TURSO_DATABASE_URL; refusing ephemeral CMS storage.');
    const action = async () => local().prepare(sql)[mode](...args);
    return context.getStore() === 'local' ? action() : exclusive(action);
  }
  const adapter = {
    prepare(sql: string) { return {
      get: async (...args: Value[]) => await execute(sql, args, 'get') as Row | undefined,
      all: async (...args: Value[]) => await execute(sql, args, 'all') as Row[],
      run: async (...args: Value[]) => await execute(sql, args, 'run') as { changes: number | bigint },
    }; },
    async exec(sql: string) {
      if (remote) {
        const tx = context.getStore();
        await (tx && tx !== 'local' ? tx : remote).executeMultiple(sql);
      } else {
        if (process.env.VERCEL) throw new Error('Vercel requires TURSO_DATABASE_URL.');
        const action = async () => local().exec(sql);
        await (context.getStore() === 'local' ? action() : exclusive(action));
      }
    },
    close() { if (remote) remote.close(); else local().close(); },
  };
  async function transaction<T>(action: () => Promise<T>): Promise<T> {
    if (context.getStore()) return action();
    if (remote) {
      const tx = await remote.transaction('write');
      try {
        const result = await context.run(tx, action);
        await tx.commit(); return result;
      } catch (error) { await tx.rollback().catch(() => {}); throw error; }
      finally { tx.close(); }
    }
    return exclusive(async () => {
      const database = local(); database.exec('BEGIN IMMEDIATE');
      try { const result = await context.run('local', action); database.exec('COMMIT'); return result; }
      catch (error) { database.exec('ROLLBACK'); throw error; }
    });
  }
  return { db: () => adapter, transaction };
}
