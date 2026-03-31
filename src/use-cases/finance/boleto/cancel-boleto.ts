import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';

export interface CancelBoletoRequest {
  tenantId: string;
  entryId: string;
  bankAccountId: string;
}

export class CancelBoletoUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private getProvider: (bankAccountId: string) => Promise<BankingProvider>,
  ) {}

  async execute(request: CancelBoletoRequest): Promise<void> {
    const { tenantId, entryId, bankAccountId } = request;

    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    // nossoNumero is stored in boletoBarcodeNumber
    const nossoNumero = entry.boletoBarcodeNumber;
    if (!nossoNumero) {
      throw new ResourceNotFoundError('Boleto not found for this entry');
    }

    const provider = await this.getProvider(bankAccountId);
    await provider.authenticate();
    await provider.cancelBoleto(nossoNumero);

    // Clear boleto fields from entry
    await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      boletoBarcode: null,
      boletoDigitLine: null,
      boletoDigitableLine: null,
      boletoBarcodeNumber: null,
      boletoPdfUrl: null,
    });
  }
}
