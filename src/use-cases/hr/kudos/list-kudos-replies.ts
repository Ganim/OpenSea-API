import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReply } from '@/entities/hr/kudos-reply';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';
import type { KudosRepliesRepository } from '@/repositories/hr/kudos-replies-repository';

export interface ListKudosRepliesInput {
  tenantId: string;
  kudosId: string;
}

export interface ListKudosRepliesOutput {
  replies: KudosReply[];
}

export class ListKudosRepliesUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
    private readonly kudosRepliesRepository: KudosRepliesRepository,
  ) {}

  async execute(input: ListKudosRepliesInput): Promise<ListKudosRepliesOutput> {
    const kudosId = new UniqueEntityID(input.kudosId);

    const kudos = await this.employeeKudosRepository.findById(
      kudosId,
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    const replies =
      await this.kudosRepliesRepository.findManyByKudosId(kudosId);

    return { replies };
  }
}
