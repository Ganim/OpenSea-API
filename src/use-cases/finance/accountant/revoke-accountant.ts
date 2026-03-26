import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { AccountantAccessesRepository } from '@/repositories/finance/accountant-accesses-repository';

interface RevokeAccountantRequest {
  tenantId: string;
  id: string;
}

export class RevokeAccountantUseCase {
  constructor(
    private accountantAccessesRepository: AccountantAccessesRepository,
  ) {}

  async execute({ tenantId, id }: RevokeAccountantRequest): Promise<void> {
    const access = await this.accountantAccessesRepository.findById(
      id,
      tenantId,
    );

    if (!access) {
      throw new ResourceNotFoundError('Acesso de contador não encontrado.');
    }

    await this.accountantAccessesRepository.deactivate(id, tenantId);
  }
}
