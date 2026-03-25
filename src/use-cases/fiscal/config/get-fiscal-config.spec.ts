import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { GetFiscalConfigUseCase } from './get-fiscal-config';

let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let sut: GetFiscalConfigUseCase;

describe('Get Fiscal Config Use Case', () => {
  beforeEach(() => {
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    sut = new GetFiscalConfigUseCase(fiscalConfigsRepository);
  });

  it('should return the fiscal configuration for a tenant', async () => {
    const config = FiscalConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      provider: 'NUVEM_FISCAL',
      environment: 'HOMOLOGATION',
      apiKey: 'test-key',
      defaultCfop: '5102',
      defaultNaturezaOperacao: 'Venda',
      taxRegime: 'SIMPLES_NACIONAL',
    });

    fiscalConfigsRepository.items.push(config);

    const { fiscalConfig } = await sut.execute({ tenantId: 'tenant-1' });

    expect(fiscalConfig.provider).toBe('NUVEM_FISCAL');
    expect(fiscalConfig.apiKey).toBe('test-key');
  });

  it('should throw ResourceNotFoundError when config does not exist', async () => {
    await expect(
      sut.execute({ tenantId: 'non-existent-tenant' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
