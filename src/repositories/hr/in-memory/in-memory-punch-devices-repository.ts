import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchDevice } from '@/entities/hr/punch-device';
import type {
  CreatePunchDeviceWithAllowlist,
  FindManyPunchDevicesFilters,
  PunchDevicesRepository,
} from '../punch-devices-repository';

/**
 * In-memory implementation usada por specs unitários. Espelha a semântica
 * do `PrismaPunchDevicesRepository` com foco em:
 * - isolamento por tenantId em todas as queries
 * - `deletedAt` e `revokedAt` filtram os retornos conforme cada método
 * - allowlist armazenada em arrays públicos (facilita asserts nos specs)
 */
export class InMemoryPunchDevicesRepository implements PunchDevicesRepository {
  public items: PunchDevice[] = [];
  public allowedEmployees: Array<{ deviceId: string; employeeId: string }> = [];
  public allowedDepartments: Array<{
    deviceId: string;
    departmentId: string;
  }> = [];

  async create(device: PunchDevice): Promise<void> {
    this.items.push(device);
  }

  async createWithAllowlist(
    input: CreatePunchDeviceWithAllowlist,
  ): Promise<void> {
    this.items.push(input.device);

    const deviceId = input.device.id.toString();

    if (input.allowedEmployeeIds) {
      for (const employeeId of input.allowedEmployeeIds) {
        this.allowedEmployees.push({ deviceId, employeeId });
      }
    }

    if (input.allowedDepartmentIds) {
      for (const departmentId of input.allowedDepartmentIds) {
        this.allowedDepartments.push({ deviceId, departmentId });
      }
    }
  }

  async save(device: PunchDevice): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === device.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = device;
    }
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchDevice | null> {
    return (
      this.items.find(
        (device) =>
          device.id.toString() === id.toString() &&
          device.tenantId.toString() === tenantId &&
          !device.deletedAt,
      ) ?? null
    );
  }

  async findByDeviceTokenHash(hash: string): Promise<PunchDevice | null> {
    return (
      this.items.find(
        (device) =>
          device.deviceTokenHash === hash &&
          !device.deletedAt &&
          !device.revokedAt,
      ) ?? null
    );
  }

  async findAllUnpairedWithPairingSecret(
    tenantId: string,
    deviceId?: UniqueEntityID,
  ): Promise<PunchDevice[]> {
    return this.items.filter((device) => {
      const matchesTenant = device.tenantId.toString() === tenantId;
      const isUnpaired = !device.deviceTokenHash && !device.revokedAt;
      const isActive = !device.deletedAt && !!device.pairingSecret;
      const matchesDeviceId =
        !deviceId || device.id.toString() === deviceId.toString();

      return matchesTenant && isUnpaired && isActive && matchesDeviceId;
    });
  }

  async findManyByTenantId(
    tenantId: string,
    filters?: FindManyPunchDevicesFilters,
  ): Promise<{ items: PunchDevice[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;

    const filtered = this.items.filter((device) => {
      if (device.tenantId.toString() !== tenantId) return false;
      if (device.deletedAt) return false;
      if (!filters?.includeRevoked && device.revokedAt) return false;
      if (filters?.deviceKind && device.deviceKind !== filters.deviceKind) {
        return false;
      }
      if (filters?.status && device.status !== filters.status) return false;
      return true;
    });

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    return { items: paginated, total: filtered.length };
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const device = await this.findById(id, tenantId);
    if (!device) return;

    device.deletedAt = new Date();
    await this.save(device);
  }
}
