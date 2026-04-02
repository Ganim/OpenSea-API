import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  collectPDFBuffer,
  createPDFDocument,
  drawHorizontalLine,
  drawSectionHeader,
  drawTableHeader,
  drawTableRow,
  formatDateBR,
  formatCNPJ,
  type TableColumn,
} from '@/lib/pdf/pdf-generator';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface GeneratePPPRequest {
  tenantId: string;
  employeeId: string;
}

export interface GeneratePPPResponse {
  buffer: Buffer;
  filename: string;
}

export interface PPPCompanyData {
  legalName: string;
  cnpj: string;
  tradeName?: string;
}

export interface PPPPositionHistory {
  positionName: string;
  departmentName?: string;
  startDate: Date;
  endDate?: Date;
}

export class GeneratePPPUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private medicalExamsRepository: MedicalExamsRepository,
  ) {}

  async execute(request: GeneratePPPRequest): Promise<GeneratePPPResponse> {
    const { tenantId, employeeId } = request;

    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Fetch medical exams (ASOs)
    const medicalExams = await this.medicalExamsRepository.findByEmployeeId(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    // Get company data from employee's metadata or company relation
    const companyData: PPPCompanyData = {
      legalName:
        (employee.metadata?.companyLegalName as string) ??
        'Empresa não informada',
      cnpj: (employee.metadata?.companyCnpj as string) ?? '',
      tradeName: (employee.metadata?.companyTradeName as string) ?? undefined,
    };

    // Generate PDF
    const doc = createPDFDocument({
      title: 'PPP - Perfil Profissiográfico Previdenciário',
      subject: `PPP de ${employee.fullName}`,
    });

    let y = 40;

    // Title
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#1e293b')
      .text('PPP — PERFIL PROFISSIOGRÁFICO PREVIDENCIÁRIO', 50, y, {
        align: 'center',
        width: doc.page.width - 100,
      });
    y += 25;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        'Documento gerado conforme IN INSS/PRES nº 128/2022 e Decreto nº 3.048/99',
        50,
        y,
        { align: 'center', width: doc.page.width - 100 },
      );
    y += 20;

    drawHorizontalLine(doc, y);
    y += 10;

    // ──── Seção 1: Dados do Empregador ────
    y = drawSectionHeader(doc, '1 — DADOS DO EMPREGADOR', y);
    y += 5;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
    doc.text(`Razão Social: ${companyData.legalName}`, 55, y);
    y += 14;
    if (companyData.cnpj) {
      doc.text(`CNPJ: ${formatCNPJ(companyData.cnpj)}`, 55, y);
      y += 14;
    }
    if (companyData.tradeName) {
      doc.text(`Nome Fantasia: ${companyData.tradeName}`, 55, y);
      y += 14;
    }
    y += 5;

    // ──── Seção 2: Dados do Trabalhador ────
    y = drawSectionHeader(doc, '2 — DADOS DO TRABALHADOR', y);
    y += 5;

    const employeeFields: Array<[string, string]> = [
      ['Nome Completo', employee.fullName],
      ['CPF', employee.cpf.formatted],
      [
        'Data de Nascimento',
        employee.birthDate ? formatDateBR(employee.birthDate) : 'Não informada',
      ],
      ['PIS/PASEP', employee.pis?.formatted ?? 'Não informado'],
      [
        'CTPS',
        [employee.ctpsNumber, employee.ctpsSeries, employee.ctpsState]
          .filter(Boolean)
          .join(' / ') || 'Não informada',
      ],
      ['Data de Admissão', formatDateBR(employee.hireDate)],
      [
        'Data de Desligamento',
        employee.terminationDate
          ? formatDateBR(employee.terminationDate)
          : 'Em atividade',
      ],
      ['Matrícula', employee.registrationNumber],
    ];

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
    for (const [label, value] of employeeFields) {
      doc.font('Helvetica-Bold').text(`${label}: `, 55, y, { continued: true });
      doc.font('Helvetica').text(value);
      y += 14;
    }
    y += 5;

    // ──── Seção 3: Lotações / Cargos ────
    y = drawSectionHeader(doc, '3 — LOTAÇÕES E CARGOS', y);
    y += 5;

    // We build position history from metadata if available,
    // otherwise show current position
    const positionHistory: PPPPositionHistory[] =
      (employee.metadata?.positionHistory as PPPPositionHistory[]) ?? [];

    if (positionHistory.length === 0) {
      // Show current position only
      doc.font('Helvetica').fontSize(9);
      doc.text(
        `Cargo atual não disponível via histórico. Verificar registros de transferência.`,
        55,
        y,
      );
      y += 14;
    } else {
      const posColumns: TableColumn[] = [
        { header: 'Cargo', width: 180 },
        { header: 'Departamento', width: 140 },
        { header: 'Início', width: 80, align: 'center' },
        { header: 'Fim', width: 80, align: 'center' },
      ];

      y = drawTableHeader(doc, posColumns, y);

      for (const pos of positionHistory) {
        y = drawTableRow(
          doc,
          posColumns,
          [
            pos.positionName,
            pos.departmentName ?? '—',
            formatDateBR(pos.startDate),
            pos.endDate ? formatDateBR(pos.endDate) : 'Atual',
          ],
          y,
        );
      }
    }
    y += 10;

    // ──── Seção 4: Fatores de Risco / Agentes Nocivos ────
    y = drawSectionHeader(doc, '4 — FATORES DE RISCO / AGENTES NOCIVOS', y);
    y += 5;

    const hasHazardPay = employee.metadata?.hazardPayGrade;
    const hasDangerPay = employee.metadata?.dangerPay;

    if (hasHazardPay || hasDangerPay) {
      doc.font('Helvetica').fontSize(9);
      if (hasHazardPay) {
        doc.text(
          `Insalubridade: Grau ${hasHazardPay === 'MIN' ? 'Mínimo (10%)' : hasHazardPay === 'MED' ? 'Médio (20%)' : 'Máximo (40%)'}`,
          55,
          y,
        );
        y += 14;
      }
      if (hasDangerPay) {
        doc.text('Periculosidade: 30% sobre salário base', 55, y);
        y += 14;
      }
    } else {
      doc.font('Helvetica').fontSize(9);
      doc.text('Nenhum agente nocivo registrado para este trabalhador.', 55, y);
      y += 14;
    }
    y += 5;

    // ──── Seção 5: Exames Médicos (ASOs) ────
    y = drawSectionHeader(
      doc,
      '5 — RESULTADOS DE MONITORAÇÃO BIOLÓGICA (ASOs)',
      y,
    );
    y += 5;

    if (medicalExams.length === 0) {
      doc.font('Helvetica').fontSize(9);
      doc.text('Nenhum exame médico registrado.', 55, y);
      y += 14;
    } else {
      const examColumns: TableColumn[] = [
        { header: 'Tipo', width: 100 },
        { header: 'Data', width: 80, align: 'center' },
        { header: 'Resultado', width: 90, align: 'center' },
        { header: 'Médico', width: 130 },
        { header: 'CRM', width: 80 },
      ];

      y = drawTableHeader(doc, examColumns, y);

      const examTypeLabels: Record<string, string> = {
        ADMISSIONAL: 'Admissional',
        PERIODICO: 'Periódico',
        MUDANCA_FUNCAO: 'Mudança de Função',
        RETORNO: 'Retorno ao Trabalho',
        DEMISSIONAL: 'Demissional',
      };

      const resultLabels: Record<string, string> = {
        APTO: 'Apto',
        INAPTO: 'Inapto',
        APTO_COM_RESTRICOES: 'Apto c/ Restrições',
      };

      for (const exam of medicalExams) {
        // Check if we need a new page
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 40;
        }

        y = drawTableRow(
          doc,
          examColumns,
          [
            examTypeLabels[exam.type] ?? exam.type,
            formatDateBR(exam.examDate),
            resultLabels[exam.result] ?? exam.result,
            exam.doctorName,
            exam.doctorCrm,
          ],
          y,
        );
      }
    }
    y += 10;

    // ──── Seção 6: Responsável Técnico ────
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 40;
    }

    y = drawSectionHeader(doc, '6 — RESPONSÁVEL PELAS INFORMAÇÕES', y);
    y += 5;

    const responsibleName =
      (employee.metadata?.pppResponsibleName as string) ??
      '___________________________';
    const responsibleRole =
      (employee.metadata?.pppResponsibleRole as string) ??
      'Responsável Técnico';
    const responsibleCRM =
      (employee.metadata?.pppResponsibleRegistration as string) ?? '';

    doc.font('Helvetica').fontSize(9);
    doc.text(`Nome: ${responsibleName}`, 55, y);
    y += 14;
    doc.text(`Função: ${responsibleRole}`, 55, y);
    y += 14;
    if (responsibleCRM) {
      doc.text(`Registro Profissional: ${responsibleCRM}`, 55, y);
      y += 14;
    }

    y += 30;
    doc.text(`Data de emissão: ${formatDateBR(new Date())}`, 55, y);
    y += 30;

    // Signature line
    drawHorizontalLine(doc, y, { lineWidth: 0.3 });
    y += 5;
    doc.text('Assinatura do Responsável', 55, y, {
      width: doc.page.width - 100,
      align: 'center',
    });

    const buffer = await collectPDFBuffer(doc);

    const cleanName = employee.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `PPP_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;

    return { buffer, filename };
  }
}
