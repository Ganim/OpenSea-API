import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';
import type {
  KudosReactionSummaryItem,
  KudosReactionsRepository,
} from '@/repositories/hr/kudos-reactions-repository';

export interface ListKudosReactionsInput {
  tenantId: string;
  kudosId: string;
}

export interface ListKudosReactionsOutput {
  groups: KudosReactionSummaryItem[];
  totalReactions: number;
}

export class ListKudosReactionsUseCase {
  constructor(
    private readonly employeeKudosRepository: EmployeeKudosRepository,
    private readonly kudosReactionsRepository: KudosReactionsRepository,
  ) {}

  async execute(
    input: ListKudosReactionsInput,
  ): Promise<ListKudosReactionsOutput> {
    const kudosId = new UniqueEntityID(input.kudosId);

    const kudos = await this.employeeKudosRepository.findById(
      kudosId,
      input.tenantId,
    );

    if (!kudos) {
      throw new KudosNotFoundError();
    }

    const summary = await this.kudosReactionsRepository.summarizeForKudosIds([
      input.kudosId,
    ]);

    const groups = summary[input.kudosId] ?? [];
    const totalReactions = groups.reduce((acc, group) => acc + group.count, 0);

    return { groups, totalReactions };
  }
}
