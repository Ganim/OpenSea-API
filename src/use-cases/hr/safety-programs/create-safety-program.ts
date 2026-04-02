import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { SafetyProgram } from '@/entities/hr/safety-program';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';

export interface CreateSafetyProgramRequest {
  tenantId: string;
  type: string;
  name: string;
  validFrom: Date;
  validUntil: Date;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl?: string;
  status?: string;
  notes?: string;
}

export interface CreateSafetyProgramResponse {
  safetyProgram: SafetyProgram;
}

export class CreateSafetyProgramUseCase {
  constructor(private safetyProgramsRepository: SafetyProgramsRepository) {}

  async execute(
    request: CreateSafetyProgramRequest,
  ): Promise<CreateSafetyProgramResponse> {
    const {
      tenantId,
      type,
      name,
      validFrom,
      validUntil,
      responsibleName,
      responsibleRegistration,
      documentUrl,
      status,
      notes,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do programa é obrigatório');
    }

    if (!responsibleName || responsibleName.trim().length === 0) {
      throw new BadRequestError('O nome do responsável é obrigatório');
    }

    if (
      !responsibleRegistration ||
      responsibleRegistration.trim().length === 0
    ) {
      throw new BadRequestError(
        'O registro profissional do responsável é obrigatório',
      );
    }

    if (validUntil <= validFrom) {
      throw new BadRequestError(
        'A data de validade deve ser posterior à data de início',
      );
    }

    const safetyProgram = await this.safetyProgramsRepository.create({
      tenantId,
      type,
      name: name.trim(),
      validFrom,
      validUntil,
      responsibleName: responsibleName.trim(),
      responsibleRegistration: responsibleRegistration.trim(),
      documentUrl,
      status,
      notes: notes?.trim(),
    });

    return { safetyProgram };
  }
}
