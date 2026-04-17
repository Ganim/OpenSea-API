import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface DeleteWarningRequest {
  tenantId: string;
  warningId: string;
  /**
   * User id (not employee id) that triggered the delete. CLT Art. 474
   * compliance — disciplinary history must remain auditable after removal.
   */
  deletedBy: string;
}

export class DeleteWarningUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: DeleteWarningRequest): Promise<void> {
    const { tenantId, warningId, deletedBy } = request;

    const warning = await this.employeeWarningsRepository.findById(
      new UniqueEntityID(warningId),
      tenantId,
    );

    if (!warning) {
      throw new ResourceNotFoundError('Warning');
    }

    // Soft-delete instead of splice/DELETE: we must keep the row so labor
    // courts can retrieve the disciplinary history during trabalhista
    // disputes (CLT Art. 474). deletedBy is stamped so auditors can trace
    // which HR user triggered the removal.
    await this.employeeWarningsRepository.softDelete({
      id: new UniqueEntityID(warningId),
      tenantId,
      deletedBy,
    });
  }
}
