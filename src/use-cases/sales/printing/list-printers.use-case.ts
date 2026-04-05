import type { PosPrinter } from '@/entities/sales/pos-printer';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';

interface ListPrintersUseCaseRequest {
  tenantId: string;
}

interface ListPrintersUseCaseResponse {
  printers: PosPrinter[];
}

export class ListPrintersUseCase {
  constructor(private posPrintersRepository: PosPrintersRepository) {}

  async execute(
    input: ListPrintersUseCaseRequest,
  ): Promise<ListPrintersUseCaseResponse> {
    const printers = await this.posPrintersRepository.findManyByTenant(
      input.tenantId,
    );

    return { printers };
  }
}
