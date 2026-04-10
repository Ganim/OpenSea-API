import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrinter } from '@/entities/sales/pos-printer';
import { prisma } from '@/lib/prisma';
import { posPrinterPrismaToDomain } from '@/mappers/sales/pos-printer/pos-printer-prisma-to-domain';
import type {
  Prisma,
  PrinterConnection as PrismaPrinterConnection,
  PrinterStatus as PrismaPrinterStatus,
  PrinterType as PrismaPrinterType,
} from '@prisma/generated/client.js';
import type { PosPrintersRepository } from '../pos-printers-repository';

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
        status: printer.status as PrismaPrinterStatus,
        lastSeenAt: printer.lastSeenAt ?? null,
        agentId: printer.agentId ?? null,
        capabilities:
          (printer.capabilities as Prisma.InputJsonValue | undefined) ??
          undefined,
        osName: printer.osName ?? null,
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

  async findByAgentId(
    agentId: string,
    tenantId: string,
  ): Promise<PosPrinter[]> {
    const rows = await prisma.posPrinter.findMany({
      where: {
        agentId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(posPrinterPrismaToDomain);
  }

  async findByOsName(
    osName: string,
    agentId: string,
    tenantId: string,
  ): Promise<PosPrinter | null> {
    const raw = await prisma.posPrinter.findFirst({
      where: {
        osName,
        agentId,
        tenantId,
        deletedAt: null,
      },
    });

    return raw ? posPrinterPrismaToDomain(raw) : null;
  }

  async updateStatusByAgentId(agentId: string, status: string): Promise<void> {
    await prisma.posPrinter.updateMany({
      where: {
        agentId,
        deletedAt: null,
      },
      data: {
        status: status as PrismaPrinterStatus,
      },
    });
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
        status: printer.status as PrismaPrinterStatus,
        lastSeenAt: printer.lastSeenAt ?? null,
        agentId: printer.agentId ?? null,
        capabilities:
          (printer.capabilities as Prisma.InputJsonValue | undefined) ??
          undefined,
        osName: printer.osName ?? null,
        deletedAt: printer.deletedAt ?? null,
      },
    });
  }
}
