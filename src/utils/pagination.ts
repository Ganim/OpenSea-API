/**
 * Pagination Utilities
 * Funções auxiliares para paginação
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calcula offset para query de banco de dados
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calcula número total de páginas
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Cria metadata de paginação
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    pages: calculateTotalPages(total, limit),
  };
}

/**
 * Cria resposta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}

/**
 * Cria resposta paginada com nome de chave customizado
 * Mantém retrocompatibilidade com APIs existentes
 * @param data - Array de dados paginados
 * @param total - Total de registros
 * @param page - Página atual
 * @param limit - Limite por página
 * @param resourceName - Nome do recurso (ex: "users", "products")
 * @returns Objeto com dados paginados usando nome customizado
 */
export function createNamedPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  resourceName: string,
): Record<string, unknown> {
  return {
    [resourceName]: data,
    meta: createPaginationMeta(total, page, limit),
  };
}

/**
 * Valida parâmetros de paginação
 */
export function validatePaginationParams(
  page?: number,
  limit?: number,
): PaginationParams {
  const validatedPage = page && page > 0 ? page : 1;
  const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 20;

  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}
