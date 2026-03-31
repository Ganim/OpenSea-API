import type {
  BankingProvider,
  PixChargeResult,
} from '@/services/banking/banking-provider.interface';

export interface GetPixChargeRequest {
  txId: string;
  bankAccountId: string;
}

export interface GetPixChargeResponse {
  pixCharge: PixChargeResult;
}

export class GetPixChargeUseCase {
  constructor(
    private getProvider: (bankAccountId: string) => Promise<BankingProvider>,
  ) {}

  async execute(request: GetPixChargeRequest): Promise<GetPixChargeResponse> {
    const { txId, bankAccountId } = request;

    const provider = await this.getProvider(bankAccountId);
    await provider.authenticate();
    const pixCharge = await provider.getPixCharge(txId);

    return { pixCharge };
  }
}
