import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosPrinter, type PrinterStatus } from '@/entities/sales/pos-printer';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';

interface AgentPrinterData {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  isDefault: boolean;
  portName?: string;
  driverName?: string;
}

interface SyncAgentPrintersUseCaseRequest {
  tenantId: string;
  agentId: string;
  printers: AgentPrinterData[];
}

interface SyncAgentPrintersUseCaseResponse {
  syncedPrinterIds: string[];
}

export class SyncAgentPrintersUseCase {
  constructor(private posPrintersRepository: PosPrintersRepository) {}

  async execute(
    input: SyncAgentPrintersUseCaseRequest,
  ): Promise<SyncAgentPrintersUseCaseResponse> {
    const syncedPrinterIds: string[] = [];
    const reportedOsNames = new Set<string>();

    for (const printerData of input.printers) {
      reportedOsNames.add(printerData.name);

      const existingPrinter = await this.posPrintersRepository.findByOsName(
        printerData.name,
        input.agentId,
        input.tenantId,
      );

      if (existingPrinter) {
        existingPrinter.status = printerData.status as PrinterStatus;
        existingPrinter.lastSeenAt = new Date();
        await this.posPrintersRepository.save(existingPrinter);
        syncedPrinterIds.push(existingPrinter.id.toString());
      } else {
        const newPrinter = PosPrinter.create({
          tenantId: new UniqueEntityID(input.tenantId),
          name: printerData.name,
          type: 'LABEL',
          connection: 'USB',
          osName: printerData.name,
          agentId: input.agentId,
          status: printerData.status as PrinterStatus,
          isDefault: printerData.isDefault,
        });

        newPrinter.lastSeenAt = new Date();
        await this.posPrintersRepository.create(newPrinter);
        syncedPrinterIds.push(newPrinter.id.toString());
      }
    }

    // Mark printers not in the reported list as OFFLINE
    const allAgentPrinters = await this.posPrintersRepository.findByAgentId(
      input.agentId,
      input.tenantId,
    );

    for (const printer of allAgentPrinters) {
      if (printer.osName && !reportedOsNames.has(printer.osName)) {
        printer.status = 'OFFLINE';
        await this.posPrintersRepository.save(printer);
      }
    }

    return { syncedPrinterIds };
  }
}
