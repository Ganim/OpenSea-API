import { beforeEach, describe, expect, it } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryComplianceArtifactRepository } from '@/repositories/hr/in-memory/in-memory-compliance-artifact-repository';
import { InMemoryComplianceRubricaMapRepository } from '@/repositories/hr/in-memory/in-memory-compliance-rubrica-map-repository';
import { FakeFileUploadService } from '@/utils/tests/fakes/fake-file-upload-service';

import {
  BuildS1200ForCompetenciaUseCase,
  type S1200EmployeeDataset,
} from './build-s1200-for-competencia';

const TENANT = 'tenant-a';
const USER = 'user-1';
const CNPJ = '00000000000100';

function seedRequiredRubricas(repo: InMemoryComplianceRubricaMapRepository) {
  return Promise.all([
    repo.upsert({
      tenantId: TENANT,
      clrConcept: 'HE_50',
      codRubr: 'HE50',
      ideTabRubr: 'TAB01',
      indApurIR: 0,
      updatedBy: USER,
    }),
    repo.upsert({
      tenantId: TENANT,
      clrConcept: 'HE_100',
      codRubr: 'HE100',
      ideTabRubr: 'TAB01',
      indApurIR: 0,
      updatedBy: USER,
    }),
    repo.upsert({
      tenantId: TENANT,
      clrConcept: 'DSR',
      codRubr: 'DSR',
      ideTabRubr: 'TAB01',
      indApurIR: 0,
      updatedBy: USER,
    }),
  ]);
}

function makeEmployee(
  overrides: Partial<S1200EmployeeDataset> = {},
): S1200EmployeeDataset {
  return {
    id: overrides.id ?? 'emp-1',
    cpfTrab: overrides.cpfTrab ?? '12345678909',
    codCateg: overrides.codCateg ?? 101,
    codLotacao: overrides.codLotacao ?? 'LOT01',
    estabCnpj: overrides.estabCnpj ?? CNPJ,
    estabTpInsc: overrides.estabTpInsc ?? 1,
    payrollItems: overrides.payrollItems ?? [
      {
        codRubr: '1000',
        ideTabRubr: 'TAB01',
        vrRubr: 3000,
      },
    ],
    timeBank: overrides.timeBank,
  };
}

