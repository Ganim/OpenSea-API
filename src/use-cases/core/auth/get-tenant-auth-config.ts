import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantAuthConfigDTO } from '@/mappers/core/auth-link/tenant-auth-config-to-dto';
import { tenantAuthConfigToDTO } from '@/mappers/core/auth-link/tenant-auth-config-to-dto';
import type { TenantAuthConfigRepository } from '@/repositories/core/tenant-auth-config-repository';

interface GetTenantAuthConfigUseCaseRequest {
  tenantId: UniqueEntityID;
}

interface GetTenantAuthConfigUseCaseResponse {
  config: TenantAuthConfigDTO;
}

export class GetTenantAuthConfigUseCase {
  constructor(
    private tenantAuthConfigRepository: TenantAuthConfigRepository,
  ) {}

  async execute({
    tenantId,
  }: GetTenantAuthConfigUseCaseRequest): Promise<GetTenantAuthConfigUseCaseResponse> {
    const config =
      await this.tenantAuthConfigRepository.findByTenantId(tenantId);

    if (!config) {
      // Return default config
      return {
        config: {
          id: '',
          tenantId: tenantId.toString(),
          allowedMethods: ['EMAIL'],
          magicLinkEnabled: false,
          magicLinkExpiresIn: 15,
          defaultMethod: null,
        },
      };
    }

    return { config: tenantAuthConfigToDTO(config) };
  }
}
