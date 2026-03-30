import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { MedicalExamType } from '@/entities/hr/medical-exam';
import type { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import { OccupationalExamRequirementsRepository } from '@/repositories/hr/occupational-exam-requirements-repository';

export interface CreateExamRequirementRequest {
  tenantId: string;
  positionId?: string;
  examType: string;
  examCategory: MedicalExamType;
  frequencyMonths: number;
  isMandatory?: boolean;
  description?: string;
}

export interface CreateExamRequirementResponse {
  examRequirement: OccupationalExamRequirement;
}

export class CreateExamRequirementUseCase {
  constructor(
    private examRequirementsRepository: OccupationalExamRequirementsRepository,
  ) {}

  async execute(
    request: CreateExamRequirementRequest,
  ): Promise<CreateExamRequirementResponse> {
    const {
      tenantId,
      positionId,
      examType,
      examCategory,
      frequencyMonths,
      isMandatory,
      description,
    } = request;

    if (!examType || examType.trim().length === 0) {
      throw new BadRequestError('O tipo de exame é obrigatório');
    }

    if (frequencyMonths < 1) {
      throw new BadRequestError('A frequência deve ser de pelo menos 1 mês');
    }

    const examRequirement = await this.examRequirementsRepository.create({
      tenantId,
      positionId,
      examType: examType.trim(),
      examCategory,
      frequencyMonths,
      isMandatory,
      description: description?.trim(),
    });

    return { examRequirement };
  }
}
