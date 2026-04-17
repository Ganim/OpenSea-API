import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateContractPDFUseCase } from './generate-contract-pdf';

// Mock pdfkit to avoid the binary-font dependency in unit tests.
vi.mock('@/lib/pdf', () => {
  const mockDoc = {
    page: {
      margins: { left: 50, right: 50, top: 50, bottom: 50 },
      width: 595,
      height: 842,
    },
    font: vi.fn().mockReturnThis(),
    fontSize: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    switchToPage: vi.fn().mockReturnThis(),
    bufferedPageRange: vi.fn().mockReturnValue({ start: 0, count: 1 }),
  };

  return {
    createPDFDocument: vi.fn().mockReturnValue(mockDoc),
    collectPDFBuffer: vi
      .fn()
      .mockResolvedValue(Buffer.from('mock-contract-pdf')),
    drawHorizontalLine: vi.fn(),
    formatCNPJ: vi.fn((cnpj: string) => cnpj),
    formatDateBR: vi.fn(() => '16/04/2026'),
  };
});

class StubFileUploadService implements FileUploadService {
  public uploadCalls: Array<{
    fileName: string;
    mimeType: string;
    options: UploadOptions;
    size: number;
  }> = [];

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    this.uploadCalls.push({
      fileName,
      mimeType,
      options,
      size: fileBuffer.length,
    });
    return {
      key: `${options.prefix}/${fileName}`,
      url: `https://files.example.com/${options.prefix}/${fileName}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `https://files.example.com/signed/${key}`;
  }

  async getObject(): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async delete(): Promise<void> {}

  async initiateMultipartUpload(): Promise<MultipartUploadInit> {
    return { uploadId: 'mp-1', key: 'mp-1' };
  }

  async getPresignedPartUrls(): Promise<MultipartPartUrl[]> {
    return [];
  }

  async completeMultipartUpload(): Promise<UploadResult> {
    return { key: '', url: '', size: 0, mimeType: '' };
  }

  async abortMultipartUpload(): Promise<void> {}

  async getPresignedPartUrlsParts(
    _key: string,
    _uploadId: string,
    _parts: MultipartCompletePart[],
  ): Promise<void> {}
}

let employeesRepository: InMemoryEmployeesRepository;
let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let generatedContractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let fileUploadService: StubFileUploadService;
let sut: GenerateContractPDFUseCase;

const tenantId = new UniqueEntityID().toString();
const generatedByUserId = new UniqueEntityID().toString();

describe('Generate Contract PDF Use Case', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00Z'));
    employeesRepository = new InMemoryEmployeesRepository();
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    generatedContractsRepository =
      new InMemoryGeneratedEmploymentContractsRepository();
    fileUploadService = new StubFileUploadService();
    sut = new GenerateContractPDFUseCase(
      employeesRepository,
      contractTemplatesRepository,
      generatedContractsRepository,
      fileUploadService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createTestEmployee() {
    return employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-9001',
      fullName: 'Mariana Lopes',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-10'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 6500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  }

  async function createTestTemplate(content: string, isActive = true) {
    return contractTemplatesRepository.create({
      tenantId,
      name: 'Modelo CLT Padrão',
      type: 'CLT',
      content,
      isActive,
    });
  }

  it('renders merge fields, persists the contract and uploads the PDF', async () => {
    const employee = await createTestEmployee();
    const template = await createTestTemplate(
      'Contratante: {{tenant.name}}\nFuncionário: {{employee.fullName}} ({{employee.registrationNumber}})\nSalário base: {{currency:employee.baseSalary}}',
    );

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      templateId: template.id.toString(),
      generatedByUserId,
      companyName: 'OpenSea Tecnologia LTDA',
      companyCnpj: '12345678000100',
    });

    expect(result.renderedText).toContain('OpenSea Tecnologia LTDA');
    expect(result.renderedText).toContain('Mariana Lopes (EMP-9001)');
    expect(result.renderedText).toContain('6.500,00');

    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfKey).toBeDefined();
    expect(result.base64.length).toBeGreaterThan(0);

    expect(fileUploadService.uploadCalls).toHaveLength(1);
    expect(fileUploadService.uploadCalls[0].mimeType).toBe('application/pdf');
    expect(fileUploadService.uploadCalls[0].fileName).toContain('EMP-9001');

    expect(generatedContractsRepository.items).toHaveLength(1);
    const stored = generatedContractsRepository.items[0];
    expect(stored.employeeId.toString()).toBe(employee.id.toString());
    expect(stored.templateId.toString()).toBe(template.id.toString());
    expect(stored.generatedBy.toString()).toBe(generatedByUserId);
    expect(stored.pdfUrl).toBe(result.pdfUrl);
    expect(stored.variables).toMatchObject({
      employee: { fullName: 'Mariana Lopes' },
    });
  });

  it('honours additionalVars passed by the caller', async () => {
    const employee = await createTestEmployee();
    const template = await createTestTemplate(
      'Cláusula extra: {{custom.clauseTitle}} — assinado em {{date:BR|today}}',
    );

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      templateId: template.id.toString(),
      generatedByUserId,
      additionalVars: { custom: { clauseTitle: 'Confidencialidade Total' } },
    });

    expect(result.renderedText).toContain('Confidencialidade Total');
    expect(result.renderedText).toContain('16/04/2026');
  });

  it('throws ResourceNotFoundError when the employee is unknown', async () => {
    const template = await createTestTemplate('Conteúdo');

    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        templateId: template.id.toString(),
        generatedByUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the template is unknown', async () => {
    const employee = await createTestEmployee();

    await expect(
      sut.execute({
        tenantId,
        employeeId: employee.id.toString(),
        templateId: new UniqueEntityID().toString(),
        generatedByUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejects generation when the template is inactive', async () => {
    const employee = await createTestEmployee();
    const template = await createTestTemplate('Conteúdo', false);

    await expect(
      sut.execute({
        tenantId,
        employeeId: employee.id.toString(),
        templateId: template.id.toString(),
        generatedByUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
