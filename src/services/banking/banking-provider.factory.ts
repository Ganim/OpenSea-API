import { PluggyProvider } from './pluggy.provider';
import type { BankingProvider } from './banking-provider.interface';

interface BankAccountApiConfig {
  apiProvider: string | null;
  apiClientId: string | null;
  apiScopes: string | null;
  bankCode: string;
  agency: string;
  accountNumber: string;
}

interface CertificateLoader {
  loadCertBuffers(
    certFileId: string,
    keyFileId: string,
  ): Promise<{
    cert: Buffer;
    key: Buffer;
  }>;
}

export function createBankingProvider(
  config: BankAccountApiConfig,
  certLoader: CertificateLoader,
  certFileId?: string | null,
  keyFileId?: string | null,
): BankingProvider {
  const provider = config.apiProvider?.toUpperCase();

  switch (provider) {
    case 'SICOOB':
      // SicoobProvider will be added in Task 3
      throw new Error('SicoobProvider not yet implemented');

    case 'PLUGGY':
      return new PluggyProvider();

    default:
      throw new Error(`Unknown banking provider: ${provider}`);
  }
}
