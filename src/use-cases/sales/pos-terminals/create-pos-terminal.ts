import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosTerminal,
  type PosTerminalMode,
} from '@/entities/sales/pos-terminal';
import { prisma } from '@/lib/prisma';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface CreatePosTerminalUseCaseRequest {
  tenantId: string;
  terminalName: string;
  mode: PosTerminalMode;
  acceptsPendingOrders?: boolean;
  warehouseIds?: string[];
  defaultPriceTableId?: string | null;
  settings?: Record<string, unknown>;
}

interface CreatePosTerminalUseCaseResponse {
  terminal: PosTerminal;
}

export class CreatePosTerminalUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: CreatePosTerminalUseCaseRequest,
  ): Promise<CreatePosTerminalUseCaseResponse> {
    const terminalCode =
      await this.posTerminalsRepository.generateUniqueTerminalCode();

    const isTotem = request.mode === 'TOTEM';
    const isSalesOnly = request.mode === 'SALES_ONLY';

    const totemCode = isTotem
      ? await this.posTerminalsRepository.generateUniqueTotemCode()
      : undefined;

    const requiresSession = isSalesOnly ? false : true;
    const allowAnonymous = isTotem ? true : false;

    const terminal = PosTerminal.create({
      tenantId: new UniqueEntityID(request.tenantId),
      terminalName: request.terminalName,
      terminalCode,
      totemCode,
      mode: request.mode,
      acceptsPendingOrders: request.acceptsPendingOrders ?? false,
      requiresSession,
      allowAnonymous,
      defaultPriceTableId: request.defaultPriceTableId
        ? new UniqueEntityID(request.defaultPriceTableId)
        : undefined,
      settings: request.settings,
    });

    await this.posTerminalsRepository.create(terminal);

    if (request.warehouseIds && request.warehouseIds.length > 0) {
      // Create warehouse links via Prisma directly (simple join table).
      await prisma.posTerminalWarehouse.createMany({
        data: request.warehouseIds.map((warehouseId, idx) => ({
          terminalId: terminal.id.toString(),
          warehouseId,
          isDefault: idx === 0,
        })),
        skipDuplicates: true,
      });
    }

    return { terminal };
  }
}
