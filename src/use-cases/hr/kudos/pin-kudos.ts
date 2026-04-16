import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudos } from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

export interface PinKudosInput {
  tenantId: string;
  kudosId: string;
  requesterEmployeeId: string;
}

export interface PinKudosOutput {
  kudos: EmployeeKudos;
}

export class PinKudosUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
  ) {}

  async execute(input: PinKudosInput): Promise<PinKudosOutput> {
    const kudos = await this.employeeKudosRepository.findById(
      new UniqueEntityID(input.kudosId),
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    kudos.pin(new UniqueEntityID(input.requesterEmployeeId));

    await this.employeeKudosRepository.save(kudos);

    return { kudos };
  }
}
