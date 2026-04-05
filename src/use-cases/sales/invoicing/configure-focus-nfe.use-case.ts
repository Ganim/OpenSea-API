import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';

interface ConfigureFocusNfeUseCaseRequest {
  tenantId: string;
  apiKey: string;
  productionMode: boolean;
  autoIssueOnConfirm?: boolean;
  defaultSeries?: string;
  userId: string;
}

interface ConfigureFocusNfeUseCaseResponse {
  id: string;
  configured: boolean;
  message: string;
  productionMode: boolean;
  isEnabled: boolean;
}

export class ConfigureFocusNfeUseCase {
  constructor(
    private focusNfeConfigRepository: FocusNfeConfigRepository,
    private focusNfeProvider: IFocusNfeProvider,
  ) {}

  async execute(
    request: ConfigureFocusNfeUseCaseRequest,
  ): Promise<ConfigureFocusNfeUseCaseResponse> {
    // Testa conexão com Focus NFe
    const connectionTest = await this.focusNfeProvider.testConnection(
      request.apiKey,
      request.productionMode,
    );

    if (!connectionTest.ok) {
      throw new Error(
        `Failed to connect to Focus NFe: ${connectionTest.message}`,
      );
    }

    // Busca configuração existente
    let config = await this.focusNfeConfigRepository.findByTenant(request.tenantId);

    if (config) {
      // Atualiza configuração existente
      config.apiKey = request.apiKey;
      config.productionMode = request.productionMode;
      config.isEnabled = true;
      config.autoIssueOnConfirm = request.autoIssueOnConfirm ?? true;
      config.defaultSeries = request.defaultSeries ?? '1';
      config.updatedBy = request.userId;

      await this.focusNfeConfigRepository.save(config);
    } else {
      // Cria nova configuração
      config = FocusNfeConfig.create({
        tenantId: new UniqueEntityID(request.tenantId),
        apiKey: request.apiKey,
        productionMode: request.productionMode,
        isEnabled: true,
        autoIssueOnConfirm: request.autoIssueOnConfirm ?? true,
        defaultSeries: request.defaultSeries ?? '1',
        createdBy: request.userId,
        updatedBy: request.userId,
      });

      await this.focusNfeConfigRepository.create(config);
    }

    return {
      id: config.id.toString(),
      configured: true,
      message: 'Focus NFe configured successfully',
      productionMode: config.productionMode,
      isEnabled: config.isEnabled,
    };
  }
}
