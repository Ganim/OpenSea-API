import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type ContractDTO,
  contractToDTO,
} from '@/mappers/finance/contract/contract-to-dto';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetSupplierHistoryRequest {
  tenantId: string;
  companyId?: string;
  companyName?: string;
}

interface GetSupplierHistoryResponse {
  contracts: ContractDTO[];
  totalContracts: number;
  totalPaymentsValue: number;
  totalPaymentsCount: number;
}

export class GetSupplierHistoryUseCase {
  constructor(
    private contractsRepository: ContractsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GetSupplierHistoryRequest,
  ): Promise<GetSupplierHistoryResponse> {
    const { tenantId, companyId, companyName } = request;

    if (!companyId && !companyName) {
      throw new BadRequestError('Either companyId or companyName is required');
    }

    // Find contracts for this supplier
    let contracts;
    if (companyId) {
      contracts = await this.contractsRepository.findByCompanyId(
        companyId,
        tenantId,
      );
    } else {
      contracts = await this.contractsRepository.findByCompanyName(
        companyName!,
        tenantId,
      );
    }

    // Aggregate payment info from finance entries for this supplier
    const supplierFilter = companyId
      ? { supplierName: undefined }
      : { supplierName: companyName };

    const entries = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      ...supplierFilter,
      limit: 1000,
    });

    // Filter entries for paid/received status
    const paidEntries = entries.entries.filter((e) =>
      ['PAID', 'RECEIVED', 'PARTIALLY_PAID'].includes(e.status),
    );

    const totalPaymentsValue = paidEntries.reduce(
      (sum, e) => sum + (e.actualAmount ?? e.expectedAmount),
      0,
    );

    return {
      contracts: contracts.map(contractToDTO),
      totalContracts: contracts.length,
      totalPaymentsValue,
      totalPaymentsCount: paidEntries.length,
    };
  }
}
