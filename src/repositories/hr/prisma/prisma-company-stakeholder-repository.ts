import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyStakeholder,
  type CompanyStakeholderRole,
  type CompanyStakeholderStatus,
  type CompanyStakeholderSource,
} from '@/entities/hr';
import { mapCompanyStakeholderPrismaToDomain } from '@/mappers/hr/company-stakeholder';
import { PrismaClient, type Prisma } from '@prisma/generated/client.js';
import {
  CompanyStakeholderRepository,
  CreateCompanyStakeholderSchema,
} from '../company-stakeholder-repository';

export class PrismaCompanyStakeholderRepository
  implements CompanyStakeholderRepository
{
  constructor(private prisma: PrismaClient) {}

  async create(
    data: CreateCompanyStakeholderSchema,
  ): Promise<CompanyStakeholder> {
    const raw = await this.prisma.companyStakeholder.create({
      data: {
        companyId: data.companyId.toString(),
        name: data.name,
        role: (data.role as CompanyStakeholderRole | undefined) ?? null,
        entryDate: data.entryDate ?? null,
        exitDate: data.exitDate ?? null,
        personDocumentMasked: data.personDocumentMasked ?? null,
        isLegalRepresentative: data.isLegalRepresentative ?? false,
        status: (data.status ?? 'ACTIVE') as CompanyStakeholderStatus,
        source: (data.source ?? 'MANUAL') as CompanyStakeholderSource,
        rawPayloadRef: data.rawPayloadRef ?? null,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        pendingIssues: [],
      },
    });

    return mapCompanyStakeholderPrismaToDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<CompanyStakeholder | null> {
    const raw = await this.prisma.companyStakeholder.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return mapCompanyStakeholderPrismaToDomain(raw);
  }

  async findByCompanyId(
    companyId: UniqueEntityID,
  ): Promise<CompanyStakeholder[]> {
    const raw = await this.prisma.companyStakeholder.findMany({
      where: {
        companyId: companyId.toString(),
        deletedAt: null,
      },
    });

    return raw.map(mapCompanyStakeholderPrismaToDomain);
  }

  async findByCompanyIdAndName(
    companyId: UniqueEntityID,
    name: string,
  ): Promise<CompanyStakeholder | null> {
    const raw = await this.prisma.companyStakeholder.findFirst({
      where: {
        companyId: companyId.toString(),
        name,
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return mapCompanyStakeholderPrismaToDomain(raw);
  }

  async findLegalRepresentativeByCompanyId(
    companyId: UniqueEntityID,
  ): Promise<CompanyStakeholder | null> {
    const raw = await this.prisma.companyStakeholder.findFirst({
      where: {
        companyId: companyId.toString(),
        isLegalRepresentative: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return mapCompanyStakeholderPrismaToDomain(raw);
  }

  async countActiveLegalRepresentatives(
    companyId: UniqueEntityID,
  ): Promise<number> {
    return this.prisma.companyStakeholder.count({
      where: {
        companyId: companyId.toString(),
        isLegalRepresentative: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async save(stakeholder: CompanyStakeholder): Promise<CompanyStakeholder> {
    const raw = await this.prisma.companyStakeholder.update({
      where: {
        id: stakeholder.id.toString(),
      },
      data: {
        name: stakeholder.name,
        role: (stakeholder.role as CompanyStakeholderRole | undefined) ?? null,
        entryDate: stakeholder.entryDate ?? null,
        exitDate: stakeholder.exitDate ?? null,
        personDocumentMasked: stakeholder.personDocumentMasked ?? null,
        isLegalRepresentative: stakeholder.isLegalRepresentative,
        status: stakeholder.status,
        rawPayloadRef: stakeholder.rawPayloadRef ?? null,
        metadata: (stakeholder.metadata ?? {}) as Prisma.InputJsonValue,
        pendingIssues: stakeholder.pendingIssues ?? [],
        updatedAt: new Date(),
      },
    });

    return mapCompanyStakeholderPrismaToDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await this.prisma.companyStakeholder.delete({
      where: {
        id: id.toString(),
      },
    });
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await this.prisma.companyStakeholder.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async anonimize(id: UniqueEntityID): Promise<void> {
    await this.prisma.companyStakeholder.update({
      where: {
        id: id.toString(),
      },
      data: {
        personDocumentMasked: null,
        rawPayloadRef: null,
        anonimizedAt: new Date(),
      },
    });
  }
}
