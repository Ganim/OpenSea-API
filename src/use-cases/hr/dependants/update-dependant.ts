import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeDependant } from '@/entities/hr/employee-dependant';
import { DependantsRepository } from '@/repositories/hr/dependants-repository';

export interface UpdateDependantRequest {
  tenantId: string;
  dependantId: string;
  name?: string;
  cpf?: string;
  cpfHash?: string;
  birthDate?: Date;
  relationship?: string;
  isIrrfDependant?: boolean;
  isSalarioFamilia?: boolean;
  hasDisability?: boolean;
}

export interface UpdateDependantResponse {
  dependant: EmployeeDependant;
}

export class UpdateDependantUseCase {
  constructor(private dependantsRepository: DependantsRepository) {}

  async execute(
    request: UpdateDependantRequest,
  ): Promise<UpdateDependantResponse> {
    const { tenantId, dependantId, ...data } = request;

    const existing = await this.dependantsRepository.findById(
      new UniqueEntityID(dependantId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Dependente não encontrado');
    }

    const dependant = await this.dependantsRepository.update({
      id: new UniqueEntityID(dependantId),
      name: data.name?.trim(),
      cpf: data.cpf,
      cpfHash: data.cpfHash,
      birthDate: data.birthDate,
      relationship: data.relationship,
      isIrrfDependant: data.isIrrfDependant,
      isSalarioFamilia: data.isSalarioFamilia,
      hasDisability: data.hasDisability,
    });

    if (!dependant) {
      throw new ResourceNotFoundError('Dependente não encontrado');
    }

    return { dependant };
  }
}
