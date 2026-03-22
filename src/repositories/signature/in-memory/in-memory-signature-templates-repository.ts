import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureTemplate } from '@/entities/signature/signature-template';
import type {
  SignatureLevelValue,
  EnvelopeRoutingTypeValue,
} from '@/entities/signature/signature-envelope';
import type { SignerSlot } from '@/entities/signature/signature-template';
import type {
  CreateSignatureTemplateSchema,
  FindManyTemplatesResult,
  ListSignatureTemplatesParams,
  SignatureTemplatesRepository,
  UpdateSignatureTemplateSchema,
} from '../signature-templates-repository';

export class InMemorySignatureTemplatesRepository
  implements SignatureTemplatesRepository
{
  public items: SignatureTemplate[] = [];

  async create(
    data: CreateSignatureTemplateSchema,
  ): Promise<SignatureTemplate> {
    const template = SignatureTemplate.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      signatureLevel: data.signatureLevel as SignatureLevelValue,
      routingType: data.routingType as EnvelopeRoutingTypeValue,
      signerSlots: data.signerSlots as SignerSlot[],
      expirationDays: data.expirationDays,
      reminderDays: data.reminderDays,
      isActive: data.isActive,
    });

    this.items.push(template);
    return template;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureTemplate | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id.toString() &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    params: ListSignatureTemplatesParams,
  ): Promise<FindManyTemplatesResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === params.tenantId,
    );

    if (params.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === params.isActive);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(s));
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      templates: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  async update(
    data: UpdateSignatureTemplateSchema,
  ): Promise<SignatureTemplate | null> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === data.id,
    );
    if (index === -1) return null;

    const template = this.items[index];
    if (data.name) template.name = data.name;
    if (data.description !== undefined)
      template.props.description = data.description ?? null;
    if (data.signatureLevel)
      template.props.signatureLevel =
        data.signatureLevel as SignatureLevelValue;
    if (data.routingType)
      template.props.routingType = data.routingType as EnvelopeRoutingTypeValue;
    if (data.signerSlots)
      template.props.signerSlots = data.signerSlots as SignerSlot[];
    if (data.expirationDays !== undefined)
      template.props.expirationDays = data.expirationDays;
    if (data.reminderDays !== undefined)
      template.props.reminderDays = data.reminderDays;
    if (data.isActive !== undefined) template.isActive = data.isActive;

    return template;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => item.id.toString() !== id.toString(),
    );
  }
}
