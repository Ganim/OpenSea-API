import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractTemplate } from '@/entities/hr/contract-template';
import type { Employee } from '@/entities/hr/employee';
import type { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';
import { renderTemplate } from '@/lib/hr/contract-template-engine';
import {
  collectPDFBuffer,
  createPDFDocument,
  drawHorizontalLine,
  formatCNPJ,
  formatDateBR,
} from '@/lib/pdf';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

export interface GenerateContractPDFRequest {
  tenantId: string;
  employeeId: string;
  templateId: string;
  generatedByUserId: string;
  additionalVars?: Record<string, unknown>;
  companyName?: string;
  companyCnpj?: string;
}

export interface GenerateContractPDFResponse {
  contract: GeneratedEmploymentContract;
  pdfUrl: string;
  pdfKey: string;
  base64: string;
  renderedText: string;
}

const PDF_UPLOAD_PREFIX = 'hr/contracts';
const PDF_MIME_TYPE = 'application/pdf';

export class GenerateContractPDFUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private contractTemplatesRepository: ContractTemplatesRepository,
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: GenerateContractPDFRequest,
  ): Promise<GenerateContractPDFResponse> {
    const {
      tenantId,
      employeeId,
      templateId,
      generatedByUserId,
      additionalVars,
      companyName,
      companyCnpj,
    } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Employee not found');
    }

    const template = await this.contractTemplatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );
    if (!template) {
      throw new ResourceNotFoundError('Contract template not found');
    }
    if (!template.isActive) {
      throw new BadRequestError(
        'Cannot generate a contract from an inactive template',
      );
    }

    const variables = this.buildTemplateVariables({
      employee,
      tenantId,
      additionalVars,
      companyName,
      companyCnpj,
    });

    const renderedText = renderTemplate(template.content, variables);

    const pdfBuffer = await this.buildPDF({
      template,
      employee,
      renderedText,
      companyName,
      companyCnpj,
    });

    const fileName = this.buildFileName(template, employee);

    const uploadResult = await this.fileUploadService.upload(
      pdfBuffer,
      fileName,
      PDF_MIME_TYPE,
      { prefix: `${PDF_UPLOAD_PREFIX}/${tenantId}` },
    );

    const contract = await this.generatedContractsRepository.create({
      tenantId,
      templateId: template.id,
      employeeId: employee.id,
      generatedBy: new UniqueEntityID(generatedByUserId),
      variables,
      pdfUrl: uploadResult.url,
      pdfKey: uploadResult.key,
    });

    return {
      contract,
      pdfUrl: uploadResult.url,
      pdfKey: uploadResult.key,
      base64: pdfBuffer.toString('base64'),
      renderedText,
    };
  }

  private buildTemplateVariables(params: {
    employee: Employee;
    tenantId: string;
    additionalVars?: Record<string, unknown>;
    companyName?: string;
    companyCnpj?: string;
  }): Record<string, unknown> {
    const { employee, tenantId, additionalVars, companyName, companyCnpj } =
      params;

    const today = new Date();

    return {
      today: today.toISOString(),
      todayFormatted: formatDateBR(today),
      tenant: {
        id: tenantId,
        name: companyName ?? '',
        cnpj: companyCnpj ?? '',
        cnpjFormatted: companyCnpj ? formatCNPJ(companyCnpj) : '',
      },
      employee: {
        id: employee.id.toString(),
        registrationNumber: employee.registrationNumber,
        fullName: employee.fullName,
        socialName: employee.socialName ?? '',
        cpf: employee.cpf.formatted,
        birthDate: employee.birthDate?.toISOString() ?? '',
        hireDate: employee.hireDate.toISOString(),
        baseSalary: employee.baseSalary ?? 0,
        contractType: employee.contractType.value,
        workRegime: employee.workRegime.value,
        weeklyHours: employee.weeklyHours,
        email: employee.email ?? '',
        mobilePhone: employee.mobilePhone ?? '',
        address: employee.address ?? '',
        addressNumber: employee.addressNumber ?? '',
        neighborhood: employee.neighborhood ?? '',
        city: employee.city ?? '',
        state: employee.state ?? '',
        zipCode: employee.zipCode ?? '',
        country: employee.country,
      },
      position: {
        id: employee.positionId?.toString() ?? '',
      },
      department: {
        id: employee.departmentId?.toString() ?? '',
      },
      ...(additionalVars ?? {}),
    };
  }

  private async buildPDF(params: {
    template: ContractTemplate;
    employee: Employee;
    renderedText: string;
    companyName?: string;
    companyCnpj?: string;
  }): Promise<Buffer> {
    const { template, employee, renderedText, companyName, companyCnpj } =
      params;

    const doc = createPDFDocument({
      title: `${template.name} — ${employee.fullName}`,
      subject: `Contrato de trabalho — ${employee.registrationNumber}`,
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let cursorY = margins.top;

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#1e293b')
      .text(companyName ?? 'Empresa', margins.left, cursorY, {
        width: contentWidth,
      });
    cursorY += 18;

    if (companyCnpj) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#64748b')
        .text(`CNPJ: ${formatCNPJ(companyCnpj)}`, margins.left, cursorY, {
          width: contentWidth,
        });
      cursorY += 14;
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(template.name.toUpperCase(), margins.left, cursorY, {
        width: contentWidth,
        align: 'center',
      });
    cursorY += 18;

    drawHorizontalLine(doc, cursorY, { color: '#1e293b', lineWidth: 1 });
    cursorY += 10;

    // Body — render the template text. pdfkit handles automatic page-breaks
    // when we pass a `width` and the cursor is positioned via `y`.
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(renderedText, margins.left, cursorY, {
        width: contentWidth,
        align: 'justify',
        lineGap: 3,
      });

    // Footer with company name + CNPJ + page X/Y
    const totalPages = doc.bufferedPageRange().count;
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      doc.switchToPage(pageIndex);
      const footerY = doc.page.height - margins.bottom + 10;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#94a3b8')
        .text(
          `${companyName ?? ''}${companyCnpj ? ` — CNPJ ${formatCNPJ(companyCnpj)}` : ''}`,
          margins.left,
          footerY,
          { width: contentWidth / 2, align: 'left', lineBreak: false },
        );

      doc.text(
        `Página ${pageIndex + 1} de ${totalPages}`,
        margins.left + contentWidth / 2,
        footerY,
        { width: contentWidth / 2, align: 'right', lineBreak: false },
      );
    }

    return collectPDFBuffer(doc);
  }

  private buildFileName(
    template: ContractTemplate,
    employee: Employee,
  ): string {
    const safeTemplate = template.name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    return `contrato_${safeTemplate}_${employee.registrationNumber}.pdf`;
  }
}
