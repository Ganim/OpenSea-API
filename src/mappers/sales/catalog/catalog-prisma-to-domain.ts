import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Catalog } from '@/entities/sales/catalog';

export function catalogPrismaToDomain(data: Record<string, unknown>): Catalog {
  return Catalog.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      name: data.name as string,
      slug: (data.slug as string) ?? undefined,
      description: (data.description as string) ?? undefined,
      type: data.type as string,
      status: data.status as string,
      coverImageFileId: (data.coverImageFileId as string) ?? undefined,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId as string)
        : undefined,
      customerId: data.customerId
        ? new UniqueEntityID(data.customerId as string)
        : undefined,
      campaignId: data.campaignId
        ? new UniqueEntityID(data.campaignId as string)
        : undefined,
      rules: (data.rules as Record<string, unknown>) ?? undefined,
      aiCurated: data.aiCurated as boolean,
      aiCurationConfig:
        (data.aiCurationConfig as Record<string, unknown>) ?? undefined,
      layout: data.layout as string,
      showPrices: data.showPrices as boolean,
      showStock: data.showStock as boolean,
      priceTableId: data.priceTableId
        ? new UniqueEntityID(data.priceTableId as string)
        : undefined,
      isPublic: data.isPublic as boolean,
      publicUrl: (data.publicUrl as string) ?? undefined,
      qrCodeUrl: (data.qrCodeUrl as string) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}
