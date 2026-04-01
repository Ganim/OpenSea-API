import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { GetBoletoUseCase } from '../get-boleto';

export function makeGetBoletoUseCase() {
  return new GetBoletoUseCase(getBankingProviderForAccount);
}
