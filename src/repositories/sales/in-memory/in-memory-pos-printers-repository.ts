import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrinter, PrinterStatus } from '@/entities/sales/pos-printer';
import type { PosPrintersRepository } from '../pos-printers-repository';

export class InMemoryPosPrintersRepository implements PosPrintersRepository {
  public items: PosPrinter[] = [];

  async create(printer: PosPrinter): Promise<void> {
    this.items.push(printer);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosPrinter | null> {
    return (
      this.items.find(
        (printer) =>
          printer.id.toString() === id.toString() &&
          printer.tenantId.toString() === tenantId &&
          !printer.deletedAt,
      ) ?? null
    );
  }

  async findDefaultByTenant(tenantId: string): Promise<PosPrinter | null> {
    return (
      this.items.find(
        (printer) =>
          printer.tenantId.toString() === tenantId &&
          printer.isDefault &&
          printer.isActive &&
          !printer.deletedAt,
      ) ?? null
    );
  }

  async findManyByTenant(tenantId: string): Promise<PosPrinter[]> {
    return this.items.filter(
      (printer) =>
        printer.tenantId.toString() === tenantId && !printer.deletedAt,
    );
  }

  async findByAgentId(
    agentId: string,
    tenantId: string,
  ): Promise<PosPrinter[]> {
    return this.items.filter(
      (printer) =>
        printer.agentId === agentId &&
        printer.tenantId.toString() === tenantId &&
        !printer.deletedAt,
    );
  }

  async findByOsName(
    osName: string,
    agentId: string,
    tenantId: string,
  ): Promise<PosPrinter | null> {
    return (
      this.items.find(
        (printer) =>
          printer.osName === osName &&
          printer.agentId === agentId &&
          printer.tenantId.toString() === tenantId &&
          !printer.deletedAt,
      ) ?? null
    );
  }

  async updateStatusByAgentId(agentId: string, status: string): Promise<void> {
    for (const printer of this.items) {
      if (printer.agentId === agentId && !printer.deletedAt) {
        printer.status = status as PrinterStatus;
      }
    }
  }

  async unsetDefaultForTenant(tenantId: string): Promise<void> {
    for (const printer of this.items) {
      if (printer.tenantId.toString() === tenantId && printer.isDefault) {
        printer.isDefault = false;
      }
    }
  }

  async save(printer: PosPrinter): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === printer.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = printer;
    }
  }
}
