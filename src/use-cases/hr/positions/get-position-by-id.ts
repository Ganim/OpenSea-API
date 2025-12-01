import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface GetPositionByIdRequest {
  id: string;
}

export interface GetPositionByIdResponse {
  position: Position;
}

export class GetPositionByIdUseCase {
  constructor(private positionsRepository: PositionsRepository) {}

  async execute(
    request: GetPositionByIdRequest,
  ): Promise<GetPositionByIdResponse> {
    const { id } = request;

    const position = await this.positionsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!position) {
      throw new Error('Position not found');
    }

    return { position };
  }
}
