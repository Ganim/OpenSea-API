import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';

interface DeletePrinterUseCaseRequest {
  tenantId: string;
  printerId: string;
}

export class DeletePrinterUseCase {
  constructor(private posPrintersRepository: PosPrintersRepository) {}

  async execute(input: DeletePrinterUseCaseRequest): Promise<void> {
    const printer = await this.posPrintersRepository.findById(
      new UniqueEntityID(input.printerId),
      input.tenantId,
    );

    if (!printer) {
      throw new ResourceNotFoundError('Printer not found.');
    }

    printer.isActive = false;
    printer.isDefault = false;
    printer.deletedAt = new Date();

    await this.posPrintersRepository.save(printer);
  }
}
