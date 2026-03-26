import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialConfig } from '@/entities/esocial/esocial-config';
import { prisma } from '@/lib/prisma';
import type {
  EsocialConfigRepository,
  UpdateEsocialConfigData,
} from '../esocial-config-repository';

export class PrismaEsocialConfigRepository
  implements EsocialConfigRepository
{
  async findByTenantId(tenantId: string): Promise<EsocialConfig | null> {
    const data = await prisma.esocialConfig.findUnique({
      where: { tenantId },
    });

    if (!data) return null;

    return EsocialConfig.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        environment: data.environment,
        version: data.version,
        tpInsc: data.tpInsc,
        nrInsc: data.nrInsc ?? undefined,
        autoGenerateOnAdmission: data.autoGenerateOnAdmission,
        autoGenerateOnTermination: data.autoGenerateOnTermination,
        autoGenerateOnLeave: data.autoGenerateOnLeave,
        autoGenerateOnPayroll: data.autoGenerateOnPayroll,
        requireApproval: data.requireApproval,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      new UniqueEntityID(data.id),
    );
  }

  async upsert(
    tenantId: string,
    data: UpdateEsocialConfigData,
  ): Promise<EsocialConfig> {
    const result = await prisma.esocialConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        environment: data.environment ?? 'HOMOLOGACAO',
        version: data.version ?? 'S-1.2',
        tpInsc: data.tpInsc ?? 1,
        nrInsc: data.nrInsc ?? undefined,
        autoGenerateOnAdmission: data.autoGenerateOnAdmission ?? true,
        autoGenerateOnTermination: data.autoGenerateOnTermination ?? true,
        autoGenerateOnLeave: data.autoGenerateOnLeave ?? true,
        autoGenerateOnPayroll: data.autoGenerateOnPayroll ?? true,
        requireApproval: data.requireApproval ?? true,
      },
      update: {
        ...(data.environment !== undefined && {
          environment: data.environment,
        }),
        ...(data.version !== undefined && { version: data.version }),
        ...(data.tpInsc !== undefined && { tpInsc: data.tpInsc }),
        ...(data.nrInsc !== undefined && {
          nrInsc: data.nrInsc,
        }),
        ...(data.autoGenerateOnAdmission !== undefined && {
          autoGenerateOnAdmission: data.autoGenerateOnAdmission,
        }),
        ...(data.autoGenerateOnTermination !== undefined && {
          autoGenerateOnTermination: data.autoGenerateOnTermination,
        }),
        ...(data.autoGenerateOnLeave !== undefined && {
          autoGenerateOnLeave: data.autoGenerateOnLeave,
        }),
        ...(data.autoGenerateOnPayroll !== undefined && {
          autoGenerateOnPayroll: data.autoGenerateOnPayroll,
        }),
        ...(data.requireApproval !== undefined && {
          requireApproval: data.requireApproval,
        }),
      },
    });

    return EsocialConfig.create(
      {
        tenantId: new UniqueEntityID(result.tenantId),
        environment: result.environment,
        version: result.version,
        tpInsc: result.tpInsc,
        nrInsc: result.nrInsc ?? undefined,
        autoGenerateOnAdmission: result.autoGenerateOnAdmission,
        autoGenerateOnTermination: result.autoGenerateOnTermination,
        autoGenerateOnLeave: result.autoGenerateOnLeave,
        autoGenerateOnPayroll: result.autoGenerateOnPayroll,
        requireApproval: result.requireApproval,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      new UniqueEntityID(result.id),
    );
  }
}
