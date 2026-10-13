export interface Pkg { id: number; accountId: string; cost: number | null; updatedAt: string }

/** Deterministic linear congruential generator, returns floats in [0, 1). */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** 1,000 synthetic packages; exactly 300 have a null cost. */
export function makePackages(n = 1000): Pkg[] {
  const rng = createRng(2026);
  return Array.from({ length: n }, (_, i) => {
    const id = i + 1;
    const isNull = [0, 3, 7].includes(id % 10);
    return {
      id,
      accountId: `acc-${String(1 + Math.floor(rng() * 40)).padStart(2, '0')}`,
      cost: isNull ? null : Math.round((50 + rng() * 950) * 100) / 100,
      updatedAt: new Date(Date.UTC(2026, 0, 1 + Math.floor(rng() * 150))).toISOString().slice(0, 10),
    };
  });
}

export interface Query { offset: number; limit: number; orderBy?: 'id' }
export interface Db { queryPage(q: Query): Pkg[]; calls(): number }

/**
 * A table that does not guarantee row order unless asked to.
 * Without orderBy, every call returns the rows shuffled again (seed = call counter),
 * which simulates a database free to return any order between two queries.
 */
export function createDb(rows: Pkg[], seed = 1): Db {
  let counter = 0;
  return {
    calls: () => counter,
    queryPage({ offset, limit, orderBy }) {
      counter++;
      let ordered: Pkg[];
      if (orderBy === 'id') ordered = [...rows].sort((a, b) => a.id - b.id);
      else {
        const rng = createRng(seed * 7919 + counter);
        ordered = [...rows];
        for (let i = ordered.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        }
      }
      return ordered.slice(offset, offset + limit);
    },
  };
}

export interface Collected { fetched: number; unique: number; duplicates: number; missing: number }

export function collectAll(db: Db, total: number, orderBy: 'id' | undefined, pageSize: number): Collected {
  const seen = new Set<number>();
  let fetched = 0;
  for (let offset = 0; offset < total; offset += pageSize) {
    for (const r of db.queryPage({ offset, limit: pageSize, orderBy })) { fetched++; seen.add(r.id); }
  }
  return { fetched, unique: seen.size, duplicates: fetched - seen.size, missing: total - seen.size };
}

export type FilterMode = 'cost>0' | 'like-frontend';

/** 'cost>0' drops nulls (and zeros). 'like-frontend' treats null as 0 and keeps it, as the front end did. */
export function filterForFix(rows: Pkg[], mode: FilterMode): Pkg[] {
  return mode === 'cost>0' ? rows.filter((r) => r.cost !== null && r.cost > 0) : rows.filter((r) => (r.cost ?? 0) >= 0);
}
