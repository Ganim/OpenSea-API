import { prisma } from '@/lib/prisma';

export interface GetEsocialConfigRequest {
  tenantId: string;
}

export interface UpdateEsocialConfigRequest {
  tenantId: string;
  environment?: 'PRODUCAO' | 'HOMOLOGACAO';
  autoGenerate?: boolean;
  requireApproval?: boolean;
  employerType?: string;
  employerDocument?: string;
}

export interface EsocialConfigResponse {
  config: {
    id: string;
    environment: string;
    autoGenerate: boolean;
    requireApproval: boolean;
    employerType: string;
    employerDocument: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetEsocialConfigUseCase {
  async execute(
    request: GetEsocialConfigRequest,
  ): Promise<EsocialConfigResponse> {
    const { tenantId } = request;

    let config = await prisma.esocialConfig.findUnique({
      where: { tenantId },
    });

    // Create default config if none exists
    if (!config) {
      config = await prisma.esocialConfig.create({
        data: { tenantId },
      });
    }

    return {
      config: {
        id: config.id,
        environment: config.environment,
        autoGenerate: config.autoGenerate,
        requireApproval: config.requireApproval,
        employerType: config.employerType,
        employerDocument: config.employerDocument,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  }
}

export class UpdateEsocialConfigUseCase {
  async execute(
    request: UpdateEsocialConfigRequest,
  ): Promise<EsocialConfigResponse> {
    const { tenantId, ...data } = request;

    const config = await prisma.esocialConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...data,
      },
      update: data,
    });

    return {
      config: {
        id: config.id,
        environment: config.environment,
        autoGenerate: config.autoGenerate,
        requireApproval: config.requireApproval,
        employerType: config.employerType,
        employerDocument: config.employerDocument,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  }
}
