import type {
  AiTenantConfigRepository,
  UpdateAiTenantConfigSchema,
} from '@/repositories/ai/ai-tenant-config-repository';

interface UpdateAiConfigRequest
  extends Omit<UpdateAiTenantConfigSchema, 'tenantId'> {
  tenantId: string;
}

export class UpdateAiConfigUseCase {
  constructor(private configRepository: AiTenantConfigRepository) {}

  async execute(request: UpdateAiConfigRequest) {
    const config = await this.configRepository.upsert(request);

    return {
      config: {
        ...config,
        tier1ApiKey: config.tier1ApiKey ? '••••••••' : null,
        tier2ApiKey: config.tier2ApiKey ? '••••••••' : null,
        tier3ApiKey: config.tier3ApiKey ? '••••••••' : null,
      },
    };
  }
}
