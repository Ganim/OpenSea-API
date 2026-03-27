import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollmentsRepository } from '@/repositories/hr/benefit-enrollments-repository';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface BenefitDeductionItem {
  benefitPlanId: string;
  benefitPlanName: string;
  benefitType: string;
  employeeContribution: number;
  employerContribution: number;
  deductionAmount: number;
  description: string;
}

export interface CalculateBenefitDeductionsRequest {
  tenantId: string;
  employeeId: string;
}

export interface CalculateBenefitDeductionsResponse {
  employeeId: string;
  baseSalary: number;
  deductions: BenefitDeductionItem[];
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
}

export class CalculateBenefitDeductionsUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
    private benefitPlansRepository: BenefitPlansRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CalculateBenefitDeductionsRequest,
  ): Promise<CalculateBenefitDeductionsResponse> {
    const { tenantId, employeeId } = request;

    // Verify employee exists and get salary
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const baseSalary = employee.baseSalary ?? 0;

    // Get active enrollments
    const activeEnrollments =
      await this.benefitEnrollmentsRepository.findActiveByEmployee(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    const deductions: BenefitDeductionItem[] = [];

    for (const enrollment of activeEnrollments) {
      const benefitPlan = await this.benefitPlansRepository.findById(
        enrollment.benefitPlanId,
        tenantId,
      );

      if (!benefitPlan || !benefitPlan.isActive) continue;

      let deductionAmount = enrollment.employeeContribution;
      let description = '';

      // VT: deduction = min(6% * baseSalary, benefitValue)
      if (benefitPlan.type === 'VT') {
        const vtDeductionRate = 0.06;
        const maxDeduction = baseSalary * vtDeductionRate;
        deductionAmount = Math.min(
          maxDeduction,
          enrollment.employeeContribution,
        );
        description = `VT — 6% do salário base (R$ ${maxDeduction.toFixed(2)}), limitado ao valor do benefício`;
      }
      // HEALTH: copay from employee contribution
      else if (benefitPlan.type === 'HEALTH') {
        deductionAmount = enrollment.employeeContribution;
        description = `Plano de Saúde — coparticipação do funcionário`;
      }
      // DENTAL: copay from employee contribution
      else if (benefitPlan.type === 'DENTAL') {
        deductionAmount = enrollment.employeeContribution;
        description = `Plano Odontológico — coparticipação do funcionário`;
      }
      // LIFE_INSURANCE: employee contribution
      else if (benefitPlan.type === 'LIFE_INSURANCE') {
        deductionAmount = enrollment.employeeContribution;
        description = `Seguro de Vida — contribuição do funcionário`;
      }
      // Default: use employee contribution as deduction
      else {
        deductionAmount = enrollment.employeeContribution;
        description = `${benefitPlan.name} — contribuição do funcionário`;
      }

      deductions.push({
        benefitPlanId: benefitPlan.id.toString(),
        benefitPlanName: benefitPlan.name,
        benefitType: benefitPlan.type,
        employeeContribution: enrollment.employeeContribution,
        employerContribution: enrollment.employerContribution,
        deductionAmount,
        description,
      });
    }

    const totalEmployeeDeductions = deductions.reduce(
      (sum, deduction) => sum + deduction.deductionAmount,
      0,
    );

    const totalEmployerContributions = deductions.reduce(
      (sum, deduction) => sum + deduction.employerContribution,
      0,
    );

    return {
      employeeId,
      baseSalary,
      deductions,
      totalEmployeeDeductions,
      totalEmployerContributions,
    };
  }
}
