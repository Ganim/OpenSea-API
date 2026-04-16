import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PinKudosUseCase } from './pin-kudos';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let pinKudosUseCase: PinKudosUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const REQUESTER_EMPLOYEE_ID = new UniqueEntityID().toString();

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

describe('PinKudosUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    pinKudosUseCase = new PinKudosUseCase(employeeKudosRepository);
  });

  it('should pin a kudos and record who pinned it', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { kudos: pinned } = await pinKudosUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      requesterEmployeeId: REQUESTER_EMPLOYEE_ID,
    });

    expect(pinned.isPinned).toBe(true);
    expect(pinned.pinnedAt).toBeInstanceOf(Date);
    expect(pinned.pinnedBy?.toString()).toBe(REQUESTER_EMPLOYEE_ID);
  });

  it('should throw KudosNotFoundError when kudos does not exist', async () => {
    await expect(
      pinKudosUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
        requesterEmployeeId: REQUESTER_EMPLOYEE_ID,
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });
});
