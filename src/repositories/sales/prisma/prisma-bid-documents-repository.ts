import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidDocument } from '@/entities/sales/bid-document';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidDocumentsRepository,
  FindManyBidDocumentsPaginatedParams,
} from '../bid-documents-repository';
import type {
  BidDocumentType as PrismaBidDocumentType,
  BidDocRenewalStatus as PrismaBidDocRenewalStatus,
} from '@prisma/generated/client.js';
import { Prisma } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): BidDocument {
  return BidDocument.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      bidId: data.bidId ? new UniqueEntityID(data.bidId as string) : undefined,
      type: data.type as BidDocument['type'],
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      fileId: new UniqueEntityID(data.fileId as string),
      issueDate: (data.issueDate as Date) ?? undefined,
      expirationDate: (data.expirationDate as Date) ?? undefined,
      isValid: data.isValid as boolean,
      autoRenewable: data.autoRenewable as boolean,
      lastRenewAttempt: (data.lastRenewAttempt as Date) ?? undefined,
      renewStatus:
        (data.renewStatus as BidDocument['renewStatus']) ?? undefined,
      portalUploaded: data.portalUploaded as boolean,
      portalUploadedAt: (data.portalUploadedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaBidDocumentsRepository implements BidDocumentsRepository {
  async create(doc: BidDocument): Promise<void> {
    await prisma.bidDocument.create({
      data: {
        id: doc.id.toString(),
        tenantId: doc.tenantId.toString(),
        bidId: doc.bidId?.toString(),
        type: doc.type as PrismaBidDocumentType,
        name: doc.name,
        description: doc.description,
        fileId: doc.fileId.toString(),
        issueDate: doc.issueDate,
        expirationDate: doc.expirationDate,
        isValid: doc.isValid,
        autoRenewable: doc.autoRenewable,
        lastRenewAttempt: doc.lastRenewAttempt,
        renewStatus: doc.renewStatus as PrismaBidDocRenewalStatus | undefined,
        portalUploaded: doc.portalUploaded,
        portalUploadedAt: doc.portalUploadedAt,
        createdAt: doc.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidDocument | null> {
    const data = await prisma.bidDocument.findFirst({
      where: { id: id.toString(), tenantId },
    });
    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyBidDocumentsPaginatedParams,
  ): Promise<PaginatedResult<BidDocument>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
    };
    if (params.bidId) where.bidId = params.bidId;
    if (params.type) where.type = params.type;

    const [data, total] = await Promise.all([
      prisma.bidDocument.findMany({
        where: where as Prisma.BidDocumentWhereInput,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.bidDocument.count({
        where: where as Prisma.BidDocumentWhereInput,
      }),
    ]);

    return {
      data: data.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(doc: BidDocument): Promise<void> {
    await prisma.bidDocument.update({
      where: { id: doc.id.toString() },
      data: {
        isValid: doc.isValid,
        portalUploaded: doc.portalUploaded,
        portalUploadedAt: doc.portalUploadedAt,
      },
    });
  }
}
