import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { ListSentKudosUseCase } from './list-sent-kudos';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let listSentKudosUseCase: ListSentKudosUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const SENDER_EMPLOYEE_ID = new UniqueEntityID().toString();
const RECIPIENT_EMPLOYEE_ID = new UniqueEntityID().toString();

function createTestKudos(
  overrides: {
    tenantId?: string;
    fromEmployeeId?: string;
    toEmployeeId?: string;
  } = {},
) {
  return EmployeeKudos.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_ID),
    fromEmployeeId: new UniqueEntityID(
      overrides.fromEmployeeId ?? SENDER_EMPLOYEE_ID,
    ),
    toEmployeeId: new UniqueEntityID(
      overrides.toEmployeeId ?? RECIPIENT_EMPLOYEE_ID,
    ),
    message: 'Excellent leadership on the sprint!',
    category: 'LEADERSHIP',
    isPublic: true,
  });
}

describe('ListSentKudosUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    listSentKudosUseCase = new ListSentKudosUseCase(employeeKudosRepository);
  });

  it('should list kudos sent by an employee', async () => {
    const kudosEntry = createTestKudos();
    await employeeKudosRepository.create(kudosEntry);

    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
    expect(total).toBe(1);
    expect(kudos[0].fromEmployeeId.toString()).toBe(SENDER_EMPLOYEE_ID);
  });

  it('should return empty list when employee has sent no kudos', async () => {
    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should only return kudos sent by the specified employee', async () => {
    const otherSenderId = new UniqueEntityID().toString();

    await employeeKudosRepository.create(createTestKudos());
    await employeeKudosRepository.create(
      createTestKudos({ fromEmployeeId: otherSenderId }),
    );

    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should only return kudos for the specified tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await employeeKudosRepository.create(createTestKudos());
    await employeeKudosRepository.create(
      createTestKudos({ tenantId: differentTenantId }),
    );

    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should paginate results correctly', async () => {
    // Create 5 kudos from the same sender
    for (let i = 0; i < 5; i++) {
      await employeeKudosRepository.create(
        createTestKudos({
          toEmployeeId: new UniqueEntityID().toString(),
        }),
      );
    }

    const firstPage = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 2,
    });

    expect(firstPage.kudos).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 2,
      limit: 2,
    });

    expect(secondPage.kudos).toHaveLength(2);
    expect(secondPage.total).toBe(5);

    const thirdPage = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 3,
      limit: 2,
    });

    expect(thirdPage.kudos).toHaveLength(1);
    expect(thirdPage.total).toBe(5);
  });

  it('should return empty array for page beyond total', async () => {
    await employeeKudosRepository.create(createTestKudos());

    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 10,
      limit: 20,
    });

    expect(kudos).toHaveLength(0);
    expect(total).toBe(1);
  });

  it('should list kudos sent to multiple recipients', async () => {
    const recipientA = new UniqueEntityID().toString();
    const recipientB = new UniqueEntityID().toString();

    await employeeKudosRepository.create(
      createTestKudos({ toEmployeeId: recipientA }),
    );
    await employeeKudosRepository.create(
      createTestKudos({ toEmployeeId: recipientB }),
    );

    const { kudos, total } = await listSentKudosUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: SENDER_EMPLOYEE_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(2);
    expect(total).toBe(2);
  });
});
