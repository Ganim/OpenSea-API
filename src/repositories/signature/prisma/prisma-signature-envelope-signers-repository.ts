import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import { prisma } from '@/lib/prisma';
import { signatureEnvelopeSignerPrismaToDomain } from '@/mappers/signature';
import type {
  SignerRole,
  SignerStatus,
  SignatureLevel,
} from '@prisma/generated/client.js';
import type {
  CreateSignerSchema,
  SignatureEnvelopeSignersRepository,
  UpdateSignerSchema,
} from '../signature-envelope-signers-repository';

export class PrismaSignatureEnvelopeSignersRepository
  implements SignatureEnvelopeSignersRepository
{
  async create(data: CreateSignerSchema): Promise<SignatureEnvelopeSigner> {
    const db = await prisma.signatureEnvelopeSigner.create({
      data: {
        tenantId: data.tenantId,
        envelopeId: data.envelopeId,
        order: data.order ?? 1,
        group: data.group ?? 1,
        role: (data.role as SignerRole) ?? 'SIGNER',
        status: (data.status as SignerStatus) ?? 'PENDING',
        userId: data.userId ?? null,
        contactId: data.contactId ?? null,
        externalName: data.externalName ?? null,
        externalEmail: data.externalEmail ?? null,
        externalPhone: data.externalPhone ?? null,
        externalDocument: data.externalDocument ?? null,
        signatureLevel: data.signatureLevel as SignatureLevel,
        certificateId: data.certificateId ?? null,
        accessToken: data.accessToken ?? null,
        accessTokenExpiresAt: data.accessTokenExpiresAt ?? null,
      },
    });
    return signatureEnvelopeSignerPrismaToDomain(db);
  }

  async createMany(
    data: CreateSignerSchema[],
  ): Promise<SignatureEnvelopeSigner[]> {
    const results: SignatureEnvelopeSigner[] = [];
    for (const d of data) {
      results.push(await this.create(d));
    }
    return results;
  }

  async findById(id: UniqueEntityID): Promise<SignatureEnvelopeSigner | null> {
    const db = await prisma.signatureEnvelopeSigner.findUnique({
      where: { id: id.toString() },
    });
    return db ? signatureEnvelopeSignerPrismaToDomain(db) : null;
  }

  async findByAccessToken(
    token: string,
  ): Promise<SignatureEnvelopeSigner | null> {
    const db = await prisma.signatureEnvelopeSigner.findFirst({
      where: { accessToken: token },
    });
    return db ? signatureEnvelopeSignerPrismaToDomain(db) : null;
  }

  async findByEnvelopeId(
    envelopeId: string,
  ): Promise<SignatureEnvelopeSigner[]> {
    const items = await prisma.signatureEnvelopeSigner.findMany({
      where: { envelopeId },
      orderBy: [{ order: 'asc' }, { group: 'asc' }],
    });
    return items.map(signatureEnvelopeSignerPrismaToDomain);
  }

  async findPendingByEnvelopeAndGroup(
    envelopeId: string,
    group: number,
  ): Promise<SignatureEnvelopeSigner[]> {
    const items = await prisma.signatureEnvelopeSigner.findMany({
      where: {
        envelopeId,
        group,
        status: { notIn: ['SIGNED', 'REJECTED'] },
      },
    });
    return items.map(signatureEnvelopeSignerPrismaToDomain);
  }

  async update(
    data: UpdateSignerSchema,
  ): Promise<SignatureEnvelopeSigner | null> {
    // Build update data explicitly to avoid Prisma type conflicts
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status as SignerStatus;
    if (data.signedAt !== undefined) updateData.signedAt = data.signedAt;
    if (data.signatureImageFileId !== undefined)
      updateData.signatureImageFileId = data.signatureImageFileId;
    if (data.signatureData !== undefined)
      updateData.signatureData = (data.signatureData as object) ?? undefined;
    if (data.ipAddress !== undefined) updateData.ipAddress = data.ipAddress;
    if (data.userAgent !== undefined) updateData.userAgent = data.userAgent;
    if (data.geoLatitude !== undefined)
      updateData.geoLatitude = data.geoLatitude;
    if (data.geoLongitude !== undefined)
      updateData.geoLongitude = data.geoLongitude;
    if (data.otpVerified !== undefined)
      updateData.otpVerified = data.otpVerified;
    if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt;
    if (data.rejectedReason !== undefined)
      updateData.rejectedReason = data.rejectedReason;
    if (data.lastNotifiedAt !== undefined)
      updateData.lastNotifiedAt = data.lastNotifiedAt;
    if (data.notificationCount !== undefined)
      updateData.notificationCount = data.notificationCount;

    const db = await prisma.signatureEnvelopeSigner.update({
      where: { id: data.id },
      data: updateData,
    });
    return signatureEnvelopeSignerPrismaToDomain(db);
  }

  async updateManyStatus(envelopeId: string, status: string): Promise<void> {
    await prisma.signatureEnvelopeSigner.updateMany({
      where: { envelopeId },
      data: { status: status as SignerStatus },
    });
  }
}
