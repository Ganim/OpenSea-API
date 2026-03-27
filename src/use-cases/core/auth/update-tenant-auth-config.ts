import type { AuthLinkProvider } from '@/entities/core/auth-link';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantAuthConfigDTO } from '@/mappers/core/auth-link/tenant-auth-config-to-dto';
import { tenantAuthConfigToDTO } from '@/mappers/core/auth-link/tenant-auth-config-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { TenantAuthConfigRepository } from '@/repositories/core/tenant-auth-config-repository';

interface UpdateTenantAuthConfigUseCaseRequest {
  tenantId: UniqueEntityID;
  allowedMethods?: AuthLinkProvider[];
  magicLinkEnabled?: boolean;
  magicLinkExpiresIn?: number;
  defaultMethod?: AuthLinkProvider | null;
}

interface UpdateTenantAuthConfigUseCaseResponse {
  config: TenantAuthConfigDTO;
}

export class UpdateTenantAuthConfigUseCase {
  constructor(
    private tenantAuthConfigRepository: TenantAuthConfigRepository,
    private authLinksRepository: AuthLinksRepository,
  ) {}

  async execute({
    tenantId,
    allowedMethods,
    magicLinkEnabled,
    magicLinkExpiresIn,
    defaultMethod,
  }: UpdateTenantAuthConfigUseCaseRequest): Promise<UpdateTenantAuthConfigUseCaseResponse> {
    const config = await this.tenantAuthConfigRepository.upsert({
      tenantId,
      allowedMethods,
      magicLinkEnabled,
      magicLinkExpiresIn,
      defaultMethod,
    });

    return { config: tenantAuthConfigToDTO(config) };
  }
}
