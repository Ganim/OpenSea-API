import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Proposal } from '@/entities/sales/proposal';
import type { ProposalStatus } from '@/entities/sales/proposal';
import { prisma } from '@/lib/prisma';
import type { ProposalStatus as PrismaProposalStatus } from '@prisma/generated/client.js';
import type {
  CreateProposalSchema,
  ProposalsRepository,
} from '../proposals-repository';

function mapToDomain(
  proposalData: Record<string, unknown>,
  proposalItems: Record<string, unknown>[],
  proposalAttachments: Record<string, unknown>[],
): Proposal {
  return Proposal.create(
    {
      tenantId: new EntityID(proposalData.tenantId as string),
      customerId: new EntityID(proposalData.customerId as string),
      title: proposalData.title as string,
      description: (proposalData.description as string) ?? undefined,
      status: proposalData.status as ProposalStatus,
      validUntil: (proposalData.validUntil as Date) ?? undefined,
      terms: (proposalData.terms as string) ?? undefined,
      totalValue: Number(proposalData.totalValue),
      sentAt: (proposalData.sentAt as Date) ?? undefined,
      viewedAt: (proposalData.viewedAt as Date) ?? undefined,
      viewCount: (proposalData.viewCount as number) ?? 0,
      lastViewedAt: (proposalData.lastViewedAt as Date) ?? undefined,
      createdBy: proposalData.createdBy as string,
      signatureEnvelopeId:
        (proposalData.signatureEnvelopeId as string) ?? undefined,
      isActive: proposalData.isActive as boolean,
      createdAt: proposalData.createdAt as Date,
      updatedAt: proposalData.updatedAt as Date,
      deletedAt: (proposalData.deletedAt as Date) ?? undefined,
      items: proposalItems.map((proposalItem) => ({
        id: new EntityID(proposalItem.id as string),
        proposalId: new EntityID(proposalItem.proposalId as string),
        description: proposalItem.description as string,
        quantity: proposalItem.quantity as number,
        unitPrice: Number(proposalItem.unitPrice),
        total: Number(proposalItem.total),
        createdAt: proposalItem.createdAt as Date,
        updatedAt: (proposalItem.updatedAt as Date) ?? undefined,
      })),
      attachments: proposalAttachments.map((attachment) => ({
        id: new EntityID(attachment.id as string),
        proposalId: new EntityID(attachment.proposalId as string),
        fileName: attachment.fileName as string,
        fileUrl: attachment.fileUrl as string,
        fileSize: attachment.fileSize as number,
        createdAt: attachment.createdAt as Date,
      })),
    },
    new EntityID(proposalData.id as string),
  );
}

export class PrismaProposalsRepository implements ProposalsRepository {
  async create(data: CreateProposalSchema): Promise<Proposal> {
    const proposalData = await prisma.proposal.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        title: data.title,
        description: data.description,
        validUntil: data.validUntil,
        terms: data.terms,
        totalValue: data.totalValue,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((proposalItem) => ({
            description: proposalItem.description,
            quantity: proposalItem.quantity,
            unitPrice: proposalItem.unitPrice,
            total: proposalItem.total,
          })),
        },
      },
      include: { items: true, attachments: true },
    });

    return mapToDomain(
      proposalData as unknown as Record<string, unknown>,
      proposalData.items as unknown as Record<string, unknown>[],
      proposalData.attachments as unknown as Record<string, unknown>[],
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Proposal | null> {
    const proposalData = await prisma.proposal.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: { items: true, attachments: true },
    });

    if (!proposalData) return null;

    return mapToDomain(
      proposalData as unknown as Record<string, unknown>,
      proposalData.items as unknown as Record<string, unknown>[],
      proposalData.attachments as unknown as Record<string, unknown>[],
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<Proposal[]> {
    const proposalsData = await prisma.proposal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.status && {
          status: filters.status as PrismaProposalStatus,
        }),
        ...(filters?.customerId && { customerId: filters.customerId }),
      },
      include: { items: true, attachments: true },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return proposalsData.map((proposalData) =>
      mapToDomain(
        proposalData as unknown as Record<string, unknown>,
        proposalData.items as unknown as Record<string, unknown>[],
        proposalData.attachments as unknown as Record<string, unknown>[],
      ),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { status?: ProposalStatus; customerId?: string },
  ): Promise<number> {
    return prisma.proposal.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.status && {
          status: filters.status as PrismaProposalStatus,
        }),
        ...(filters?.customerId && { customerId: filters.customerId }),
      },
    });
  }

  async save(proposal: Proposal): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id: proposal.id.toString() },
        data: {
          customerId: proposal.customerId.toString(),
          title: proposal.title,
          description: proposal.description ?? null,
          status: proposal.status as PrismaProposalStatus,
          validUntil: proposal.validUntil ?? null,
          terms: proposal.terms ?? null,
          totalValue: proposal.totalValue,
          sentAt: proposal.sentAt ?? null,
          viewedAt: proposal.viewedAt ?? null,
          viewCount: proposal.viewCount,
          lastViewedAt: proposal.lastViewedAt ?? null,
          signatureEnvelopeId: proposal.signatureEnvelopeId ?? null,
          isActive: proposal.isActive,
          deletedAt: proposal.deletedAt ?? null,
        },
      });

      // Replace all items
      await tx.proposalItem.deleteMany({
        where: { proposalId: proposal.id.toString() },
      });

      if (proposal.items.length > 0) {
        await tx.proposalItem.createMany({
          data: proposal.items.map((proposalItem) => ({
            id: proposalItem.id.toString(),
            proposalId: proposal.id.toString(),
            description: proposalItem.description,
            quantity: proposalItem.quantity,
            unitPrice: proposalItem.unitPrice,
            total: proposalItem.total,
          })),
        });
      }
    });
  }

  async updateViewTracking(id: string): Promise<boolean> {
    const now = new Date();

    const updatedProposal = await prisma.proposal.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        viewedAt: now,
        viewCount: { increment: 1 },
        lastViewedAt: now,
      },
    });

    return updatedProposal.count > 0;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.proposal.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
