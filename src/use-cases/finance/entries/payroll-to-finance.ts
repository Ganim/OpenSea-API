import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PayrollItemTypeValue } from '@/entities/hr/value-objects/payroll-item-type';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

interface PayrollToFinanceRequest {
  tenantId: string;
  payrollId: string;
}

interface PayrollToFinanceResponse {
  entriesCreated: number;
  totalAmount: number;
}

// Maps payroll item types to finance category slugs
const PAYROLL_TYPE_TO_CATEGORY: Record<PayrollItemTypeValue, string> = {
  BASE_SALARY: 'salarios-e-ordenados',
  OVERTIME: 'salarios-e-ordenados',
  NIGHT_SHIFT: 'salarios-e-ordenados',
  HAZARD_PAY: 'salarios-e-ordenados',
  DANGER_PAY: 'salarios-e-ordenados',
  VACATION_PAY: 'salarios-e-ordenados',
  THIRTEENTH_SALARY: 'salarios-e-ordenados',
  COMMISSION: 'salarios-e-ordenados',
  BONUS: 'gratificacoes-e-bonus',
  INSS: 'encargos-sociais-inss',
  IRRF: 'impostos-irrf',
  FGTS: 'encargos-sociais-fgts',
  HEALTH_PLAN: 'beneficios-plano-saude',
  DENTAL_PLAN: 'beneficios-plano-saude',
  TRANSPORT_VOUCHER: 'beneficios-vale-transporte',
  MEAL_VOUCHER: 'beneficios-vale-refeicao',
  OTHER_BENEFIT: 'salarios-e-ordenados',
  ADVANCE: 'salarios-e-ordenados',
  LOAN: 'salarios-e-ordenados',
  OTHER_DEDUCTION: 'salarios-e-ordenados',
};

export class PayrollToFinanceUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private employeesRepository: EmployeesRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(request: PayrollToFinanceRequest): Promise<PayrollToFinanceResponse> {
    const { tenantId, payrollId } = request;

