import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { KudosReply } from '@/entities/hr/kudos-reply';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { InMemoryKudosRepliesRepository } from '@/repositories/hr/in-memory/in-memory-kudos-replies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListKudosRepliesUseCase } from './list-kudos-replies';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let kudosRepliesRepository: InMemoryKudosRepliesRepository;
let listKudosRepliesUseCase: ListKudosRepliesUseCase;

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

describe('ListKudosRepliesUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    kudosRepliesRepository = new InMemoryKudosRepliesRepository();
    listKudosRepliesUseCase = new ListKudosRepliesUseCase(
      employeeKudosRepository,
      kudosRepliesRepository,
    );
  });

  it('should list replies in chronological order excluding deleted ones', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const firstReply = KudosReply.create({
      tenantId: kudos.tenantId,
      kudosId: kudos.id,
      employeeId: new UniqueEntityID(),
      content: 'First',
    });
    await kudosRepliesRepository.create(firstReply);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const deletedReply = KudosReply.create({
      tenantId: kudos.tenantId,
      kudosId: kudos.id,
      employeeId: new UniqueEntityID(),
      content: 'Will be removed',
    });
    deletedReply.softDelete();
    await kudosRepliesRepository.create(deletedReply);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const secondReply = KudosReply.create({
      tenantId: kudos.tenantId,
      kudosId: kudos.id,
      employeeId: new UniqueEntityID(),
      content: 'Second',
    });
    await kudosRepliesRepository.create(secondReply);

    const { replies } = await listKudosRepliesUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
    });

    expect(replies).toHaveLength(2);
    expect(replies[0].content).toBe('First');
    expect(replies[1].content).toBe('Second');
  });

  it('should throw KudosNotFoundError when kudos does not exist', async () => {
    await expect(
      listKudosRepliesUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });
});
