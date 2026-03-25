import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  FiscalConfig,
  type FiscalEnvironment,
  type FiscalProvider,
  type TaxRegime,
} from '@/entities/fiscal/fiscal-config';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';

interface ConfigureFiscalUseCaseRequest {
  tenantId: string;
  provider: FiscalProvider;
  environment: FiscalEnvironment;
  apiKey: string;
  apiSecret?: string;
  defaultSeries?: number;
  defaultCfop: string;
  defaultNaturezaOperacao: string;
  taxRegime: TaxRegime;
  nfceEnabled?: boolean;
  nfceCscId?: string;
  nfceCscToken?: string;
  contingencyMode?: boolean;
  contingencyReason?: string;
  settings?: Record<string, unknown>;
}

interface ConfigureFiscalUseCaseResponse {
  fiscalConfig: FiscalConfig;
}

export class ConfigureFiscalUseCase {
  constructor(private fiscalConfigsRepository: FiscalConfigsRepository) {}

  async execute(
    request: ConfigureFiscalUseCaseRequest,
  ): Promise<ConfigureFiscalUseCaseResponse> {
    const existingConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (existingConfig) {
      existingConfig.provider = request.provider;
      existingConfig.environment = request.environment;
      existingConfig.apiKey = request.apiKey;
      existingConfig.apiSecret = request.apiSecret;
      existingConfig.defaultCfop = request.defaultCfop;
      existingConfig.defaultNaturezaOperacao = request.defaultNaturezaOperacao;
      existingConfig.taxRegime = request.taxRegime;

      if (request.defaultSeries !== undefined) {
        existingConfig.defaultSeries = request.defaultSeries;
      }
      if (request.nfceEnabled !== undefined) {
        existingConfig.nfceEnabled = request.nfceEnabled;
      }
      if (request.nfceCscId !== undefined) {
        existingConfig.nfceCscId = request.nfceCscId;
      }
      if (request.nfceCscToken !== undefined) {
        existingConfig.nfceCscToken = request.nfceCscToken;
      }
      if (request.contingencyMode !== undefined) {
        existingConfig.contingencyMode = request.contingencyMode;
      }
      if (request.contingencyReason !== undefined) {
        existingConfig.contingencyReason = request.contingencyReason;
      }
      if (request.settings !== undefined) {
        existingConfig.settings = request.settings;
      }

      await this.fiscalConfigsRepository.save(existingConfig);
      return { fiscalConfig: existingConfig };
    }

    const fiscalConfig = FiscalConfig.create({
      tenantId: new UniqueEntityID(request.tenantId),
      provider: request.provider,
      environment: request.environment,
      apiKey: request.apiKey,
      apiSecret: request.apiSecret,
      defaultSeries: request.defaultSeries,
      defaultCfop: request.defaultCfop,
      defaultNaturezaOperacao: request.defaultNaturezaOperacao,
      taxRegime: request.taxRegime,
      nfceEnabled: request.nfceEnabled,
      nfceCscId: request.nfceCscId,
      nfceCscToken: request.nfceCscToken,
      contingencyMode: request.contingencyMode,
      contingencyReason: request.contingencyReason,
      settings: request.settings,
    });

    await this.fiscalConfigsRepository.create(fiscalConfig);
    return { fiscalConfig };
  }
}
