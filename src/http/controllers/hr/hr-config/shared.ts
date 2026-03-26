import type { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import z from 'zod';

export const hrConfigResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  empresaCidadaEnabled: z.boolean(),
  maternityLeaveDays: z.number(),
  paternityLeaveDays: z.number(),
  unionContributionEnabled: z.boolean(),
  unionContributionRate: z.number().nullable(),
  patEnabled: z.boolean(),
  patMonthlyValuePerEmployee: z.number().nullable(),
  timeBankIndividualMonths: z.number(),
  timeBankCollectiveMonths: z.number(),
  ratPercent: z.number(),
  fapFactor: z.number(),
  terceirosPercent: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateHrConfigBodySchema = z.object({
  empresaCidadaEnabled: z.boolean().optional(),
  maternityLeaveDays: z.number().int().min(120).max(180).optional(),
  paternityLeaveDays: z.number().int().min(5).max(20).optional(),
  unionContributionEnabled: z.boolean().optional(),
  unionContributionRate: z.number().min(0).max(1).nullable().optional(),
  patEnabled: z.boolean().optional(),
  patMonthlyValuePerEmployee: z.number().min(0).nullable().optional(),
  timeBankIndividualMonths: z.number().int().min(1).max(12).optional(),
  timeBankCollectiveMonths: z.number().int().min(1).max(24).optional(),
  ratPercent: z.number().min(1).max(3).optional(),
  fapFactor: z.number().min(0.5).max(2).optional(),
  terceirosPercent: z.number().min(0).max(15).optional(),
});

export function hrConfigToDTO(config: HrTenantConfig) {
  return {
    id: config.id.toString(),
    tenantId: config.tenantId,
    empresaCidadaEnabled: config.empresaCidadaEnabled,
    maternityLeaveDays: config.maternityLeaveDays,
    paternityLeaveDays: config.paternityLeaveDays,
    unionContributionEnabled: config.unionContributionEnabled,
    unionContributionRate: config.unionContributionRate,
    patEnabled: config.patEnabled,
    patMonthlyValuePerEmployee: config.patMonthlyValuePerEmployee,
    timeBankIndividualMonths: config.timeBankIndividualMonths,
    timeBankCollectiveMonths: config.timeBankCollectiveMonths,
    ratPercent: config.ratPercent,
    fapFactor: config.fapFactor,
    terceirosPercent: config.terceirosPercent,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}