    // 1. Fetch the payroll
    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );

    if (!payroll) {
      throw new Error('Folha de pagamento não encontrada.');
    }

    if (!payroll.isApproved() && !payroll.isPaid()) {
      throw new Error('Folha de pagamento precisa estar aprovada ou paga para gerar lançamentos.');
    }

    // 2. Check for duplicate import via tags
    const { entries: existingEntries } = await this.financeEntriesRepository.findMany({
      tenantId,
      search: `FOLHA-${payrollId}`,
      limit: 1,
    });

    if (existingEntries.length > 0) {
      throw new Error('Lançamentos financeiros já foram gerados para esta folha.');
    }

    // 3. Fetch payroll items
    const items = await this.payrollItemsRepository.findManyByPayroll(
      new UniqueEntityID(payrollId),
    );

    if (items.length === 0) {
      throw new Error('Folha de pagamento não possui itens.');
    }

    // 4. Build category slug -> id map
    const categories = await this.financeCategoriesRepository.findMany(tenantId);
    const categoryMap = new Map(categories.map((c) => [c.slug, c.id.toString()]));

    // Use first available expense category as fallback
    const fallbackCategory = categories.find((c) => c.type === 'EXPENSE');
    const fallbackCategoryId = fallbackCategory?.id.toString();

    // 5. Group items by employee for net salary entries
    const employeeItemsMap = new Map<string, typeof items>();
    for (const item of items) {
      const empId = item.employeeId.toString();
      if (!employeeItemsMap.has(empId)) {
        employeeItemsMap.set(empId, []);
      }
      employeeItemsMap.get(empId)!.push(item);
    }

    // 6. Build dates from payroll reference
    const paymentDate = new Date(payroll.referenceYear, payroll.referenceMonth, 0); // last day of ref month
    const competenceDate = new Date(payroll.referenceYear, payroll.referenceMonth - 1, 1);
    const issueDate = new Date();
    const referencePeriod = payroll.referencePeriod;

    let entriesCreated = 0;
    let totalAmount = 0;

    // 7. Create one PAYABLE entry per employee (net salary)
    for (const [employeeId, empItems] of employeeItemsMap) {
      const employee = await this.employeesRepository.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );

      const employeeName = employee?.fullName ?? `Funcionário ${employeeId.slice(0, 8)}`;

      // Calculate net for this employee
      let gross = 0;
      let deductions = 0;
      for (const item of empItems) {
        if (item.isDeduction) {
          deductions += item.amount;
        } else {
          gross += item.amount;
        }
      }
      const netSalary = gross - deductions;

      if (netSalary <= 0) continue;

      const salaryCategory = categoryMap.get('salarios-e-ordenados') ?? fallbackCategoryId;
      if (!salaryCategory) continue;

      const code = await this.financeEntriesRepository.generateNextCode(tenantId, 'PAYABLE');

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description: `Salário líquido - ${employeeName} (${referencePeriod}) [FOLHA-${payrollId}]`,
        categoryId: salaryCategory,
        costCenterId: salaryCategory,
        supplierName: employeeName,
        expectedAmount: netSalary,
        issueDate,
        dueDate: paymentDate,
        competenceDate,
        tags: [`FOLHA-${payrollId}`, `EMP-${employeeId}`],
        metadata: { payrollId, employeeId, type: 'NET_SALARY' },
      });

      entriesCreated++;
      totalAmount += netSalary;
    }

    // 8. Create aggregate entries for taxes/charges (INSS, FGTS, IRRF)
    const taxTypes: PayrollItemTypeValue[] = ['INSS', 'FGTS', 'IRRF'];
    const taxLabels: Record<string, string> = {
      INSS: 'INSS Patronal',
      FGTS: 'FGTS',
      IRRF: 'IRRF Retido',
    };

    for (const taxType of taxTypes) {
      const taxItems = items.filter((i) => i.type.toString() === taxType);
      if (taxItems.length === 0) continue;

      const taxTotal = taxItems.reduce((sum, i) => sum + i.amount, 0);
      const slug = PAYROLL_TYPE_TO_CATEGORY[taxType];
      const catId = categoryMap.get(slug) ?? fallbackCategoryId;
      if (!catId) continue;

      const code = await this.financeEntriesRepository.generateNextCode(tenantId, 'PAYABLE');

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description: `${taxLabels[taxType]} - Folha ${referencePeriod} [FOLHA-${payrollId}]`,
        categoryId: catId,
        costCenterId: catId,
        supplierName: taxLabels[taxType],
        expectedAmount: taxTotal,
        issueDate,
        dueDate: paymentDate,
        competenceDate,
        tags: [`FOLHA-${payrollId}`],
        metadata: { payrollId, type: taxType },
      });

      entriesCreated++;
      totalAmount += taxTotal;
    }

    // 9. Create aggregate entries for benefits (VT, VR, Health)
    const benefitTypes: PayrollItemTypeValue[] = ['TRANSPORT_VOUCHER', 'MEAL_VOUCHER', 'HEALTH_PLAN', 'DENTAL_PLAN'];
    const benefitLabels: Record<string, string> = {
      TRANSPORT_VOUCHER: 'Vale Transporte',
      MEAL_VOUCHER: 'Vale Refeição',
      HEALTH_PLAN: 'Plano de Saúde',
      DENTAL_PLAN: 'Plano Odontológico',
    };

    for (const benefitType of benefitTypes) {
      const benefitItems = items.filter((i) => i.type.toString() === benefitType);
      if (benefitItems.length === 0) continue;

      const benefitTotal = benefitItems.reduce((sum, i) => sum + i.amount, 0);
      const slug = PAYROLL_TYPE_TO_CATEGORY[benefitType];
      const catId = categoryMap.get(slug) ?? fallbackCategoryId;
      if (!catId) continue;

      const code = await this.financeEntriesRepository.generateNextCode(tenantId, 'PAYABLE');

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description: `${benefitLabels[benefitType]} - Folha ${referencePeriod} [FOLHA-${payrollId}]`,
        categoryId: catId,
        costCenterId: catId,
        supplierName: benefitLabels[benefitType],
        expectedAmount: benefitTotal,
        issueDate,
        dueDate: paymentDate,
        competenceDate,
        tags: [`FOLHA-${payrollId}`],
        metadata: { payrollId, type: benefitType },
      });

      entriesCreated++;
      totalAmount += benefitTotal;
    }

    return { entriesCreated, totalAmount };
  }
}
