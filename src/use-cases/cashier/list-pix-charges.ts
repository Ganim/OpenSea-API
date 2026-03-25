import type { PixCharge } from '@/entities/cashier/pix-charge';
import type { PixChargesRepository } from '@/repositories/cashier/pix-charges-repository';

interface ListPixChargesUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
}

interface ListPixChargesUseCaseResponse {
  charges: PixCharge[];
  total: number;
}

export class ListPixChargesUseCase {
  constructor(private pixChargesRepository: PixChargesRepository) {}

  async execute({
    tenantId,
    page,
    limit,
    status,
  }: ListPixChargesUseCaseRequest): Promise<ListPixChargesUseCaseResponse> {
    const { charges, total } = await this.pixChargesRepository.findByTenantId(
      tenantId,
      {
        page,
        limit,
        status,
      },
    );

    return { charges, total };
  }
}
