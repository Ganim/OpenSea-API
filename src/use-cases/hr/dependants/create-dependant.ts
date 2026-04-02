import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { DependantsRepository } from '@/repositories/hr/dependants-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CreateDependantRequest {
  tenantId: string;
  employeeId: string;
  name: string;
  cpf?: string;
  cpfHash?: string;
  birthDate: Date;
  relationship: string;
  isIrrfDependant?: boolean;
  isSalarioFamilia?: boolean;
  hasDisability?: boolean;
}

export interface CreateDependantResponse {
  dependant: EmployeeDependant;
}

export class CreateDependantUseCase {
  constructor(
    private dependantsRepository: DependantsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CreateDependantRequest,
  ): Promise<CreateDependantResponse> {
    const {
      tenantId,
      employeeId,
      name,
      cpf,
      cpfHash,
      birthDate,
      relationship,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do dependente é obrigatório');
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const dependant = await this.dependantsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      name: name.trim(),
      cpf,
      cpfHash,
      birthDate,
      relationship,
      isIrrfDependant: request.isIrrfDependant ?? false,
      isSalarioFamilia: request.isSalarioFamilia ?? false,
      hasDisability: request.hasDisability ?? false,
    });

    return { dependant };
  }
}
