import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  BankingProvider,
  BoletoResult,
} from '@/services/banking/banking-provider.interface';

export interface EmitBoletoRequest {
  tenantId: string;
  entryId: string;
  bankAccountId: string;
  isHybrid?: boolean;
}

export interface EmitBoletoResponse {
  boleto: BoletoResult;
}

export class EmitBoletoUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private getProvider: (bankAccountId: string) => Promise<BankingProvider>,
  ) {}

  async execute(request: EmitBoletoRequest): Promise<EmitBoletoResponse> {
    const { tenantId, entryId, bankAccountId, isHybrid } = request;

    // Validate entry exists and belongs to tenant
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    if (entry.type !== 'RECEIVABLE') {
      throw new BadRequestError(
        'Boleto emission is only available for receivable entries',
      );
    }

    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'Boleto can only be emitted for entries with PENDING or OVERDUE status',
      );
    }

    // Validate bank account exists and belongs to tenant
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount) {
      throw new ResourceNotFoundError('Bank account');
    }

    // Validate customer name
    if (!entry.customerName || entry.customerName.trim().length === 0) {
      throw new BadRequestError('Customer name is required to emit a boleto');
    }

    const dueDate = entry.dueDate.toISOString().split('T')[0];

    // Get provider (factory validates apiProvider is set), authenticate and emit
    const provider = await this.getProvider(bankAccountId);
    await provider.authenticate();

    const boleto = await provider.createBoleto({
      amount: entry.expectedAmount,
      dueDate,
      customerName: entry.customerName,
      customerCpfCnpj: entry.beneficiaryCpfCnpj ?? '',
      description: entry.description,
      isHybrid,
    });

    // Persist boleto data on the entry
    await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      boletoBarcode: boleto.barcode,
      boletoDigitLine: boleto.digitableLine,
      boletoDigitableLine: boleto.digitableLine,
      boletoBarcodeNumber: boleto.nossoNumero,
      boletoPdfUrl: boleto.pdfUrl ?? null,
    });

    return { boleto };
  }
}
