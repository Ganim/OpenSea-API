import z from 'zod';

/**
 * Schema para paginação baseada em offset (tradicional)
 */
export const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;

/**
 * Schema para paginação baseada em cursor (mais eficiente)
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

export type CursorPaginationParams = z.infer<typeof cursorPaginationSchema>;

/**
 * Schema de resposta para paginação offset
 */
export function createOffsetPaginatedResponseSchema<T extends z.ZodType>(
  itemSchema: T,
) {
  return z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      pages: z.number(),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    }),
  });
}

/**
 * Schema de resposta para paginação cursor
 */
export function createCursorPaginatedResponseSchema<T extends z.ZodType>(
  itemSchema: T,
) {
  return z.object({
    data: z.array(itemSchema),
    meta: z.object({
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      startCursor: z.string().nullable(),
      endCursor: z.string().nullable(),
      // Total é opcional pois COUNT(*) pode ser custoso em grandes datasets
      totalCount: z.number().optional(),
    }),
  });
}

/**
 * Interface para resultado de paginação offset
 */
export interface OffsetPaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Interface para resultado de paginação cursor
 */
export interface CursorPaginatedResult<T> {
  data: T[];
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Helper para calcular metadados de paginação offset
 */
export function calculateOffsetMeta(
  total: number,
  page: number,
  limit: number,
): OffsetPaginatedResult<never>['meta'] {
  const pages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrevious: page > 1,
  };
}

/**
 * Helper para codificar cursor (base64)
 */
export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Helper para decodificar cursor (base64)
 */
export function decodeCursor<T = Record<string, unknown>>(cursor: string): T {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Helper para criar cursor a partir de um item
 * Usa id e createdAt por padrão para ordenação consistente
 */
export function createCursor(item: { id: string; createdAt?: Date }): string {
  return encodeCursor({
    id: item.id,
    createdAt: item.createdAt?.toISOString(),
  });
}

/**
 * Helper genérico para paginar com cursor usando Prisma
 */
export async function paginateWithCursor<T extends { id: string }>(
  findMany: (args: {
    take: number;
    skip?: number;
    cursor?: { id: string };
    orderBy: { createdAt: 'asc' | 'desc' };
  }) => Promise<T[]>,
  params: CursorPaginationParams,
  options?: {
    countFn?: () => Promise<number>;
  },
): Promise<CursorPaginatedResult<T>> {
  const { cursor, limit, direction } = params;

  // Busca um item a mais para verificar se há próxima página
  const take = limit + 1;
  const orderDirection = direction === 'forward' ? 'desc' : 'asc';

  let cursorData: { id: string } | undefined;
  if (cursor) {
    const decoded = decodeCursor<{ id: string }>(cursor);
    cursorData = { id: decoded.id };
  }

  const items = await findMany({
    take,
    skip: cursorData ? 1 : 0, // Pula o cursor atual
    cursor: cursorData,
    orderBy: { createdAt: orderDirection },
  });

  // Verifica se há mais itens
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;

  // Se a direção for backward, inverte os resultados
  if (direction === 'backward') {
    data.reverse();
  }

  // Conta total se a função foi fornecida
  const totalCount = options?.countFn ? await options.countFn() : undefined;

  return {
    data,
    meta: {
      hasNextPage: direction === 'forward' ? hasMore : !!cursor,
      hasPreviousPage: direction === 'forward' ? !!cursor : hasMore,
      startCursor: data.length > 0 ? createCursor(data[0]) : null,
      endCursor: data.length > 0 ? createCursor(data[data.length - 1]) : null,
      totalCount,
    },
  };
}