describe('BuildS1200ForCompetenciaUseCase', () => {
  let rubricaRepo: InMemoryComplianceRubricaMapRepository;
  let complianceRepo: InMemoryComplianceArtifactRepository;
  let fileUpload: FakeFileUploadService;
  let sut: BuildS1200ForCompetenciaUseCase;

  beforeEach(() => {
    rubricaRepo = new InMemoryComplianceRubricaMapRepository();
    complianceRepo = new InMemoryComplianceArtifactRepository();
    fileUpload = new FakeFileUploadService();
    sut = new BuildS1200ForCompetenciaUseCase(
      rubricaRepo,
      complianceRepo,
      fileUpload,
    );
  });

  it('happy path: scope ALL com 2 funcionários gera 2 eventos + 2 artifacts', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [
        makeEmployee({ id: 'emp-1' }),
        makeEmployee({ id: 'emp-2', cpfTrab: '98765432100' }),
      ],
    });

    expect(result.eventIds).toHaveLength(2);
    expect(result.artifactIds).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.environment).toBe('HOMOLOGACAO');
    expect(complianceRepo.items).toHaveLength(2);
    expect(complianceRepo.items[0].type).toBe('S1200_XML');
  });

  // CR-02 (LGPD sentinel): CPF do trabalhador NUNCA deve ser persistido em
  // `filters` do ComplianceArtifact — o campo é exposto na API de listagem
  // (authenticated, but still broadcast ao frontend). O CPF permanece apenas
  // dentro do XML S-1200 no storage privado.
  it('LGPD sentinel: never persists cpfTrab inside ComplianceArtifact.filters', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const cpfA = '12345678909';
    const cpfB = '98765432100';

    await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [
        makeEmployee({ id: 'emp-1', cpfTrab: cpfA }),
        makeEmployee({ id: 'emp-2', cpfTrab: cpfB }),
      ],
    });

    for (const artifact of complianceRepo.items) {
      const filters = artifact.filters as Record<string, unknown> | null;
      expect(filters).toBeTruthy();
      // Direct assertion: cpfTrab key MUST NOT exist in filters.
      expect(filters).not.toHaveProperty('cpfTrab');

      // Broader sentinel: serialized filters must not contain any 11-digit
      // numeric substring matching a CPF pattern.
      const serialized = JSON.stringify(filters);
      expect(serialized).not.toContain(cpfA);
      expect(serialized).not.toContain(cpfB);
      expect(serialized).not.toMatch(/\b\d{11}\b/);
    }
  });

  it('rejects 400 when rubrica HE_50 is missing (Pitfall 6)', async () => {
    // Seed only HE_100 + DSR; HE_50 missing.
    await rubricaRepo.upsert({
      tenantId: TENANT,
      clrConcept: 'HE_100',
      codRubr: 'HE100',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });
    await rubricaRepo.upsert({
      tenantId: TENANT,
      clrConcept: 'DSR',
      codRubr: 'DSR',
      ideTabRubr: 'TAB01',
      updatedBy: USER,
    });

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [makeEmployee()],
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [makeEmployee()],
      }),
    ).rejects.toThrow(/Configure rubricas HE\/DSR/);
  });

  it('rejects 400 when employerCnpj is invalid (EsocialConfig ausente / malformado)', async () => {
    await seedRequiredRubricas(rubricaRepo);

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: '',
        employees: [makeEmployee()],
      }),
    ).rejects.toThrow(/CNPJ do empregador inválido/);
  });

  it('rejects 400 when competencia is not YYYY-MM', async () => {
    await seedRequiredRubricas(rubricaRepo);

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-3', // invalid (missing leading zero)
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [makeEmployee()],
      }),
    ).rejects.toThrow(/Competência inválida/);
  });

  it('rejects 400 when employees[] is empty', async () => {
    await seedRequiredRubricas(rubricaRepo);

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [],
      }),
    ).rejects.toThrow(/Nenhum funcionário informado/);
  });

  it('graceful fallback: 1 employee with invalid CPF → errors[1], others continue', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [
        makeEmployee({ id: 'emp-ok' }),
        makeEmployee({ id: 'emp-bad-cpf', cpfTrab: '123' }),
      ],
    });

    expect(result.eventIds).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].employeeId).toBe('emp-bad-cpf');
    expect(result.errors[0].reason).toMatch(/CPF/);
  });

  it('retificação: retify input generates indRetif=2 + nrRecibo in XML', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [makeEmployee()],
      retify: {
        originalReceiptNumber: 'REC-123456',
        originalEsocialEventId: 'original-event-id',
      },
    });

    expect(result.events[0].xmlContent).toContain('<indRetif>2</indRetif>');
    expect(result.events[0].xmlContent).toContain(
      '<nrRecibo>REC-123456</nrRecibo>',
    );
    expect(result.events[0].rectifiedEventId).toBe('original-event-id');
  });

  it('tpAmb=1 (produção) derives environment=PRODUCAO in output', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 1,
      employerCnpj: CNPJ,
      employees: [makeEmployee()],
    });

    expect(result.environment).toBe('PRODUCAO');
    expect(result.events[0].xmlContent).toContain('<tpAmb>1</tpAmb>');
  });

  it('injects HE_50/HE_100/DSR rubricas from timeBank when minutes > 0', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [
        makeEmployee({
          timeBank: {
            overtime50Minutes: 120, // 2h
            overtime100Minutes: 60, // 1h
            dsrMinutes: 480, // 8h (1 DSR)
          },
        }),
      ],
    });

    const xml = result.events[0].xmlContent;
    // HE50 rubrica code embedded:
    expect(xml).toContain('<codRubr>HE50</codRubr>');
    expect(xml).toContain('<codRubr>HE100</codRubr>');
    expect(xml).toContain('<codRubr>DSR</codRubr>');
  });

  it('tenant isolation: rubrica map from tenant B is NOT used for tenant A', async () => {
    // Seed tenant-b rubricas
    await rubricaRepo.upsert({
      tenantId: 'tenant-b',
      clrConcept: 'HE_50',
      codRubr: 'B_HE50',
      ideTabRubr: 'B_TAB',
      updatedBy: USER,
    });
    await rubricaRepo.upsert({
      tenantId: 'tenant-b',
      clrConcept: 'HE_100',
      codRubr: 'B_HE100',
      ideTabRubr: 'B_TAB',
      updatedBy: USER,
    });
    await rubricaRepo.upsert({
      tenantId: 'tenant-b',
      clrConcept: 'DSR',
      codRubr: 'B_DSR',
      ideTabRubr: 'B_TAB',
      updatedBy: USER,
    });

    // tenant-a has NO rubricas → should reject.
    await expect(
      sut.execute({
        tenantId: TENANT, // tenant-a
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [makeEmployee()],
      }),
    ).rejects.toThrow(/Configure rubricas/);
  });

  it('employee without payrollItems AND without timeBank → error, does not abort batch', async () => {
    await seedRequiredRubricas(rubricaRepo);

    const result = await sut.execute({
      tenantId: TENANT,
      invokedByUserId: USER,
      competencia: '2026-03',
      tpAmb: 2,
      employerCnpj: CNPJ,
      employees: [
        makeEmployee({ id: 'emp-ok' }),
        makeEmployee({ id: 'emp-empty', payrollItems: [] }),
      ],
    });

    expect(result.eventIds).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].employeeId).toBe('emp-empty');
    expect(result.errors[0].reason).toMatch(/Nenhuma rubrica/);
  });

  it('rejects entire batch (400) when 100% of employees fail', async () => {
    await seedRequiredRubricas(rubricaRepo);

    await expect(
      sut.execute({
        tenantId: TENANT,
        invokedByUserId: USER,
        competencia: '2026-03',
        tpAmb: 2,
        employerCnpj: CNPJ,
        employees: [
          makeEmployee({ id: 'bad-1', cpfTrab: '1' }),
          makeEmployee({ id: 'bad-2', cpfTrab: '2' }),
        ],
      }),
    ).rejects.toThrow(/Nenhum evento S-1200/);
  });
});
