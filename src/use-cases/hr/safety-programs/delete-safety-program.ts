import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SafetyProgram } from '@/entities/hr/safety-program';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';

export interface DeleteSafetyProgramRequest {
  tenantId: string;
  programId: string;
}

export interface DeleteSafetyProgramResponse {
  safetyProgram: SafetyProgram;
}

export class DeleteSafetyProgramUseCase {
  constructor(private safetyProgramsRepository: SafetyProgramsRepository) {}

  async execute(
    request: DeleteSafetyProgramRequest,
  ): Promise<DeleteSafetyProgramResponse> {
    const { tenantId, programId } = request;

    const safetyProgram = await this.safetyProgramsRepository.findById(
      new UniqueEntityID(programId),
      tenantId,
    );

    if (!safetyProgram) {
      throw new ResourceNotFoundError('Programa de segurança não encontrado');
    }

    await this.safetyProgramsRepository.delete(new UniqueEntityID(programId));

    return { safetyProgram };
  }
}
