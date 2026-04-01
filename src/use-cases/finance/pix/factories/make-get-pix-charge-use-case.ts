import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { GetPixChargeUseCase } from '../get-pix-charge';

export function makeGetPixChargeUseCase() {
  return new GetPixChargeUseCase(getBankingProviderForAccount);
}
