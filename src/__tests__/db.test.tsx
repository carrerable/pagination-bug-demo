import { render, screen, fireEvent } from '@testing-library/react';
import { collectAll, createDb, createRng, filterForFix, makePackages } from '../lib/db';
import { Demo } from '../Demo';

const rows = makePackages();

test('el generador es determinista', () => {
  const a = createRng(5); const b = createRng(5);
  expect([a(), a(), a()]).toEqual([b(), b(), b()]);
});

test('hay 1000 paquetes y 300 nulos', () => {
  expect(rows).toHaveLength(1000);
  expect(rows.filter((r) => r.cost === null)).toHaveLength(300);
});

test('con ORDER BY: unique === 1000 y missing === 0', () => {
  const r = collectAll(createDb(rows, 1), 1000, 'id', 100);
  expect(r.unique).toBe(1000);
  expect(r.missing).toBe(0);
  expect(r.duplicates).toBe(0);
});

test('sin orden y con semilla fija: unique < 1000, con duplicados y faltantes', () => {
  const r = collectAll(createDb(rows, 1), 1000, undefined, 100);
  expect(r.unique).toBeLessThan(1000);
  expect(r.duplicates).toBeGreaterThan(0);
  expect(r.missing).toBe(1000 - r.unique);
  expect(collectAll(createDb(rows, 1), 1000, undefined, 100)).toEqual(r);
});

test('like-frontend incluye los 300 nulos que cost>0 excluye', () => {
  const strict = filterForFix(rows, 'cost>0');
  const loose = filterForFix(rows, 'like-frontend');
  expect(strict).toHaveLength(700);
  expect(loose.length - strict.length).toBe(300);
});

test('la interfaz muestra los contadores', () => {
  render(<Demo lang="en" />);
  fireEvent.click(screen.getByRole('button', { name: 'Run with ORDER BY id' }));
  expect(screen.getByTestId('unique')).toHaveTextContent('1000');
  expect(screen.getByTestId('missing')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('button', { name: 'like the front end (null counts as 0)' }));
  expect(screen.getByTestId('selected')).toHaveTextContent('1000');
});
