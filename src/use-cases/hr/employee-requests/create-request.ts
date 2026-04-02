import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  EmployeeRequest,
  type EmployeeRequestType,
} from '@/entities/hr/employee-request';
import type { EmployeeRequestsRepository } from '@/repositories/hr/employee-requests-repository';

const VALID_TYPES: EmployeeRequestType[] = [
  'VACATION',
  'ABSENCE',
  'ADVANCE',
  'DATA_CHANGE',
  'SUPPORT',
];

export interface CreateRequestInput {
  tenantId: string;
  employeeId: string;
  type: string;
  data: Record<string, unknown>;
}

export interface CreateRequestOutput {
  employeeRequest: EmployeeRequest;
}

export class CreateRequestUseCase {
  constructor(private employeeRequestsRepository: EmployeeRequestsRepository) {}

  async execute(input: CreateRequestInput): Promise<CreateRequestOutput> {
    const { tenantId, employeeId, type, data } = input;

    if (!VALID_TYPES.includes(type as EmployeeRequestType)) {
      throw new BadRequestError(
        `Invalid request type: ${type}. Valid types: ${VALID_TYPES.join(', ')}`,
      );
    }

    const employeeRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: type as EmployeeRequestType,
      status: 'PENDING',
      data,
    });

    await this.employeeRequestsRepository.create(employeeRequest);

    return { employeeRequest };
  }
}
