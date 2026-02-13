import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { CPF, ContractType, EmployeeStatus, WorkRegime } from '@/entities/hr/value-objects';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteUserByIdUseCase } from './delete-user-by-id';

let usersRepository: InMemoryUsersRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: DeleteUserByIdUseCase;

describe('Delete User By Id Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new DeleteUserByIdUseCase(usersRepository, employeesRepository);
  });

  // OBJECTIVE

  it('should soft delete user by id', async () => {
    const { user } = await makeUser({
      email: 'DeleteUserById@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(sut.execute({ userId: user.id })).resolves.toBeUndefined();

    const userId = new UniqueEntityID(user.id);
    const deletedUser = await usersRepository.findById(userId, true);

    expect(deletedUser?.deletedAt).toBeDefined();

    const items = (usersRepository as InMemoryUsersRepository)['items'];
    const rawUser = items.find((rawUser) => rawUser.id.toString() === user.id);

    expect(rawUser?.deletedAt).toEqual(expect.any(Date));
  });

  // REJECTS

  it('should throw ResourceNotFoundError if user not found', async () => {
    await expect(() =>
      sut.execute({ userId: 'notfound' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow deleting an already deleted user', async () => {
    const { user } = await makeUser({
      email: 'alreadydeleted@example.com',
      password: 'Pass@123',
      deletedAt: new Date(),
      usersRepository,
    });

    await expect(sut.execute({ userId: user.id })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  // INTEGRATION

  it('should keep correct user count after deletion', async () => {
    await makeUser({
      email: 'user1@example.com',
      password: 'Pass@123',
      usersRepository,
    });
    await makeUser({
      email: 'user2@example.com',
      password: 'Pass@123',
      usersRepository,
    });
    const { user } = await makeUser({
      email: 'user3@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(sut.execute({ userId: user.id })).resolves.toBeUndefined();
    const allUsers = await usersRepository.listAll();
    expect(allUsers).toHaveLength(2);
    expect(allUsers?.map((user) => user.email.value)).toEqual(
      expect.arrayContaining(['user1@example.com', 'user2@example.com']),
    );
    expect(allUsers?.map((user) => user.email.value)).not.toContain(
      'user3@example.com',
    );
  });

  // UNLINK EMPLOYEE

  it('should unlink employee when deleting a user', async () => {
    const { user } = await makeUser({
      email: 'linked@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const userId = new UniqueEntityID(user.id);
    const tenantId = 'tenant-1';

    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-001',
      userId,
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
      status: EmployeeStatus.ACTIVE(),
    });

    await sut.execute({ userId: user.id });

    const updatedEmployee = await employeesRepository.findById(
      employee.id,
      tenantId,
    );

    expect(updatedEmployee).not.toBeNull();
    expect(updatedEmployee!.userId).toBeUndefined();
  });

  it('should delete user even if no employee is linked', async () => {
    const { user } = await makeUser({
      email: 'noemployee@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(sut.execute({ userId: user.id })).resolves.toBeUndefined();

    const userId = new UniqueEntityID(user.id);
    const deletedUser = await usersRepository.findById(userId, true);
    expect(deletedUser?.deletedAt).toBeDefined();
  });
});
