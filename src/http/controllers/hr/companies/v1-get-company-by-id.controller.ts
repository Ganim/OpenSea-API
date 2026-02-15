import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { prisma } from '@/lib/prisma';
import { companyToDetailsDTO } from '@/mappers/hr/company/company-to-dto';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetCompanyByIdUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type {
  CompanyAddress,
  CompanyCnae,
  CompanyFiscalSettings,
  CompanyStakeholder,
} from '@prisma/generated/client.js';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyWithDetailsResponseSchema,
  type CompanyWithDetailsResponse,
} from './company-api-schemas';

// Helper to safely cast Prisma JsonValue to Record<string, unknown>
function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

// Helper to safely cast Prisma JsonValue to string[]
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// Map Prisma CompanyAddress to API response format
function mapAddressToResponse(address: CompanyAddress) {
  return {
    id: address.id,
    companyId: address.companyId,
    type: address.type,
    street: address.street,
    number: address.number,
    complement: address.complement,
    district: address.district,
    city: address.city,
    state: address.state,
    zip: address.zip,
    ibgeCityCode: address.ibgeCityCode,
    countryCode: address.countryCode ?? 'BR',
    isPrimary: address.isPrimary,
    metadata: toRecord(address.metadata),
    pendingIssues: toStringArray(address.pendingIssues),
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    deletedAt: address.deletedAt,
  };
}

// Map Prisma CompanyCnae to API response format
function mapCnaeToResponse(cnae: CompanyCnae) {
  return {
    id: cnae.id,
    companyId: cnae.companyId,
    code: cnae.code,
    description: cnae.description,
    isPrimary: cnae.isPrimary,
    status: cnae.status,
    metadata: toRecord(cnae.metadata),
    pendingIssues: toStringArray(cnae.pendingIssues),
    createdAt: cnae.createdAt,
    updatedAt: cnae.updatedAt,
    deletedAt: cnae.deletedAt,
  };
}

// Map Prisma CompanyFiscalSettings to API response format
function mapFiscalSettingsToResponse(settings: CompanyFiscalSettings) {
  return {
    id: settings.id,
    companyId: settings.companyId,
    nfeEnvironment: settings.nfeEnvironment ?? undefined,
    nfeSeries: settings.nfeSeries ?? undefined,
    nfeLastNumber: settings.nfeLastNumber ?? undefined,
    nfeDefaultOperationNature: settings.nfeDefaultOperationNature ?? undefined,
    nfeDefaultCfop: settings.nfeDefaultCfop ?? undefined,
    digitalCertificateType: settings.digitalCertificateType,
    certificateA1ExpiresAt: settings.certificateA1ExpiresAt ?? undefined,
    nfceEnabled: settings.nfceEnabled,
    defaultTaxProfileId: settings.defaultTaxProfileId ?? undefined,
    metadata: toRecord(settings.metadata),
    pendingIssues: toStringArray(settings.pendingIssues),
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
    deletedAt: settings.deletedAt ?? undefined,
  };
}

// Map Prisma CompanyStakeholder to API response format
function mapStakeholderToResponse(stakeholder: CompanyStakeholder) {
  return {
    id: stakeholder.id,
    companyId: stakeholder.companyId,
    name: stakeholder.name,
    role: stakeholder.role,
    entryDate: stakeholder.entryDate,
    exitDate: stakeholder.exitDate,
    personDocumentMasked: stakeholder.personDocumentMasked,
    isLegalRepresentative: stakeholder.isLegalRepresentative,
    status: stakeholder.status,
    source: stakeholder.source,
    rawPayloadRef: stakeholder.rawPayloadRef,
    metadata: toRecord(stakeholder.metadata),
    pendingIssues: toStringArray(stakeholder.pendingIssues),
    createdAt: stakeholder.createdAt,
    updatedAt: stakeholder.updatedAt,
    deletedAt: stakeholder.deletedAt,
  };
}

export async function v1GetCompanyByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Get company by ID',
      description: 'Retrieves a single company by its ID with departments list',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: companyWithDetailsResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const getCompanyUseCase = makeGetCompanyByIdUseCase();
        const result = await getCompanyUseCase.execute({ tenantId, id });

        // Buscar relacionamentos adicionais (addresses, cnaes, fiscalSettings, stakeholders)
        const [addresses, cnaes, fiscalSettings, stakeholders] =
          await Promise.all([
            prisma.companyAddress.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            }),
            prisma.companyCnae.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            }),
            prisma.companyFiscalSettings.findFirst({
              where: { companyId: id, deletedAt: null },
            }),
            prisma.companyStakeholder.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { createdAt: 'desc' },
            }),
          ]);

        const companyData = companyToDetailsDTO({
          company: result.company,
          departments: result.departments,
        });
        const response: CompanyWithDetailsResponse = {
          ...companyData,
          departments: result.departments.map(departmentToDTO),
          addresses: addresses.map(mapAddressToResponse),
          cnaes: cnaes.map(mapCnaeToResponse),
          fiscalSettings: fiscalSettings
            ? mapFiscalSettingsToResponse(fiscalSettings)
            : null,
          stakeholders: stakeholders.map(mapStakeholderToResponse),
        };

        return reply.status(200).send(response);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
