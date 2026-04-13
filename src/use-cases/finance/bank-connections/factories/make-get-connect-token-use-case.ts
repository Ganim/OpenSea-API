import { PluggyProvider } from '@/services/banking/pluggy.provider';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';
import { GetConnectTokenUseCase } from '../get-connect-token';

export function makeGetConnectTokenUseCase() {
  const pluggyProvider = new PluggyProvider() as unknown as BankingProvider;

  return new GetConnectTokenUseCase(pluggyProvider);
}
