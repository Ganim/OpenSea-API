import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CreateWarningRequest {
  tenantId: string;
  employeeId: string;
  issuedBy: string;
  type: string;
  severity: string;
  reason: string;
  description?: string;
  incidentDate: Date;
  witnessName?: string;
  suspensionDays?: number;
  attachmentUrl?: string;
}

export interface CreateWarningResponse {
  warning: EmployeeWarning;
}

export class CreateWarningUseCase {
  constructor(
    private employeeWarningsRepository: EmployeeWarningsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: CreateWarningRequest): Promise<CreateWarningResponse> {
    const {
      tenantId,
      employeeId,
      issuedBy,
      type,
      severity,
      reason,
      description,
      incidentDate,
      witnessName,
      suspensionDays,
      attachmentUrl,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    // Verify issuer exists
    const issuer = await this.employeesRepository.findById(
      new UniqueEntityID(issuedBy),
      tenantId,
    );
    if (!issuer) {
      throw new ResourceNotFoundError('Issuer employee not found');
    }

    // Verify employee is not the issuer
    if (employeeId === issuedBy) {
      throw new BadRequestError(
        'O emissor não pode aplicar advertência em si mesmo',
      );
    }

    // Verify suspension days required for SUSPENSION type
    if (type === 'SUSPENSION' && (!suspensionDays || suspensionDays < 1)) {
      throw new BadRequestError(
        'Dias de suspensão são obrigatórios para advertências do tipo suspensão',
      );
    }

    // Suspension cannot exceed 30 days (CLT Art. 474)
    if (type === 'SUSPENSION' && suspensionDays && suspensionDays > 30) {
      throw new BadRequestError(
        'Suspensão não pode exceder 30 dias (CLT Art. 474)',
      );
    }

    const warning = await this.employeeWarningsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      issuedBy: new UniqueEntityID(issuedBy),
      type,
      severity,
      reason,
      description,
      incidentDate,
      witnessName,
      suspensionDays,
      attachmentUrl,
    });

    return { warning };
  }
}
