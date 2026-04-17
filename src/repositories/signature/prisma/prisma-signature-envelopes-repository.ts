import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import { prisma } from '@/lib/prisma';
import { signatureEnvelopePrismaToDomain } from '@/mappers/signature';
import type {
  EnvelopeStatus,
  SignatureLevel,
  EnvelopeRoutingType,
} from '@prisma/generated/client.js';
import type {
  CreateSignatureEnvelopeSchema,
  FindManyEnvelopesResult,
  ListSignatureEnvelopesParams,
  SignatureEnvelopesRepository,
  UpdateSignatureEnvelopeSchema,
} from '../signature-envelopes-repository';

export class PrismaSignatureEnvelopesRepository
  implements SignatureEnvelopesRepository
{
  async create(
    data: CreateSignatureEnvelopeSchema,
  ): Promise<SignatureEnvelope> {
    const db = await prisma.signatureEnvelope.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description ?? null,
        status: (data.status as EnvelopeStatus) ?? 'DRAFT',
        signatureLevel: data.signatureLevel as SignatureLevel,
        minSignatureLevel: (data.minSignatureLevel as SignatureLevel) ?? null,
        verificationCode: data.verificationCode ?? null,
        documentFileId: data.documentFileId,
        documentHash: data.documentHash,
        documentType: data.documentType ?? 'PDF',
        sourceModule: data.sourceModule,
        sourceEntityType: data.sourceEntityType,
        sourceEntityId: data.sourceEntityId,
        routingType: data.routingType as EnvelopeRoutingType,
        expiresAt: data.expiresAt ?? null,
        reminderDays: data.reminderDays ?? 3,
        autoExpireDays: data.autoExpireDays ?? null,
        createdByUserId: data.createdByUserId,
        tags: data.tags ?? [],
        metadata: (data.metadata as object) ?? undefined,
      },
    });
    return signatureEnvelopePrismaToDomain(db);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null> {
    const db = await prisma.signatureEnvelope.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    return db ? signatureEnvelopePrismaToDomain(db) : null;
  }

  async findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null> {
    const db = await prisma.signatureEnvelope.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
      include: {
        signers: { orderBy: [{ order: 'asc' }, { group: 'asc' }] },
        auditTrail: { orderBy: { timestamp: 'asc' } },
      },
    });
    return db ? signatureEnvelopePrismaToDomain(db) : null;
  }

  async findByVerificationCode(
    verificationCode: string,
  ): Promise<SignatureEnvelope | null> {
    // Global lookup: verificationCode is unique per tenant, but we query
    // without tenantId scope to power the public verification endpoint.
    const db = await prisma.signatureEnvelope.findFirst({
      where: { verificationCode, deletedAt: null },
      include: {
        signers: { orderBy: [{ order: 'asc' }, { group: 'asc' }] },
      },
    });
    return db ? signatureEnvelopePrismaToDomain(db) : null;
  }

  async findMany(
    params: ListSignatureEnvelopesParams,
  ): Promise<FindManyEnvelopesResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    const where = {
      tenantId: params.tenantId,
      deletedAt: null,
      ...(params.status && { status: params.status as EnvelopeStatus }),
      ...(params.sourceModule && { sourceModule: params.sourceModule }),
      ...(params.createdByUserId && {
        createdByUserId: params.createdByUserId,
      }),
      ...(params.search && {
        title: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.signatureEnvelope.findMany({
        where,
        include: { signers: { orderBy: [{ order: 'asc' }] } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.signatureEnvelope.count({ where }),
    ]);

    return {
      envelopes: items.map(signatureEnvelopePrismaToDomain),
      total,
    };
  }

  async findExpiredActive(referenceDate: Date): Promise<SignatureEnvelope[]> {
    const items = await prisma.signatureEnvelope.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        expiresAt: { not: null, lt: referenceDate },
      },
      orderBy: { expiresAt: 'asc' },
    });
    return items.map(signatureEnvelopePrismaToDomain);
  }

  async findRemindableInProgress(
    referenceDate: Date,
  ): Promise<SignatureEnvelope[]> {
    const items = await prisma.signatureEnvelope.findMany({
      where: {
        deletedAt: null,
        status: 'IN_PROGRESS',
        OR: [{ expiresAt: null }, { expiresAt: { gt: referenceDate } }],
      },
      orderBy: { createdAt: 'asc' },
    });
    return items.map(signatureEnvelopePrismaToDomain);
  }

  async update(
    data: UpdateSignatureEnvelopeSchema,
  ): Promise<SignatureEnvelope | null> {
    const db = await prisma.signatureEnvelope.update({
      where: { id: data.id },
      data: {
        ...(data.status && { status: data.status as EnvelopeStatus }),
        ...(data.signedFileId !== undefined && {
          signedFileId: data.signedFileId,
        }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
        ...(data.cancelledAt !== undefined && {
          cancelledAt: data.cancelledAt,
        }),
        ...(data.cancelReason !== undefined && {
          cancelReason: data.cancelReason,
        }),
      },
    });
    return signatureEnvelopePrismaToDomain(db);
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.signatureEnvelope.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
