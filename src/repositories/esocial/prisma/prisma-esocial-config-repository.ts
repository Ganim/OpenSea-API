import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialConfig } from '@/entities/esocial/esocial-config';
import { prisma } from '@/lib/prisma';
import type {
  EsocialConfigRepository,
  UpdateEsocialConfigData,
} from '../esocial-config-repository';

export class PrismaEsocialConfigRepository implements EsocialConfigRepository {
  async findByTenantId(tenantId: string): Promise<EsocialConfig | null> {
    const data = await prisma.esocialConfig.findUnique({
      where: { tenantId },
    });

    if (!data) return null;

    return EsocialConfig.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        environment: data.environment,
        version: 'S-1.2', // Not stored in schema; using default
        tpInsc: data.employerType === 'CPF' ? 2 : 1,
        nrInsc: data.employerDocument ?? undefined,
        inpiNumber: data.inpiNumber ?? undefined,
        autoGenerateOnAdmission: data.autoGenerate,
        autoGenerateOnTermination: data.autoGenerate,
        autoGenerateOnLeave: data.autoGenerate,
        autoGenerateOnPayroll: data.autoGenerate,
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
    const envValue =
      data.environment === 'PRODUCAO' || data.environment === 'HOMOLOGACAO'
        ? (data.environment as 'PRODUCAO' | 'HOMOLOGACAO')
        : undefined;

    const result = await prisma.esocialConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...(envValue && { environment: envValue }),
        autoGenerate:
          data.autoGenerateOnAdmission ??
          data.autoGenerateOnTermination ??
          data.autoGenerateOnLeave ??
          data.autoGenerateOnPayroll ??
          false,
        employerType:
          data.tpInsc !== undefined
            ? data.tpInsc === 2
              ? 'CPF'
              : 'CNPJ'
            : 'CNPJ',
        employerDocument: data.nrInsc ?? undefined,
        inpiNumber: data.inpiNumber ?? undefined,
        requireApproval: data.requireApproval ?? true,
      },
      update: {
        ...(envValue !== undefined && { environment: envValue }),
        ...(data.autoGenerateOnAdmission !== undefined && {
          autoGenerate: data.autoGenerateOnAdmission,
        }),
        ...(data.tpInsc !== undefined && {
          employerType: data.tpInsc === 2 ? 'CPF' : 'CNPJ',
        }),
        ...(data.nrInsc !== undefined && {
          employerDocument: data.nrInsc,
        }),
        // `inpiNumber: null` explicit → clear the column;
        // `inpiNumber: undefined` → don't touch.
        ...(data.inpiNumber !== undefined && {
          inpiNumber: data.inpiNumber,
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
        version: 'S-1.2',
        tpInsc: result.employerType === 'CPF' ? 2 : 1,
        nrInsc: result.employerDocument ?? undefined,
        inpiNumber: result.inpiNumber ?? undefined,
        autoGenerateOnAdmission: result.autoGenerate,
        autoGenerateOnTermination: result.autoGenerate,
        autoGenerateOnLeave: result.autoGenerate,
        autoGenerateOnPayroll: result.autoGenerate,
        requireApproval: result.requireApproval,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      new UniqueEntityID(result.id),
    );
  }
}
