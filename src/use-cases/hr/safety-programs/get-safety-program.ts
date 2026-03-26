import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SafetyProgram } from '@/entities/hr/safety-program';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';

export interface GetSafetyProgramRequest {
  tenantId: string;
  programId: string;
}

export interface GetSafetyProgramResponse {
  safetyProgram: SafetyProgram;
}

export class GetSafetyProgramUseCase {
  constructor(private safetyProgramsRepository: SafetyProgramsRepository) {}

  async execute(
    request: GetSafetyProgramRequest,
  ): Promise<GetSafetyProgramResponse> {
    const { tenantId, programId } = request;

    const safetyProgram = await this.safetyProgramsRepository.findById(
      new UniqueEntityID(programId),
      tenantId,
    );

    if (!safetyProgram) {
      throw new ResourceNotFoundError('Programa de segurança não encontrado');
    }

    return { safetyProgram };
  }
}
