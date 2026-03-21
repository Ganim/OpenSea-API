import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureTemplate } from '@/entities/signature/signature-template';
import { prisma } from '@/lib/prisma';
import { signatureTemplatePrismaToDomain } from '@/mappers/signature';
import type { SignatureLevel, EnvelopeRoutingType } from '@prisma/generated/client.js';
import type {
  CreateSignatureTemplateSchema,
  FindManyTemplatesResult,
  ListSignatureTemplatesParams,
  SignatureTemplatesRepository,
  UpdateSignatureTemplateSchema,
} from '../signature-templates-repository';

export class PrismaSignatureTemplatesRepository
  implements SignatureTemplatesRepository
{
  async create(data: CreateSignatureTemplateSchema): Promise<SignatureTemplate> {
    const db = await prisma.signatureTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        signatureLevel: data.signatureLevel as SignatureLevel,
        routingType: data.routingType as EnvelopeRoutingType,
        signerSlots: data.signerSlots as object,
        expirationDays: data.expirationDays ?? null,
        reminderDays: data.reminderDays ?? 3,
        isActive: data.isActive ?? true,
      },
    });
    return signatureTemplatePrismaToDomain(db);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureTemplate | null> {
    const db = await prisma.signatureTemplate.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return db ? signatureTemplatePrismaToDomain(db) : null;
  }

  async findMany(
    params: ListSignatureTemplatesParams,
  ): Promise<FindManyTemplatesResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    const where = {
      tenantId: params.tenantId,
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.signatureTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.signatureTemplate.count({ where }),
    ]);

    return {
      templates: items.map(signatureTemplatePrismaToDomain),
      total,
    };
  }

  async update(
    data: UpdateSignatureTemplateSchema,
  ): Promise<SignatureTemplate | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.signatureLevel) updateData.signatureLevel = data.signatureLevel as SignatureLevel;
    if (data.routingType) updateData.routingType = data.routingType as EnvelopeRoutingType;
    if (data.signerSlots) updateData.signerSlots = data.signerSlots as object;
    if (data.expirationDays !== undefined) updateData.expirationDays = data.expirationDays;
    if (data.reminderDays !== undefined) updateData.reminderDays = data.reminderDays;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const db = await prisma.signatureTemplate.update({
      where: { id: data.id },
      data: updateData,
    });
    return signatureTemplatePrismaToDomain(db);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.signatureTemplate.delete({
      where: { id: id.toString() },
    });
  }
}
