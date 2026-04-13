import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import type { InventorySessionItemsRepository } from '@/repositories/stock/inventory-session-items-repository';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ScanInventoryItemUseCaseRequest {
  tenantId: string;
  sessionId: string;
  scannedCode: string;
}

interface ScanInventoryItemUseCaseResponse {
  session: InventorySession;
  sessionItem: InventorySessionItem;
  scanResult: 'CONFIRMED' | 'WRONG_BIN' | 'EXTRA';
}

export class ScanInventoryItemUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
    private inventorySessionItemsRepository: InventorySessionItemsRepository,
    private itemsRepository: ItemsRepository,
  ) {}

  async execute(
    input: ScanInventoryItemUseCaseRequest,
  ): Promise<ScanInventoryItemUseCaseResponse> {
    const { tenantId, sessionId, scannedCode } = input;

    // Load session
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(sessionId),
      tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }
    if (!session.isOpen) {
      throw new BadRequestError('Session is not open for scanning.');
    }

    // Find the physical item by code (try multiple code fields)
    const item = await this.findItemByCode(scannedCode, tenantId);
    if (!item) {
      throw new ResourceNotFoundError(
        `No item found for scanned code: ${scannedCode}`,
      );
    }

    // Check if item is already in the session's expected list
    const existingSessionItem =
      await this.inventorySessionItemsRepository.findBySessionAndItem(
        session.id,
        item.id,
      );

    if (existingSessionItem) {
      // Item is in the expected list
      if (existingSessionItem.status === 'CONFIRMED') {
        throw new BadRequestError('Item already scanned and confirmed.');
      }

      // Check if item is in the expected bin
      const expectedBinId = existingSessionItem.expectedBinId;
      const actualBinId = item.binId;

      if (expectedBinId && actualBinId && !expectedBinId.equals(actualBinId)) {
        // Item exists but is in wrong bin
        existingSessionItem.actualBinId = actualBinId;
        existingSessionItem.props.status = 'WRONG_BIN';
        existingSessionItem.props.scannedAt = new Date();
        existingSessionItem.props.updatedAt = new Date();
        await this.inventorySessionItemsRepository.save(existingSessionItem);

        session.scannedItems = session.scannedItems + 1;
        session.divergentItems = session.divergentItems + 1;
        await this.inventorySessionsRepository.save(session);

        return {
          session,
          sessionItem: existingSessionItem,
          scanResult: 'WRONG_BIN',
        };
      }

      // Confirm the item
      existingSessionItem.confirm();
      await this.inventorySessionItemsRepository.save(existingSessionItem);

      session.scannedItems = session.scannedItems + 1;
      session.confirmedItems = session.confirmedItems + 1;
      await this.inventorySessionsRepository.save(session);

      return {
        session,
        sessionItem: existingSessionItem,
        scanResult: 'CONFIRMED',
      };
    }

    // Item not in session's expected list - it's an EXTRA item
    const extraSessionItem = await this.inventorySessionItemsRepository.create({
      sessionId: session.id,
      itemId: item.id,
      actualBinId: item.binId,
      status: 'EXTRA',
    });
    extraSessionItem.props.scannedAt = new Date();
    extraSessionItem.props.updatedAt = new Date();
    await this.inventorySessionItemsRepository.save(extraSessionItem);

    session.scannedItems = session.scannedItems + 1;
    session.divergentItems = session.divergentItems + 1;
    await this.inventorySessionsRepository.save(session);

    return {
      session,
      sessionItem: extraSessionItem,
      scanResult: 'EXTRA',
    };
  }

  private async findItemByCode(code: string, tenantId: string) {
    return this.itemsRepository.findByAnyCode(code, tenantId);
  }
}
