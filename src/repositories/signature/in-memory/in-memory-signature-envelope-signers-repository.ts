import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import type { SignatureLevelValue } from '@/entities/signature/signature-envelope';
import type {
  CreateSignerSchema,
  SignatureEnvelopeSignersRepository,
  UpdateSignerSchema,
} from '../signature-envelope-signers-repository';

export class InMemorySignatureEnvelopeSignersRepository
  implements SignatureEnvelopeSignersRepository
{
  public items: SignatureEnvelopeSigner[] = [];

  async create(data: CreateSignerSchema): Promise<SignatureEnvelopeSigner> {
    const signer = SignatureEnvelopeSigner.create({
      tenantId: new UniqueEntityID(data.tenantId),
      envelopeId: data.envelopeId,
      order: data.order,
      group: data.group,
      role: (data.role as SignatureEnvelopeSigner['role']) ?? undefined,
      status: (data.status as SignatureEnvelopeSigner['status']) ?? undefined,
      userId: data.userId,
      contactId: data.contactId,
      externalName: data.externalName,
      externalEmail: data.externalEmail,
      externalPhone: data.externalPhone,
      externalDocument: data.externalDocument,
      signatureLevel: data.signatureLevel as SignatureLevelValue,
      certificateId: data.certificateId,
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
    });

    this.items.push(signer);
    return signer;
  }

  async createMany(
    data: CreateSignerSchema[],
  ): Promise<SignatureEnvelopeSigner[]> {
    const signers: SignatureEnvelopeSigner[] = [];
    for (const d of data) {
      const signer = await this.create(d);
      signers.push(signer);
    }
    return signers;
  }

  async findById(id: UniqueEntityID): Promise<SignatureEnvelopeSigner | null> {
    return (
      this.items.find((item) => item.id.toString() === id.toString()) ?? null
    );
  }

  async findByAccessToken(
    token: string,
  ): Promise<SignatureEnvelopeSigner | null> {
    return this.items.find((item) => item.accessToken === token) ?? null;
  }

  async findByEnvelopeId(
    envelopeId: string,
  ): Promise<SignatureEnvelopeSigner[]> {
    return this.items.filter((item) => item.envelopeId === envelopeId);
  }

  async findPendingByEnvelopeAndGroup(
    envelopeId: string,
    group: number,
  ): Promise<SignatureEnvelopeSigner[]> {
    return this.items.filter(
      (item) =>
        item.envelopeId === envelopeId &&
        item.group === group &&
        !['SIGNED', 'REJECTED'].includes(item.status),
    );
  }

  async update(
    data: UpdateSignerSchema,
  ): Promise<SignatureEnvelopeSigner | null> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === data.id,
    );
    if (index === -1) return null;

    const signer = this.items[index];
    if (data.status)
      signer.status = data.status as SignatureEnvelopeSigner['status'];
    if (data.signedAt !== undefined) signer.props.signedAt = data.signedAt;
    if (data.signatureImageFileId !== undefined)
      signer.props.signatureImageFileId = data.signatureImageFileId;
    if (data.signatureData !== undefined)
      signer.props.signatureData = data.signatureData;
    if (data.ipAddress !== undefined) signer.props.ipAddress = data.ipAddress;
    if (data.userAgent !== undefined) signer.props.userAgent = data.userAgent;
    if (data.geoLatitude !== undefined)
      signer.props.geoLatitude = data.geoLatitude;
    if (data.geoLongitude !== undefined)
      signer.props.geoLongitude = data.geoLongitude;
    if (data.otpVerified !== undefined)
      signer.props.otpVerified = data.otpVerified;
    if (data.rejectedAt !== undefined)
      signer.props.rejectedAt = data.rejectedAt;
    if (data.rejectedReason !== undefined)
      signer.props.rejectedReason = data.rejectedReason;
    if (data.lastNotifiedAt !== undefined)
      signer.props.lastNotifiedAt = data.lastNotifiedAt;
    if (data.notificationCount !== undefined)
      signer.props.notificationCount = data.notificationCount;

    return signer;
  }

  async updateManyStatus(envelopeId: string, status: string): Promise<void> {
    for (const item of this.items) {
      if (item.envelopeId === envelopeId) {
        item.status = status as SignatureEnvelopeSigner['status'];
      }
    }
  }
}
