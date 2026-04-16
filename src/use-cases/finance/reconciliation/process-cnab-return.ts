import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import {
  parseCnab240Return,
  type CnabReturnRecord,
} from '@/utils/finance/cnab-240-parser';

interface ProcessCnabReturnUseCaseRequest {
  tenantId: string;
  fileContent: string;
  bankAccountId: string;
}

interface CnabProcessedDetail {
  boletoNumber: string;
  amount: number;
  status: 'MATCHED' | 'NOT_FOUND' | 'ALREADY_PAID' | 'ERROR';
  entryId?: string;
  errorMessage?: string;
}

interface ProcessCnabReturnUseCaseResponse {
  processed: number;
  matched: number;
  unmatched: number;
  errors: string[];
  details: CnabProcessedDetail[];
}

export class ProcessCnabReturnUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: ProcessCnabReturnUseCaseRequest,
  ): Promise<ProcessCnabReturnUseCaseResponse> {
    const { tenantId, fileContent } = request;

    if (!fileContent || fileContent.trim().length === 0) {
      throw new BadRequestError('Conteúdo do arquivo CNAB está vazio');
    }

    const cnabRecords = parseCnab240Return(fileContent);

    if (cnabRecords.length === 0) {
      throw new BadRequestError(
        'Nenhum registro válido encontrado no arquivo CNAB',
      );
    }

    const confirmedRecords = cnabRecords.filter(
      (record) => record.status === '00',
    );

    const details: CnabProcessedDetail[] = [];
    const errorMessages: string[] = [];
    let matchedCount = 0;

    for (const record of confirmedRecords) {
      const processedDetail = await this.processRecord(
        tenantId,
        record,
        errorMessages,
      );
      details.push(processedDetail);

      if (processedDetail.status === 'MATCHED') {
        matchedCount++;
      }
    }

    // Also report non-confirmed records as NOT_FOUND
    const nonConfirmedRecords = cnabRecords.filter(
      (record) => record.status !== '00',
    );

    for (const record of nonConfirmedRecords) {
      details.push({
        boletoNumber: record.boletoNumber,
        amount: record.amount,
        status: 'NOT_FOUND',
      });
    }

    return {
      processed: cnabRecords.length,
      matched: matchedCount,
      unmatched: cnabRecords.length - matchedCount,
      errors: errorMessages,
      details,
    };
  }

  private async processRecord(
    tenantId: string,
    record: CnabReturnRecord,
    errorMessages: string[],
  ): Promise<CnabProcessedDetail> {
    try {
      const matchedEntry = await this.findEntryByBoleto(
        tenantId,
        record.boletoNumber,
      );

      if (!matchedEntry) {
        return {
          boletoNumber: record.boletoNumber,
          amount: record.amount,
          status: 'NOT_FOUND',
        };
      }

      if (
        matchedEntry.status === 'PAID' ||
        matchedEntry.status === 'RECEIVED'
      ) {
        return {
          boletoNumber: record.boletoNumber,
          amount: record.amount,
          status: 'ALREADY_PAID',
          entryId: matchedEntry.id.toString(),
        };
      }

      matchedEntry.markAsPaid(record.amount, record.paymentDate);

      await this.financeEntriesRepository.update({
        id: matchedEntry.id,
        tenantId,
        status: matchedEntry.status,
        actualAmount: matchedEntry.actualAmount,
        paymentDate: record.paymentDate,
      });

      return {
        boletoNumber: record.boletoNumber,
        amount: record.amount,
        status: 'MATCHED',
        entryId: matchedEntry.id.toString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errorMessages.push(
        `Erro ao processar boleto ${record.boletoNumber}: ${errorMessage}`,
      );
      return {
        boletoNumber: record.boletoNumber,
        amount: record.amount,
        status: 'ERROR',
        errorMessage,
      };
    }
  }

  private async findEntryByBoleto(tenantId: string, boletoNumber: string) {
    // Fetch entries and match against all boleto identifier fields
    const entriesResult = await this.financeEntriesRepository.findMany({
      tenantId,
      limit: 1000,
    });

    const matchedEntry = entriesResult.entries.find(
      (entry) =>
        entry.boletoBarcodeNumber === boletoNumber ||
        entry.boletoBarcode === boletoNumber ||
        entry.boletoDigitLine === boletoNumber ||
        entry.boletoDigitableLine === boletoNumber,
    );

    return matchedEntry ?? null;
  }
}
