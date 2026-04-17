import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type {
  CreateSignatureEnvelopeSchema,
  FindManyEnvelopesResult,
  ListSignatureEnvelopesParams,
  SignatureEnvelopesRepository,
  UpdateSignatureEnvelopeSchema,
} from '../signature-envelopes-repository';

export class InMemorySignatureEnvelopesRepository
  implements SignatureEnvelopesRepository
{
  public items: SignatureEnvelope[] = [];

  async create(
    data: CreateSignatureEnvelopeSchema,
  ): Promise<SignatureEnvelope> {
    const envelope = SignatureEnvelope.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      status: (data.status as SignatureEnvelope['status']) ?? undefined,
      signatureLevel:
        data.signatureLevel as SignatureEnvelope['signatureLevel'],
      minSignatureLevel:
        (data.minSignatureLevel as SignatureEnvelope['signatureLevel']) ??
        undefined,
      verificationCode: data.verificationCode ?? null,
      documentFileId: data.documentFileId,
      documentHash: data.documentHash,
      documentType: data.documentType,
      sourceModule: data.sourceModule,
      sourceEntityType: data.sourceEntityType,
      sourceEntityId: data.sourceEntityId,
      routingType: data.routingType as SignatureEnvelope['routingType'],
      expiresAt: data.expiresAt,
      reminderDays: data.reminderDays,
      autoExpireDays: data.autoExpireDays,
      createdByUserId: data.createdByUserId,
      tags: data.tags,
      metadata: data.metadata,
    });

    this.items.push(envelope);
    return envelope;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id.toString() &&
          item.tenantId.toString() === tenantId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null> {
    return this.findById(id, tenantId);
  }

  async findByVerificationCode(
    verificationCode: string,
  ): Promise<SignatureEnvelope | null> {
    return (
      this.items.find(
        (item) => item.verificationCode === verificationCode && !item.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    params: ListSignatureEnvelopesParams,
  ): Promise<FindManyEnvelopesResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === params.tenantId && !item.deletedAt,
    );

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }
    if (params.sourceModule) {
      filtered = filtered.filter(
        (item) => item.sourceModule === params.sourceModule,
      );
    }
    if (params.createdByUserId) {
      filtered = filtered.filter(
        (item) => item.createdByUserId === params.createdByUserId,
      );
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(s),
      );
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      envelopes: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  async findExpiredActive(referenceDate: Date): Promise<SignatureEnvelope[]> {
    return this.items.filter(
      (envelope) =>
        !envelope.deletedAt &&
        (envelope.status === 'PENDING' || envelope.status === 'IN_PROGRESS') &&
        envelope.expiresAt !== null &&
        envelope.expiresAt.getTime() < referenceDate.getTime(),
    );
  }

  async findRemindableInProgress(
    referenceDate: Date,
  ): Promise<SignatureEnvelope[]> {
    return this.items.filter(
      (envelope) =>
        !envelope.deletedAt &&
        envelope.status === 'IN_PROGRESS' &&
        (envelope.expiresAt === null ||
          envelope.expiresAt.getTime() > referenceDate.getTime()),
    );
  }

  async update(
    data: UpdateSignatureEnvelopeSchema,
  ): Promise<SignatureEnvelope | null> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === data.id,
    );
    if (index === -1) return null;

    const envelope = this.items[index];
    if (data.status)
      envelope.status = data.status as SignatureEnvelope['status'];
    if (data.completedAt !== undefined)
      envelope.props.completedAt = data.completedAt;
    if (data.cancelledAt !== undefined)
      envelope.props.cancelledAt = data.cancelledAt;
    if (data.cancelReason !== undefined)
      envelope.props.cancelReason = data.cancelReason;
    if (data.signedFileId !== undefined)
      envelope.props.signedFileId = data.signedFileId;

    return envelope;
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    if (item) {
      item.props.deletedAt = new Date();
    }
  }
}
