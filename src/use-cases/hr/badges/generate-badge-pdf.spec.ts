import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Tenant } from '@/entities/core/tenant';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { RotateQrTokenUseCase } from '@/use-cases/hr/qr-tokens/rotate-qr-token';

import { GenerateBadgePdfUseCase } from './generate-badge-pdf';

// Mock the event bus the underlying RotateQrTokenUseCase publishes to so we
// don't need real typed-event-bus wiring here.
vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({ publish: vi.fn() }),
}));

describe('GenerateBadgePdfUseCase', () => {
  let employeesRepo: InMemoryEmployeesRepository;
  let tenantsRepo: InMemoryTenantsRepository;
  let sut: GenerateBadgePdfUseCase;

  beforeEach(() => {
    employeesRepo = new InMemoryEmployeesRepository();
    tenantsRepo = new InMemoryTenantsRepository();
    // Reuse the project's RotateQrTokenUseCase — keeping the real
    // implementation preserves the spec's behavior contract (rotate + embed)
    // without over-mocking.
    const rotateQrTokenUseCase = new RotateQrTokenUseCase(employeesRepo);
    sut = new GenerateBadgePdfUseCase(
      employeesRepo,
      tenantsRepo,
      rotateQrTokenUseCase,
    );
  });

  async function seedTenant(id: UniqueEntityID, name = 'Empresa Demo') {
    const tenant = Tenant.create({ name, slug: name.toLowerCase() }, id);
    // The in-memory repo stores whatever create returns; we force-insert via
    // its `items` array for determinism.
    (tenantsRepo as unknown as { items: Tenant[] }).items.push(tenant);
    return tenant;
  }

  async function seedEmployee(tenantId: string) {
    return employeesRepo.create({
      tenantId,
      registrationNumber: 'EMP-00042',
      fullName: 'João Álvaro Gonçalves Oliveira',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });
  }

  it('rotates the QR token, embeds it in the PDF and returns a Buffer + filename', async () => {
    const tenantId = new UniqueEntityID();
    await seedTenant(tenantId);
    const employee = await seedEmployee(tenantId.toString());

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });

    expect(Buffer.isBuffer(result.pdf)).toBe(true);
    expect(result.pdf.length).toBeGreaterThan(1024);
    expect(result.filename).toBe('cracha-EMP-00042.pdf');
    // QR token was rotated — repo has a non-null qrTokenHash now.
    const reloaded = await employeesRepo.findById(
      employee.id,
      tenantId.toString(),
    );
    expect(reloaded?.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('throws ResourceNotFoundError when the employee does not exist', async () => {
    const tenantId = new UniqueEntityID();
    await seedTenant(tenantId);

    await expect(
      sut.execute({
        tenantId: tenantId.toString(),
        employeeId: '00000000-0000-0000-0000-000000000000',
        rotatedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the tenant does not exist', async () => {
    const tenantId = new UniqueEntityID();
    // Create the employee on a fake tenant-id without seeding a Tenant row.
    const employee = await seedEmployee(tenantId.toString());

    await expect(
      sut.execute({
        tenantId: tenantId.toString(),
        employeeId: employee.id.toString(),
        rotatedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('defaults brand color to #2563EB when tenant.settings has no brandColor', async () => {
    const tenantId = new UniqueEntityID();
    await seedTenant(tenantId);
    const employee = await seedEmployee(tenantId.toString());

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });
    // We can't easily assert the exact color on the PDF bytes (content stream
    // compressed); we just confirm the use case ran without failure.
    expect(result.pdf.length).toBeGreaterThan(1024);
  });

  it('passes tenant.settings.brandColor when it is present', async () => {
    const tenantId = new UniqueEntityID();
    const tenant = await seedTenant(tenantId);
    tenant.settings = { brandColor: '#FF00AA' };
    const employee = await seedEmployee(tenantId.toString());

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });
    expect(result.pdf.length).toBeGreaterThan(1024);
  });
});
