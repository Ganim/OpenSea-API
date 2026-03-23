import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidEmpenho } from '@/entities/sales/bid-empenho';
import type { BidEmpenhoTypeEnum } from '@/entities/sales/bid-empenho';
import type { BidContractsRepository } from '@/repositories/sales/bid-contracts-repository';
import type { BidEmpenhosRepository } from '@/repositories/sales/bid-empenhos-repository';

interface CreateBidEmpenhoUseCaseRequest {
  tenantId: string;
  contractId: string;
  empenhoNumber: string;
  type: string;
  value: number;
  issueDate: Date;
  notes?: string;
}

interface CreateBidEmpenhoUseCaseResponse {
  empenho: BidEmpenho;
}

export class CreateBidEmpenhoUseCase {
  constructor(
    private bidContractsRepository: BidContractsRepository,
    private bidEmpenhosRepository: BidEmpenhosRepository,
  ) {}

  async execute(
    request: CreateBidEmpenhoUseCaseRequest,
  ): Promise<CreateBidEmpenhoUseCaseResponse> {
    const contract = await this.bidContractsRepository.findById(
      new UniqueEntityID(request.contractId),
      request.tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Contract not found');
    }

    if (!request.empenhoNumber || request.empenhoNumber.trim().length === 0) {
      throw new BadRequestError('Empenho number is required');
    }

    const existing = await this.bidEmpenhosRepository.findByNumber(
      request.empenhoNumber,
      request.tenantId,
    );

    if (existing) {
      throw new BadRequestError('Empenho number already exists');
    }

    const empenho = BidEmpenho.create({
      tenantId: new UniqueEntityID(request.tenantId),
      contractId: new UniqueEntityID(request.contractId),
      empenhoNumber: request.empenhoNumber.trim(),
      type: request.type as BidEmpenhoTypeEnum,
      value: request.value,
      issueDate: request.issueDate,
      notes: request.notes,
    });

    await this.bidEmpenhosRepository.create(empenho);

    return { empenho };
  }
}
