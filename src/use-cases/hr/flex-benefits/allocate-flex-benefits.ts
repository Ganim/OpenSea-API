import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FlexBenefitAllocation } from '@/entities/hr/flex-benefit-allocation';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { FlexBenefitAllocationsRepository } from '@/repositories/hr/flex-benefit-allocations-repository';

export interface AllocateFlexBenefitsRequest {
  tenantId: string;
  employeeId: string;
  month: number;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
  confirm?: boolean;
}

export interface AllocateFlexBenefitsResponse {
  allocation: FlexBenefitAllocation;
}

export class AllocateFlexBenefitsUseCase {
  constructor(
    private flexBenefitAllocationsRepository: FlexBenefitAllocationsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AllocateFlexBenefitsRequest,
  ): Promise<AllocateFlexBenefitsResponse> {
    const {
      tenantId,
      employeeId,
      month,
      year,
      totalBudget,
      allocations,
      confirm,
    } = request;

    // Validate month/year
    if (month < 1 || month > 12) {
      throw new BadRequestError('Mês inválido (1-12)');
    }
    if (year < 2020 || year > 2100) {
      throw new BadRequestError('Ano inválido');
    }

    // Validate budget
    if (totalBudget <= 0) {
      throw new BadRequestError('O orçamento total deve ser maior que zero');
    }

    // Validate allocations sum does not exceed budget
    const allocatedTotal = Object.values(allocations).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    if (allocatedTotal > totalBudget) {
      throw new BadRequestError(
        `O total alocado (R$ ${allocatedTotal.toFixed(2)}) excede o orçamento disponível (R$ ${totalBudget.toFixed(2)})`,
      );
    }

    // Validate no negative allocations
    for (const [category, amount] of Object.entries(allocations)) {
      if (amount < 0) {
        throw new BadRequestError(
          `A alocação para ${category} não pode ser negativa`,
        );
      }
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Check for existing allocation
    const existingAllocation =
      await this.flexBenefitAllocationsRepository.findByEmployeeAndMonth(
        new UniqueEntityID(employeeId),
        month,
        year,
        tenantId,
      );

    if (existingAllocation) {
      if (existingAllocation.isLocked()) {
        throw new BadRequestError(
          'A alocação deste mês já está bloqueada e não pode ser alterada',
        );
      }

      // Update existing allocation
      const updatedAllocation =
        await this.flexBenefitAllocationsRepository.update({
          id: existingAllocation.id,
          allocations,
          status: confirm ? 'CONFIRMED' : undefined,
          confirmedAt: confirm ? new Date() : undefined,
        });

      if (!updatedAllocation) {
        throw new ResourceNotFoundError('Alocação não encontrada');
      }

      return { allocation: updatedAllocation };
    }

    // Create new allocation
    const allocation = await this.flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      month,
      year,
      totalBudget,
      allocations,
      status: confirm ? 'CONFIRMED' : 'DRAFT',
    });

    return { allocation };
  }
}
