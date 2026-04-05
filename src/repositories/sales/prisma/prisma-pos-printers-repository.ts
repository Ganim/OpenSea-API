import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrinter } from '@/entities/sales/pos-printer';
import { prisma } from '@/lib/prisma';
import { posPrinterPrismaToDomain } from '@/mappers/sales/pos-printer/pos-printer-prisma-to-domain';
import type { PosPrintersRepository } from '../pos-printers-repository';
import type {
  PrinterConnection as PrismaPrinterConnection,
  PrinterType as PrismaPrinterType,
} from '@prisma/generated/client.js';

export class PrismaPosPrintersRepository implements PosPrintersRepository {
  async create(printer: PosPrinter): Promise<void> {
    await prisma.posPrinter.create({
      data: {
        id: printer.id.toString(),
        tenantId: printer.tenantId.toString(),
        name: printer.name,
        type: printer.type as PrismaPrinterType,
        connection: printer.connection as PrismaPrinterConnection,
        ipAddress: printer.ipAddress ?? null,
        port: printer.port ?? null,
        deviceId: printer.deviceId ?? null,
        bluetoothAddress: printer.bluetoothAddress ?? null,
        paperWidth: printer.paperWidth,
        encoding: printer.encoding,
        characterPerLine: printer.characterPerLine,
        isDefault: printer.isDefault,
        isActive: printer.isActive,
        deletedAt: printer.deletedAt ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosPrinter | null> {
    const raw = await prisma.posPrinter.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    return raw ? posPrinterPrismaToDomain(raw) : null;
  }

  async findDefaultByTenant(tenantId: string): Promise<PosPrinter | null> {
    const raw = await prisma.posPrinter.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
    });

    return raw ? posPrinterPrismaToDomain(raw) : null;
  }

  async findManyByTenant(tenantId: string): Promise<PosPrinter[]> {
    const rows = await prisma.posPrinter.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => posPrinterPrismaToDomain(row));
  }

  async unsetDefaultForTenant(tenantId: string): Promise<void> {
    await prisma.posPrinter.updateMany({
      where: {
        tenantId,
        isDefault: true,
        deletedAt: null,
      },
      data: {
        isDefault: false,
      },
    });
  }

  async save(printer: PosPrinter): Promise<void> {
    await prisma.posPrinter.update({
      where: {
        id: printer.id.toString(),
      },
      data: {
        name: printer.name,
        type: printer.type as PrismaPrinterType,
        connection: printer.connection as PrismaPrinterConnection,
        ipAddress: printer.ipAddress ?? null,
        port: printer.port ?? null,
        deviceId: printer.deviceId ?? null,
        bluetoothAddress: printer.bluetoothAddress ?? null,
        paperWidth: printer.paperWidth,
        encoding: printer.encoding,
        characterPerLine: printer.characterPerLine,
        isDefault: printer.isDefault,
        isActive: printer.isActive,
        deletedAt: printer.deletedAt ?? null,
      },
    });
  }
}
