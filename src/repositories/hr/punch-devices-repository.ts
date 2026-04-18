import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PunchDevice,
  PunchDeviceKind,
  PunchDeviceStatus,
} from '@/entities/hr/punch-device';

/**
 * Filtros opcionais para listagem paginada de PunchDevices.
 *
 * Defaults aplicados pela implementação quando não fornecidos:
 * - `page = 1`
 * - `pageSize = 20` (máximo 100, enforçado pelo schema Zod no controller)
 * - `includeRevoked = false` (dispositivos revogados ficam fora da listagem
 *   padrão; admin pode explicitar `includeRevoked=true` para auditoria)
 */
export interface FindManyPunchDevicesFilters {
  deviceKind?: PunchDeviceKind;
  status?: PunchDeviceStatus;
  includeRevoked?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Input para criação atômica de device + allowlist.
 *
 * A allowlist é gravada transacionalmente com o device para evitar janela
 * em que o device existe mas não tem allowlist (o que permitiria batida
 * sem validação de quem pode usar aquele kiosk — PUNCH-CORE-02).
 */
export interface CreatePunchDeviceWithAllowlist {
  device: PunchDevice;
  allowedEmployeeIds?: string[];
  allowedDepartmentIds?: string[];
}

export interface PunchDevicesRepository {
  /**
   * Cria um device sem allowlist. Mantido para testes unitários; os
   * controllers HTTP chamam `createWithAllowlist` mesmo quando as listas
   * estão vazias (transação atômica).
   */
  create(device: PunchDevice): Promise<void>;

  /**
   * Cria device + entradas em punch_device_employees/departments em uma
   * única transação Prisma. Se qualquer INSERT falhar, nada é persistido.
   */
  createWithAllowlist(input: CreatePunchDeviceWithAllowlist): Promise<void>;

  save(device: PunchDevice): Promise<void>;

  findById(id: UniqueEntityID, tenantId: string): Promise<PunchDevice | null>;

  /**
   * Usado pelo middleware `verifyPunchDeviceToken` (Plan 3). Filtra
   * por `!deletedAt && !revokedAt` para entregar revogação < 5s
   * (PUNCH-CORE-08).
   */
  findByDeviceTokenHash(hash: string): Promise<PunchDevice | null>;

  /**
   * Devices ainda não pareados em um tenant. Se `deviceId` for fornecido,
   * filtra para o id específico — usado pelo `PairPunchDeviceUseCase` em
   * que o admin aponta o pareamento para um device específico (vs o
   * modelo PrintAgent que busca global).
   */
  findAllUnpairedWithPairingSecret(
    tenantId: string,
    deviceId?: UniqueEntityID,
  ): Promise<PunchDevice[]>;

  /**
   * Listagem paginada com filtros. Retorna `{ items, total }` para o
   * controller compor `{ items, total, page, pageSize }`.
   */
  findManyByTenantId(
    tenantId: string,
    filters?: FindManyPunchDevicesFilters,
  ): Promise<{ items: PunchDevice[]; total: number }>;

  /**
   * Soft-delete. Não remove linhas da allowlist — o device fica com
   * `deletedAt` preenchido e as queries normais o ignoram.
   */
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
