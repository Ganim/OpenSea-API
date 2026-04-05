import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrinter } from '@/entities/sales/pos-printer';

export interface PosPrintersRepository {
  create(printer: PosPrinter): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PosPrinter | null>;
  findDefaultByTenant(tenantId: string): Promise<PosPrinter | null>;
  findManyByTenant(tenantId: string): Promise<PosPrinter[]>;
  unsetDefaultForTenant(tenantId: string): Promise<void>;
  save(printer: PosPrinter): Promise<void>;
}
