import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { generateShortId } from '@/lib/short-id/generate-short-id';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

const SHORT_ID_MAX_ATTEMPTS = 10;

export interface RegenerateShortIdRequest {
  tenantId: string;
  employeeId: string;
}

export interface RegenerateShortIdResponse {
  employee: Employee;
  previousShortId: string | null;
}

/**
 * Regenerates the public shortId of an employee (Crockford-like, 6 chars).
 *
 * Used by Emporion POS operator login flow when an employee's shortId needs
 * to be rotated (compromise, fat-finger leak, employee request). Protected
 * by the `hr.employees.admin` permission. Bounded retry on collision (up to
 * {@link SHORT_ID_MAX_ATTEMPTS} attempts) within the same tenant.
 */
export class RegenerateShortIdUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: RegenerateShortIdRequest,
  ): Promise<RegenerateShortIdResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee');
    }

    const previousShortId = employee.shortId ?? null;

    let newShortId: string | null = null;
    for (let attempt = 0; attempt < SHORT_ID_MAX_ATTEMPTS; attempt++) {
      const candidate = generateShortId();
      const existingWithCandidate =
        await this.employeesRepository.findByShortId(candidate, tenantId);
      const isOwnedBySameEmployee =
        existingWithCandidate?.id.equals(employee.id) ?? false;
      if (!existingWithCandidate || isOwnedBySameEmployee) {
        newShortId = candidate;
        break;
      }
    }

    if (!newShortId) {
      throw new Error(
        `Não foi possível gerar shortId único após ${SHORT_ID_MAX_ATTEMPTS} tentativas.`,
      );
    }

    employee.shortId = newShortId;

    await this.employeesRepository.save(employee);

    return {
      employee,
      previousShortId,
    };
  }
}
