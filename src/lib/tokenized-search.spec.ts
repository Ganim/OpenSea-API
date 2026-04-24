import { describe, expect, it } from 'vitest';

import { filterByTokens, tokenizedSearchAnd } from './tokenized-search';

describe('tokenizedSearchAnd', () => {
  const builder = (token: string) => ({
    OR: [
      { name: { contains: token, mode: 'insensitive' } },
      { sku: { contains: token, mode: 'insensitive' } },
    ],
  });

  it('returns undefined when search is undefined, null or empty', () => {
    expect(tokenizedSearchAnd(undefined, builder)).toBeUndefined();
    expect(tokenizedSearchAnd(null, builder)).toBeUndefined();
    expect(tokenizedSearchAnd('', builder)).toBeUndefined();
  });

  it('returns undefined when search is only whitespace', () => {
    expect(tokenizedSearchAnd('   ', builder)).toBeUndefined();
    expect(tokenizedSearchAnd('\t\n ', builder)).toBeUndefined();
  });

  it('builds a single-token AND clause for a single word', () => {
    const result = tokenizedSearchAnd('grafil', builder);
    expect(result).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: 'grafil', mode: 'insensitive' } },
            { sku: { contains: 'grafil', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('splits on whitespace and requires every token to match', () => {
    const result = tokenizedSearchAnd('Grafil 808 Cinza', builder);
    expect(result?.AND).toHaveLength(3);
    expect(result?.AND[0]).toEqual({
      OR: [
        { name: { contains: 'Grafil', mode: 'insensitive' } },
        { sku: { contains: 'Grafil', mode: 'insensitive' } },
      ],
    });
    expect(result?.AND[2]).toEqual({
      OR: [
        { name: { contains: 'Cinza', mode: 'insensitive' } },
        { sku: { contains: 'Cinza', mode: 'insensitive' } },
      ],
    });
  });

  it('collapses consecutive whitespace', () => {
    const result = tokenizedSearchAnd('  Grafil   808  ', builder);
    expect(result?.AND).toHaveLength(2);
  });

  it('preserves token casing so the caller can rely on insensitive mode', () => {
    const result = tokenizedSearchAnd('Cinza', builder);
    expect(result?.AND[0]).toEqual({
      OR: [
        { name: { contains: 'Cinza', mode: 'insensitive' } },
        { sku: { contains: 'Cinza', mode: 'insensitive' } },
      ],
    });
  });
});

describe('filterByTokens', () => {
  type Row = { name: string; sku: string | null };
  const rows: Row[] = [
    { name: 'Grafil 808 Cinza', sku: 'GRF-808-CZ' },
    { name: 'Grafil 808 Azul', sku: 'GRF-808-AZ' },
    { name: 'Parafuso Phillips', sku: 'PRF-001' },
    { name: 'Lâmpada LED', sku: null },
  ];

  const matcher = (item: Row, token: string) =>
    item.name.toLowerCase().includes(token) ||
    item.sku?.toLowerCase().includes(token) === true;

  it('returns the original array when search is undefined/null/empty', () => {
    expect(filterByTokens(rows, undefined, matcher)).toBe(rows);
    expect(filterByTokens(rows, null, matcher)).toBe(rows);
    expect(filterByTokens(rows, '', matcher)).toBe(rows);
    expect(filterByTokens(rows, '   ', matcher)).toBe(rows);
  });

  it('matches every token across any field', () => {
    expect(filterByTokens(rows, 'Grafil 808 Cinza', matcher)).toEqual([
      rows[0],
    ]);
  });

  it('is case insensitive and order-independent', () => {
    expect(filterByTokens(rows, 'cinza GRAFIL', matcher)).toEqual([rows[0]]);
  });

  it('returns empty array when no row matches every token', () => {
    expect(filterByTokens(rows, 'grafil vermelho', matcher)).toEqual([]);
  });

  it('matches across different fields per token', () => {
    expect(filterByTokens(rows, 'grafil GRF-808-AZ', matcher)).toEqual([
      rows[1],
    ]);
  });

  it('tolerates nullable fields via the matcher', () => {
    expect(filterByTokens(rows, 'Lâmpada', matcher)).toEqual([rows[3]]);
  });
});
