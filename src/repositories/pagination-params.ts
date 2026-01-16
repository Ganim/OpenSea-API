export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number,
): { totalPages: number; hasNext: boolean; hasPrev: boolean } {
  const totalPages = Math.ceil(total / limit)
  return {
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}
