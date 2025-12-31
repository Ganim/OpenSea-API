import {
  companyStatusSchema,
  createCompanySchema,
  updateCompanySchema,
  listCompaniesQuerySchema,
  companyResponseSchema as hrCompanyResponseSchema,
  companyWithDetailsResponseSchema as hrCompanyWithDetailsResponseSchema,
} from '@/http/schemas/hr.schema';
import type { CompanyDTO } from '@/mappers/hr/company/company-to-dto';
import { z } from 'zod';

// Re-export schemas from hr.schema (following project pattern with camelCase)
export const createCompanyRequestSchema = createCompanySchema;
export const updateCompanyRequestSchema = updateCompanySchema;
export { listCompaniesQuerySchema };

// Response schemas (following project pattern with camelCase)
export const companyResponseSchema = hrCompanyResponseSchema;
export const companyWithDetailsResponseSchema = hrCompanyWithDetailsResponseSchema;

export const companiesListResponseSchema = z.object({
  companies: z.array(hrCompanyResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
});

export const checkCnpjResponseSchema = z.object({
  exists: z.boolean(),
  companyId: z.string().optional(),
  legalName: z.string().optional(),
  status: companyStatusSchema.optional(),
});

// Wrapper helpers (following project pattern)
export function wrapCompanyResponse(dto: any) {
  return dto;
}

export function wrapCompaniesListResponse(
  dtos: CompanyDTO[],
  page: number,
  limit: number,
  total: number,
) {
  return {
    companies: dtos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

export function wrapCheckCnpjResponse(dto: CompanyDTO | null) {
  if (!dto) {
    return { exists: false };
  }

  return {
    exists: true,
    companyId: dto.id,
    legalName: dto.legalName,
    status: dto.status as z.infer<typeof companyStatusSchema>,
  };
}
