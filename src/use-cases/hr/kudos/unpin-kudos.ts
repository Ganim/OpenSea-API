import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

export interface UnpinKudosInput {
  tenantId: string;
  kudosId: string;
}

export interface UnpinKudosOutput {
  kudos: EmployeeKudos;
}

export class UnpinKudosUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
  ) {}

  async execute(input: UnpinKudosInput): Promise<UnpinKudosOutput> {
    const kudos = await this.employeeKudosRepository.findById(
      new UniqueEntityID(input.kudosId),
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    kudos.unpin();

    await this.employeeKudosRepository.save(kudos);

    return { kudos };
  }
}
