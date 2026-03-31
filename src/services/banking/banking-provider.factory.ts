import { PluggyProvider } from './pluggy.provider';
import { SicoobProvider } from './sicoob.provider';
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
      if (!config.apiClientId || !certFileId || !keyFileId) {
        throw new Error(
          'Sicoob requires apiClientId, certificate and key files',
        );
      }
      return new SicoobProvider({
        clientId: config.apiClientId,
        certFileId,
        keyFileId,
        scopes: config.apiScopes?.split(',').map((s) => s.trim()) ?? [],
        accountNumber: config.accountNumber,
        agency: config.agency,
        certLoader,
      });

    case 'PLUGGY':
      return new PluggyProvider();

    default:
      throw new Error(`Unknown banking provider: ${provider}`);
  }
}
