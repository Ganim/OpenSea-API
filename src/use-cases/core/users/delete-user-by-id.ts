import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface DeleteUserByIdUseCaseRequest {
  userId: string;
}

export class DeleteUserByIdUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute({ userId }: DeleteUserByIdUseCaseRequest): Promise<void> {
    const validId = new UniqueEntityID(userId);

    const existingUser = await this.usersRepository.findById(validId);
    if (!existingUser || existingUser.deletedAt) {
      throw new ResourceNotFoundError('User not found');
    }

    // Unlink employee if one is linked to this user
    const linkedEmployee =
      await this.employeesRepository.findByUserIdAnyTenant(validId);
    if (linkedEmployee) {
      await this.employeesRepository.update({
        id: linkedEmployee.id,
        userId: null,
      });
    }

    await this.usersRepository.delete(validId); // Soft delete: marca deletedAt
  }
}
