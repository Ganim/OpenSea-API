/**
 * Splits a user-provided search query into whitespace-delimited tokens and
 * builds a Prisma-compatible `AND` clause where every token must match at
 * least one of the fields produced by `buildFieldsForToken`.
 *
 * The caller is responsible for returning a `WhereInput` (typically containing
 * an `OR` across multiple columns) for each token. This preserves full Prisma
 * type safety and supports nested relations (e.g. `product.manufacturer.name`)
 * without ad-hoc string parsing.
 *
 * Returns `undefined` when the query is falsy or only whitespace, so callers
 * can safely spread the result into a `where` literal.
 *
 * @example
 *   const where: Prisma.VariantWhereInput = {
 *     tenantId,
 *     deletedAt: null,
 *     ...tokenizedSearchAnd(params.search, (token) => {
 *       const like = { contains: token, mode: 'insensitive' as const };
 *       return {
 *         OR: [
 *           { name: like },
 *           { sku: like },
 *           { product: { name: like } },
 *         ],
 *       };
 *     }),
 *   };
 */
export function tokenizedSearchAnd<T>(
  search: string | undefined | null,
  buildFieldsForToken: (token: string) => T,
): { AND: T[] } | undefined {
  if (!search) return undefined;

  const tokens = search.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;

  return { AND: tokens.map(buildFieldsForToken) };
}

/**
 * In-memory counterpart of {@link tokenizedSearchAnd}: filters an array so
 * every resulting item matches all search tokens, where matching a token
 * means `matchToken(item, token)` returns true for at least one field.
 *
 * `matchToken` receives the token already lowercased — the caller should
 * also lowercase the item's fields for case-insensitive comparison.
 *
 * Returns the original array untouched when the query is falsy/empty so
 * list endpoints behave identically to the Prisma implementation.
 *
 * @example
 *   filtered = filterByTokens(filtered, params.search, (item, token) =>
 *     item.name.toLowerCase().includes(token) ||
 *     item.sku?.toLowerCase().includes(token) === true,
 *   );
 */
export function filterByTokens<T>(
  items: T[],
  search: string | undefined | null,
  matchToken: (item: T, lowercaseToken: string) => boolean,
): T[] {
  if (!search) return items;

  const tokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items;

  return items.filter((item) =>
    tokens.every((token) => matchToken(item, token)),
  );
}
