import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpinKudosUseCase } from './unpin-kudos';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let unpinKudosUseCase: UnpinKudosUseCase;

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

describe('UnpinKudosUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    unpinKudosUseCase = new UnpinKudosUseCase(employeeKudosRepository);
  });

  it('should unpin a previously pinned kudos', async () => {
    const kudos = createKudos();
    kudos.pin(new UniqueEntityID());
    await employeeKudosRepository.create(kudos);

    const { kudos: unpinned } = await unpinKudosUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
    });

    expect(unpinned.isPinned).toBe(false);
    expect(unpinned.pinnedAt).toBeNull();
    expect(unpinned.pinnedBy).toBeNull();
  });

  it('should be idempotent when called on an unpinned kudos', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { kudos: unpinned } = await unpinKudosUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
    });

    expect(unpinned.isPinned).toBe(false);
  });

  it('should throw KudosNotFoundError when kudos does not exist', async () => {
    await expect(
      unpinKudosUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });
});
