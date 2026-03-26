import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMember } from '@/entities/hr/cipa-member';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';
import { CipaMembersRepository } from '@/repositories/hr/cipa-members-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface AddCipaMemberRequest {
  tenantId: string;
  mandateId: string;
  employeeId: string;
  role: string;
  type: string;
}

export interface AddCipaMemberResponse {
  cipaMember: CipaMember;
}

export class AddCipaMemberUseCase {
  constructor(
    private cipaMembersRepository: CipaMembersRepository,
    private cipaMandatesRepository: CipaMandatesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AddCipaMemberRequest,
  ): Promise<AddCipaMemberResponse> {
    const { tenantId, mandateId, employeeId, role, type } = request;

    // Verify mandate exists
    const mandate = await this.cipaMandatesRepository.findById(
      new UniqueEntityID(mandateId),
      tenantId,
    );

    if (!mandate) {
      throw new ResourceNotFoundError('Mandato CIPA não encontrado');
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Check if employee is already a member of this mandate
    const existingMember =
      await this.cipaMembersRepository.findByMandateAndEmployee(
        new UniqueEntityID(mandateId),
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (existingMember) {
      throw new BadRequestError(
        'Funcionário já é membro deste mandato CIPA',
      );
    }

    // Elected members (EMPREGADO) get job stability
    const isElected = type === 'EMPREGADO';
    let stableUntil: Date | undefined;

    if (isElected) {
      // Stability = mandate end + 1 year
      stableUntil = new Date(mandate.endDate);
      stableUntil.setFullYear(stableUntil.getFullYear() + 1);
    }

    const cipaMember = await this.cipaMembersRepository.create({
      tenantId,
      mandateId: new UniqueEntityID(mandateId),
      employeeId: new UniqueEntityID(employeeId),
      role,
      type,
      isStable: isElected,
      stableUntil,
    });

    return { cipaMember };
  }
}
