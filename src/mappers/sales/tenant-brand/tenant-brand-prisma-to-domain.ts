import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantBrand } from '@/entities/sales/tenant-brand';

export function tenantBrandPrismaToDomain(
  data: Record<string, unknown>,
): TenantBrand {
  return TenantBrand.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      name: data.name as string,
      logoFileId: (data.logoFileId as string) ?? undefined,
      logoIconFileId: (data.logoIconFileId as string) ?? undefined,
      primaryColor: data.primaryColor as string,
      secondaryColor: data.secondaryColor as string,
      accentColor: data.accentColor as string,
      backgroundColor: data.backgroundColor as string,
      textColor: data.textColor as string,
      fontFamily: data.fontFamily as string,
      fontHeading: (data.fontHeading as string) ?? undefined,
      tagline: (data.tagline as string) ?? undefined,
      socialLinks: (data.socialLinks as Record<string, string>) ?? undefined,
      contactInfo: (data.contactInfo as Record<string, unknown>) ?? undefined,
      isDefault: data.isDefault as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}
