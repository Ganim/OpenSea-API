import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrinter } from '@/entities/sales/pos-printer';

export interface PosPrintersRepository {
  create(printer: PosPrinter): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PosPrinter | null>;
  findDefaultByTenant(tenantId: string): Promise<PosPrinter | null>;
  findManyByTenant(tenantId: string): Promise<PosPrinter[]>;
  findByAgentId(agentId: string, tenantId: string): Promise<PosPrinter[]>;
  findByOsName(osName: string, agentId: string, tenantId: string): Promise<PosPrinter | null>;
  updateStatusByAgentId(agentId: string, status: string): Promise<void>;
  unsetDefaultForTenant(tenantId: string): Promise<void>;
  save(printer: PosPrinter): Promise<void>;
}
