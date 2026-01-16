import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface BlockBinUseCaseRequest {
  id: string;
  reason: string;
}

interface BlockBinUseCaseResponse {
  bin: Bin;
}

export class BlockBinUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    id,
    reason,
  }: BlockBinUseCaseRequest): Promise<BlockBinUseCaseResponse> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('Block reason is required.');
    }

    const binId = new UniqueEntityID(id);

    const bin = await this.binsRepository.findById(binId);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    if (bin.isBlocked) {
      throw new BadRequestError('Bin is already blocked.');
    }

    bin.block(reason.trim());

    await this.binsRepository.save(bin);

    return { bin };
  }
}
