import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { KudosReaction } from '@/entities/hr/kudos-reaction';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { InMemoryKudosReactionsRepository } from '@/repositories/hr/in-memory/in-memory-kudos-reactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListKudosReactionsUseCase } from './list-kudos-reactions';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let kudosReactionsRepository: InMemoryKudosReactionsRepository;
let listKudosReactionsUseCase: ListKudosReactionsUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createKudos() {
  return EmployeeKudos.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    fromEmployeeId: new UniqueEntityID(),
    toEmployeeId: new UniqueEntityID(),
    message: 'Great job!',
    category: 'EXCELLENCE',
    isPublic: true,
  });
}

describe('ListKudosReactionsUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    kudosReactionsRepository = new InMemoryKudosReactionsRepository();
    listKudosReactionsUseCase = new ListKudosReactionsUseCase(
      employeeKudosRepository,
      kudosReactionsRepository,
    );
  });

  it('should return empty groups when there are no reactions', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { groups, totalReactions } = await listKudosReactionsUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
    });

    expect(groups).toEqual([]);
    expect(totalReactions).toBe(0);
  });

  it('should aggregate reactions by emoji and sort by count desc', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    for (let i = 0; i < 3; i++) {
      await kudosReactionsRepository.create(
        KudosReaction.create({
          tenantId: kudos.tenantId,
          kudosId: kudos.id,
          employeeId: new UniqueEntityID(),
          emoji: '👏',
        }),
      );
    }
    await kudosReactionsRepository.create(
      KudosReaction.create({
        tenantId: kudos.tenantId,
        kudosId: kudos.id,
        employeeId: new UniqueEntityID(),
        emoji: '🎉',
      }),
    );

    const { groups, totalReactions } = await listKudosReactionsUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
    });

    expect(groups).toHaveLength(2);
    expect(groups[0].emoji).toBe('👏');
    expect(groups[0].count).toBe(3);
    expect(groups[1].emoji).toBe('🎉');
    expect(totalReactions).toBe(4);
  });

  it('should throw KudosNotFoundError if kudos does not exist', async () => {
    await expect(
      listKudosReactionsUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });
});
