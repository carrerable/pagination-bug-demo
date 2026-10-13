import { useMemo, useState } from 'react';
import type { Lang } from './i18n';
import { Shell } from './ui/Shell';
import { Frame } from './ui/Frame';
import { collectAll, createDb, filterForFix, makePackages, type Collected, type FilterMode } from './lib/db';

const T = {
  en: {
    eyebrow: 'Case study / root cause', title: 'Root cause: pagination without ORDER BY',
    lead: 'The same query, paged without an ORDER BY, returns different rows each time. Counts drift, and a bulk fix built on them is unsafe.',
    run1: 'Run without ORDER BY', run2: 'Run with ORDER BY id', unique: 'Unique', dup: 'Duplicates', miss: 'Missing', fetched: 'Fetched',
    table: 'Table: 1,000 synthetic packages, 300 with null cost. Page size: 100.', idle: 'Press a run button.',
    filterH: 'Null filter for the fix', cost: 'cost > 0 (excludes nulls)', front: 'like the front end (null counts as 0)', selected: 'Rows selected',
    realH: 'From the real incident', real1: 'The unordered dry run counted about 3,400 packages when 11,934 existed.', real2: 'About 8,506 records had null values that the first filter dropped.',
    explain: 'Two defects stacked: unstable paging lost and repeated rows, and the null filter disagreed with the front end.',
  },
  es: {
    eyebrow: 'Caso de estudio / causa raíz', title: 'Causa raíz: paginación sin ORDER BY',
    lead: 'La misma consulta, paginada sin ORDER BY, devuelve filas distintas cada vez. Los conteos se desvían y una corrección masiva basada en ellos no es segura.',
    run1: 'Correr sin ORDER BY', run2: 'Correr con ORDER BY id', unique: 'Únicos', dup: 'Duplicados', miss: 'Faltantes', fetched: 'Leídos',
    table: 'Tabla: 1,000 paquetes sintéticos, 300 con costo nulo. Tamaño de página: 100.', idle: 'Pulsa un botón de corrida.',
    filterH: 'Filtro de nulos para la corrección', cost: 'cost > 0 (excluye nulos)', front: 'como el front-end (nulo cuenta como 0)', selected: 'Filas seleccionadas',
    realH: 'Del incidente real', real1: 'El dry-run sin orden contó unos 3,400 paquetes cuando existían 11,934.', real2: 'Unos 8,506 registros tenían valores nulos que el primer filtro descartó.',
    explain: 'Dos defectos apilados: la paginación inestable perdía y repetía filas, y el filtro de nulos no coincidía con el del front-end.',
  },
};

export function Demo({ lang }: { lang: Lang }) {
  const t = T[lang];
  const rows = useMemo(() => makePackages(), []);
  const [res, setRes] = useState<{ label: string; r: Collected } | null>(null);
  const [mode, setMode] = useState<FilterMode>('cost>0');
  const [runs, setRuns] = useState(0);
  const run = (order: 'id' | undefined) => {
    setRuns(runs + 1);
    setRes({ label: order ? 'ORDER BY id' : 'no ORDER BY', r: collectAll(createDb(rows, runs + 1), rows.length, order, 100) });
  };
  const selected = filterForFix(rows, mode).length;

  return (
    <Shell lang={lang} eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <Frame tl="SIM 01" tr="seed fixed">
        <p className="note">{t.table}</p>
        <div className="row">
          <button className="btn" onClick={() => run(undefined)}>{t.run1}</button>
          <button className="btn primary" onClick={() => run('id')}>{t.run2}</button>
        </div>
        <div className="grid" style={{ marginTop: 'var(--s-4)' }} aria-live="polite">
          {res ? (
            <>
              <div className="card"><div className="num" data-testid="unique">{res.r.unique}</div><div className="label">{t.unique}</div></div>
              <div className="card"><div className="num" data-testid="dups">{res.r.duplicates}</div><div className="label">{t.dup}</div></div>
              <div className="card"><div className="num" data-testid="missing">{res.r.missing}</div><div className="label">{t.miss}</div></div>
              <div className="card"><div className="num">{res.r.fetched}</div><div className="label">{t.fetched} / {res.label}</div></div>
            </>
          ) : <p className="mut">{t.idle}</p>}
        </div>
        {res && <div style={{ marginTop: 'var(--s-3)', width: '100%' }}><div className={`bar ${res.r.missing ? '' : 'hot'}`} style={{ width: `${res.r.unique / 10}%` }} role="img" aria-label={`${res.r.unique} / 1000`} /></div>}
      </Frame>

      <Frame tl="NUL 02">
        <h2>{t.filterH}</h2>
        <div className="row">
          {(['cost>0', 'like-frontend'] as FilterMode[]).map((m) => (
            <button key={m} className="toggle" aria-pressed={mode === m} onClick={() => setMode(m)}>{m === 'cost>0' ? t.cost : t.front}</button>
          ))}
        </div>
        <div className="grid" style={{ marginTop: 'var(--s-3)' }}>
          <div className="card"><div className="num" data-testid="selected">{selected}</div><div className="label">{t.selected}</div></div>
        </div>
      </Frame>

      <Frame tl="REAL 03">
        <h2>{t.realH}</h2>
        <p>{t.real1}</p>
        <p>{t.real2}</p>
        <p className="note">{t.explain}</p>
      </Frame>
    </Shell>
  );
}
