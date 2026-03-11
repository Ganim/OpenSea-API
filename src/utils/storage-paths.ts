export function productStoragePath(
  tenantId: string,
  productSlug: string,
): string {
  return `/tenants/${tenantId}/products/${productSlug}`;
}

export function variantImagesPath(
  tenantId: string,
  productSlug: string,
  variantSlug: string,
): string {
  return `/tenants/${tenantId}/products/${productSlug}/variants/${variantSlug}/images`;
}

export function productAttachmentsPath(
  tenantId: string,
  productSlug: string,
): string {
  return `/tenants/${tenantId}/products/${productSlug}/attachments`;
}

export function variantAttachmentsPath(
  tenantId: string,
  productSlug: string,
  variantSlug: string,
): string {
  return `/tenants/${tenantId}/products/${productSlug}/variants/${variantSlug}/attachments`;
}
