import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { TenantBrand } from '@/entities/sales/tenant-brand';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type { TenantBrandsRepository } from '../tenant-brands-repository';

function mapToDomain(data: Record<string, unknown>): TenantBrand {
  return TenantBrand.create(
    {
      tenantId: new EntityID(data.tenantId as string),
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
    new EntityID(data.id as string),
  );
}

export class PrismaTenantBrandsRepository implements TenantBrandsRepository {
  async create(brand: TenantBrand): Promise<void> {
    await prisma.tenantBrand.create({
      data: {
        id: brand.id.toString(),
        tenantId: brand.tenantId.toString(),
        name: brand.name,
        logoFileId: brand.logoFileId,
        logoIconFileId: brand.logoIconFileId,
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        textColor: brand.textColor,
        fontFamily: brand.fontFamily,
        fontHeading: brand.fontHeading,
        tagline: brand.tagline,
        socialLinks: (brand.socialLinks ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
        contactInfo: (brand.contactInfo ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
        isDefault: brand.isDefault,
        createdAt: brand.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TenantBrand | null> {
    const data = await prisma.tenantBrand.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findByTenant(tenantId: string): Promise<TenantBrand | null> {
    const data = await prisma.tenantBrand.findFirst({
      where: {
        tenantId,
        isDefault: true,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async save(brand: TenantBrand): Promise<void> {
    await prisma.tenantBrand.update({
      where: { id: brand.id.toString() },
      data: {
        name: brand.name,
        logoFileId: brand.logoFileId,
        logoIconFileId: brand.logoIconFileId,
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        textColor: brand.textColor,
        fontFamily: brand.fontFamily,
        fontHeading: brand.fontHeading,
        tagline: brand.tagline,
        socialLinks: (brand.socialLinks ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
        contactInfo: (brand.contactInfo ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }
}
