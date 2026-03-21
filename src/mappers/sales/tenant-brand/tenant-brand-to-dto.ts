import type { TenantBrand } from '@/entities/sales/tenant-brand';

export interface TenantBrandDTO {
  id: string;
  tenantId: string;
  name: string;
  logoFileId: string | null;
  logoIconFileId: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontHeading: string | null;
  tagline: string | null;
  socialLinks: Record<string, string> | null;
  contactInfo: Record<string, unknown> | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export function tenantBrandToDTO(brand: TenantBrand): TenantBrandDTO {
  return {
    id: brand.id.toString(),
    tenantId: brand.tenantId.toString(),
    name: brand.name,
    logoFileId: brand.logoFileId ?? null,
    logoIconFileId: brand.logoIconFileId ?? null,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    backgroundColor: brand.backgroundColor,
    textColor: brand.textColor,
    fontFamily: brand.fontFamily,
    fontHeading: brand.fontHeading ?? null,
    tagline: brand.tagline ?? null,
    socialLinks: brand.socialLinks ?? null,
    contactInfo: brand.contactInfo ?? null,
    isDefault: brand.isDefault,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt ?? null,
  };
}
