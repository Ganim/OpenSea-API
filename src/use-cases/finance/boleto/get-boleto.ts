import type {
  BankingProvider,
  BoletoResult,
} from '@/services/banking/banking-provider.interface';

export interface GetBoletoRequest {
  nossoNumero: string;
  bankAccountId: string;
}

export interface GetBoletoResponse {
  boleto: BoletoResult;
}

export class GetBoletoUseCase {
  constructor(
    private getProvider: (bankAccountId: string) => Promise<BankingProvider>,
  ) {}

  async execute(request: GetBoletoRequest): Promise<GetBoletoResponse> {
    const { nossoNumero, bankAccountId } = request;

    const provider = await this.getProvider(bankAccountId);
    await provider.authenticate();
    const boleto = await provider.getBoleto(nossoNumero);

    return { boleto };
  }
}
