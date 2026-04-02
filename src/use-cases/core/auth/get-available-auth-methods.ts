import type { AuthLinkProvider } from '@/entities/core/auth-link';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantAuthConfigRepository } from '@/repositories/core/tenant-auth-config-repository';

interface GetAvailableAuthMethodsUseCaseRequest {
  tenantId?: UniqueEntityID;
}

interface GetAvailableAuthMethodsUseCaseResponse {
  methods: AuthLinkProvider[];
  magicLinkEnabled: boolean;
  defaultMethod: AuthLinkProvider | null;
}

export class GetAvailableAuthMethodsUseCase {
  constructor(private tenantAuthConfigRepository: TenantAuthConfigRepository) {}

  async execute({
    tenantId,
  }: GetAvailableAuthMethodsUseCaseRequest): Promise<GetAvailableAuthMethodsUseCaseResponse> {
    if (!tenantId) {
      return {
        methods: ['EMAIL'],
        magicLinkEnabled: false,
        defaultMethod: null,
      };
    }

    const config =
      await this.tenantAuthConfigRepository.findByTenantId(tenantId);

    if (!config) {
      return {
        methods: ['EMAIL'],
        magicLinkEnabled: false,
        defaultMethod: null,
      };
    }

    return {
      methods: config.allowedMethods,
      magicLinkEnabled: config.magicLinkEnabled,
      defaultMethod: config.defaultMethod,
    };
  }
}
