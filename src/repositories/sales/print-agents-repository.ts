import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgent } from '@/entities/sales/print-agent';

export interface PrintAgentsRepository {
  create(agent: PrintAgent): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PrintAgent | null>;
  findByDeviceTokenHash(hash: string): Promise<PrintAgent | null>;
  findAllWithPairingSecret(tenantId: string): Promise<PrintAgent[]>;
  findAllUnpairedWithPairingSecret(): Promise<PrintAgent[]>;
  findManyByTenant(tenantId: string): Promise<PrintAgent[]>;
  findOnlineByTenant(tenantId: string): Promise<PrintAgent[]>;
  findStaleAgents(thresholdDate: Date): Promise<PrintAgent[]>;
  save(agent: PrintAgent): Promise<void>;
}
