import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface GetBinByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetBinByIdUseCaseResponse {
  bin: Bin;
  itemCount: number;
}

export class GetBinByIdUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetBinByIdUseCaseRequest): Promise<GetBinByIdUseCaseResponse> {
    const binId = new UniqueEntityID(id);

    const bin = await this.binsRepository.findById(binId, tenantId);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    const itemCount = await this.binsRepository.countItemsInBin(binId);

    return { bin, itemCount };
  }
}
