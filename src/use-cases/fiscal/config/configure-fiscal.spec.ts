import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { ConfigureFiscalUseCase } from './configure-fiscal';

let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let sut: ConfigureFiscalUseCase;

describe('Configure Fiscal Use Case', () => {
  beforeEach(() => {
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    sut = new ConfigureFiscalUseCase(fiscalConfigsRepository);
  });

  it('should create a new fiscal configuration', async () => {
    const { fiscalConfig } = await sut.execute({
      tenantId: 'tenant-1',
      provider: 'NUVEM_FISCAL',
      environment: 'HOMOLOGATION',
      apiKey: 'test-api-key',
      defaultCfop: '5102',
      defaultNaturezaOperacao: 'Venda de Mercadoria',
      taxRegime: 'SIMPLES_NACIONAL',
    });

    expect(fiscalConfig.provider).toBe('NUVEM_FISCAL');
    expect(fiscalConfig.environment).toBe('HOMOLOGATION');
    expect(fiscalConfig.apiKey).toBe('test-api-key');
    expect(fiscalConfig.defaultCfop).toBe('5102');
    expect(fiscalConfig.defaultSeries).toBe(1);
    expect(fiscalConfig.lastNfeNumber).toBe(0);
    expect(fiscalConfig.lastNfceNumber).toBe(0);
    expect(fiscalConfig.nfceEnabled).toBe(false);
    expect(fiscalConfig.contingencyMode).toBe(false);
    expect(fiscalConfigsRepository.items).toHaveLength(1);
  });

  it('should update an existing fiscal configuration', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      provider: 'NUVEM_FISCAL',
      environment: 'HOMOLOGATION',
      apiKey: 'old-key',
      defaultCfop: '5102',
      defaultNaturezaOperacao: 'Venda de Mercadoria',
      taxRegime: 'SIMPLES_NACIONAL',
    });

    const { fiscalConfig } = await sut.execute({
      tenantId: 'tenant-1',
      provider: 'NUVEM_FISCAL',
      environment: 'PRODUCTION',
      apiKey: 'new-key',
      defaultCfop: '6102',
      defaultNaturezaOperacao: 'Venda Interestadual',
      taxRegime: 'LUCRO_PRESUMIDO',
      nfceEnabled: true,
    });

    expect(fiscalConfig.environment).toBe('PRODUCTION');
    expect(fiscalConfig.apiKey).toBe('new-key');
    expect(fiscalConfig.defaultCfop).toBe('6102');
    expect(fiscalConfig.taxRegime).toBe('LUCRO_PRESUMIDO');
    expect(fiscalConfig.nfceEnabled).toBe(true);
    expect(fiscalConfigsRepository.items).toHaveLength(1);
  });
});
