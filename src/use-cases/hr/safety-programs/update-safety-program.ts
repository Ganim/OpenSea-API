import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SafetyProgram } from '@/entities/hr/safety-program';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';

export interface UpdateSafetyProgramRequest {
  tenantId: string;
  programId: string;
  type?: string;
  name?: string;
  validFrom?: Date;
  validUntil?: Date;
  responsibleName?: string;
  responsibleRegistration?: string;
  documentUrl?: string;
  status?: string;
  notes?: string;
}

export interface UpdateSafetyProgramResponse {
  safetyProgram: SafetyProgram;
}

export class UpdateSafetyProgramUseCase {
  constructor(private safetyProgramsRepository: SafetyProgramsRepository) {}

  async execute(
    request: UpdateSafetyProgramRequest,
  ): Promise<UpdateSafetyProgramResponse> {
    const { tenantId, programId, ...data } = request;

    const existing = await this.safetyProgramsRepository.findById(
      new UniqueEntityID(programId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Programa de segurança não encontrado');
    }

    const safetyProgram = await this.safetyProgramsRepository.update({
      id: new UniqueEntityID(programId),
      type: data.type,
      name: data.name?.trim(),
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      responsibleName: data.responsibleName?.trim(),
      responsibleRegistration: data.responsibleRegistration?.trim(),
      documentUrl: data.documentUrl,
      status: data.status,
      notes: data.notes?.trim(),
    });

    if (!safetyProgram) {
      throw new ResourceNotFoundError('Programa de segurança não encontrado');
    }

    return { safetyProgram };
  }
}
