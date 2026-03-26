import { PluggyProvider } from '@/services/banking/pluggy.provider';
import { GetConnectTokenUseCase } from '../get-connect-token';

export function makeGetConnectTokenUseCase() {
  const pluggyProvider = new PluggyProvider();

  return new GetConnectTokenUseCase(pluggyProvider);
}
