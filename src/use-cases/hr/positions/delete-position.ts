import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface DeletePositionRequest {
  tenantId: string;
  id: string;
}

export interface DeletePositionResponse {
  success: boolean;
}

export class DeletePositionUseCase {
  constructor(private positionsRepository: PositionsRepository) {}

  async execute(
    request: DeletePositionRequest,
  ): Promise<DeletePositionResponse> {
    const { id } = request;
    const positionId = new UniqueEntityID(id);

    const position = await this.positionsRepository.findById(
      positionId,
      request.tenantId,
    );
    if (!position) {
      throw new Error('Position not found');
    }

    // Check if position has employees
    const hasEmployees =
      await this.positionsRepository.hasEmployees(positionId);
    if (hasEmployees) {
      throw new Error('Cannot delete position with employees');
    }

    await this.positionsRepository.delete(positionId);

    return { success: true };
  }
}
