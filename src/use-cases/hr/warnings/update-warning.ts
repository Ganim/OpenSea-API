import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface UpdateWarningRequest {
  tenantId: string;
  warningId: string;
  type?: string;
  severity?: string;
  reason?: string;
  description?: string;
  incidentDate?: Date;
  witnessName?: string;
  suspensionDays?: number;
  attachmentUrl?: string;
}

export interface UpdateWarningResponse {
  warning: EmployeeWarning;
}

export class UpdateWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: UpdateWarningRequest): Promise<UpdateWarningResponse> {
    const { tenantId, warningId, ...updateData } = request;

    const existingWarning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!existingWarning) {
      throw new ResourceNotFoundError('Warning');
    }

    if (!existingWarning.isActive()) {
      throw new BadRequestError(
        'Somente advertências ativas podem ser editadas',
      );
    }

    // Validate suspension days if type is SUSPENSION
    const effectiveType = updateData.type ?? existingWarning.type.value;
    if (
      effectiveType === 'SUSPENSION' &&
      updateData.suspensionDays !== undefined &&
      updateData.suspensionDays > 30
    ) {
      throw new BadRequestError(
        'Suspensão não pode exceder 30 dias (CLT Art. 474)',
      );
    }

    const updatedWarning = await this.employeeWarningsRepository.update({
      id: new UniqueEntityID(warningId),
      tenantId,
      ...updateData,
    });

    if (!updatedWarning) {
      throw new ResourceNotFoundError('Warning');
    }

    return { warning: updatedWarning };
  }
}
