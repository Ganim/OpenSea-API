import type {
  AccountantAccessesRepository,
  AccountantAccessRecord,
} from '@/repositories/finance/accountant-accesses-repository';

interface ListAccountantAccessesRequest {
  tenantId: string;
}

interface ListAccountantAccessesResponse {
  accesses: AccountantAccessRecord[];
}

export class ListAccountantAccessesUseCase {
  constructor(
    private accountantAccessesRepository: AccountantAccessesRepository,
  ) {}

  async execute({
    tenantId,
  }: ListAccountantAccessesRequest): Promise<ListAccountantAccessesResponse> {
    const accesses =
      await this.accountantAccessesRepository.findMany(tenantId);

    return { accesses };
  }
}
