import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { DeleteCipaMandateUseCase } from './delete-cipa-mandate';

let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let sut: DeleteCipaMandateUseCase;

const TENANT_ID = 'tenant-01';

describe('DeleteCipaMandateUseCase', () => {
  beforeEach(() => {
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    sut = new DeleteCipaMandateUseCase(cipaMandatesRepository);
  });

  it('should delete a CIPA mandate without members', async () => {
    const cipaMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const { cipaMandate: deletedMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: cipaMandate.id.toString(),
    });

    expect(deletedMandate.name).toBe('CIPA 2026/2027');

    const foundMandate = await cipaMandatesRepository.findById(
      cipaMandate.id,
      TENANT_ID,
    );
    expect(foundMandate).toBeNull();
  });

  it('should throw ResourceNotFoundError when mandate does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when mandate belongs to another tenant', async () => {
    const cipaMandate = await cipaMandatesRepository.create({
      tenantId: 'another-tenant',
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: cipaMandate.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when mandate has members', async () => {
    const cipaMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    cipaMandatesRepository.setMemberCount(cipaMandate.id.toString(), 3);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: cipaMandate.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
