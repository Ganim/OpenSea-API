import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantBrand } from '@/entities/sales/tenant-brand';
import type { TenantBrandsRepository } from '@/repositories/sales/tenant-brands-repository';

interface UpdateTenantBrandUseCaseRequest {
  tenantId: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontHeading?: string;
  tagline?: string;
  logoFileId?: string;
  logoIconFileId?: string;
  socialLinks?: Record<string, string>;
  contactInfo?: Record<string, unknown>;
}

interface UpdateTenantBrandUseCaseResponse {
  brand: TenantBrand;
}

export class UpdateTenantBrandUseCase {
  constructor(private tenantBrandsRepository: TenantBrandsRepository) {}

  async execute(
    request: UpdateTenantBrandUseCaseRequest,
  ): Promise<UpdateTenantBrandUseCaseResponse> {
    const brand = await this.tenantBrandsRepository.findByTenant(
      request.tenantId,
    );

    if (!brand) {
      throw new ResourceNotFoundError('Brand not found');
    }

    if (request.primaryColor !== undefined) brand.primaryColor = request.primaryColor;
    if (request.secondaryColor !== undefined) brand.secondaryColor = request.secondaryColor;
    if (request.accentColor !== undefined) brand.accentColor = request.accentColor;
    if (request.backgroundColor !== undefined) brand.backgroundColor = request.backgroundColor;
    if (request.textColor !== undefined) brand.textColor = request.textColor;
    if (request.fontFamily !== undefined) brand.fontFamily = request.fontFamily;
    if (request.fontHeading !== undefined) brand.fontHeading = request.fontHeading;
    if (request.tagline !== undefined) brand.tagline = request.tagline;
    if (request.logoFileId !== undefined) brand.logoFileId = request.logoFileId;
    if (request.logoIconFileId !== undefined) brand.logoIconFileId = request.logoIconFileId;
    if (request.socialLinks !== undefined) brand.socialLinks = request.socialLinks;
    if (request.contactInfo !== undefined) brand.contactInfo = request.contactInfo;

    await this.tenantBrandsRepository.save(brand);

    return { brand };
  }
}
