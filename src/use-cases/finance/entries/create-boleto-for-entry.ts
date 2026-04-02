import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  EfiBoletoProvider,
  BoletoResult,
} from '@/services/cashier/efi-boleto.provider';

interface CreateBoletoForEntryRequest {
  entryId: string;
  tenantId: string;
  customerCpfCnpj: string;
  instructions?: string[];
}

interface CreateBoletoForEntryResponse {
  entry: FinanceEntryDTO;
  boleto: BoletoResult;
}

export class CreateBoletoForEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private efiBoletoProvider: EfiBoletoProvider,
  ) {}

  async execute(
    request: CreateBoletoForEntryRequest,
  ): Promise<CreateBoletoForEntryResponse> {
    const { entryId, tenantId, customerCpfCnpj, instructions } = request;

    // Find entry
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    // Validate entry is RECEIVABLE
    if (entry.type !== 'RECEIVABLE') {
      throw new BadRequestError(
        'Boleto generation is only available for receivable entries',
      );
    }

    // Validate status is PENDING or OVERDUE
    if (entry.status !== 'PENDING' && entry.status !== 'OVERDUE') {
      throw new BadRequestError(
        'Boleto can only be generated for entries with PENDING or OVERDUE status',
      );
    }

    // Validate customer name exists
    if (!entry.customerName || entry.customerName.trim().length === 0) {
      throw new BadRequestError(
        'Customer name is required to generate a boleto',
      );
    }

    // Validate CPF/CNPJ
    const cleanCpfCnpj = customerCpfCnpj.replace(/\D/g, '');
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      throw new BadRequestError(
        'CPF/CNPJ is invalid. Must be 11 (CPF) or 14 (CNPJ) digits',
      );
    }

    // Check if entry already has a boleto
    if (entry.boletoChargeId) {
      throw new BadRequestError('This entry already has a registered boleto');
    }

    // Calculate amount in cents
    const amountInCents = Math.round(entry.totalDue * 100);

    if (amountInCents <= 0) {
      throw new BadRequestError(
        'Entry total due must be greater than zero to generate a boleto',
      );
    }

    // Format due date
    const dueDate = entry.dueDate.toISOString().split('T')[0];

    // Call Efi boleto provider
    const boleto = await this.efiBoletoProvider.createBoleto({
      amount: amountInCents,
      dueDate,
      customerName: entry.customerName,
      customerCpfCnpj: cleanCpfCnpj,
      description: entry.description,
      instructions,
    });

    // Update entry with boleto fields
    const updatedEntry = await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      boletoChargeId: boleto.chargeId,
      boletoBarcodeNumber: boleto.barcodeNumber,
      boletoDigitableLine: boleto.digitableLine,
      boletoPdfUrl: boleto.pdfUrl,
    });

    if (!updatedEntry) {
      throw new ResourceNotFoundError('Finance entry');
    }

    return {
      entry: financeEntryToDTO(updatedEntry),
      boleto,
    };
  }
}
