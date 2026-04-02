import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ApprovalDelegation,
  type DelegationScope,
} from '@/entities/hr/approval-delegation';
import type { ApprovalDelegationsRepository } from '@/repositories/hr/approval-delegations-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

const VALID_SCOPES: DelegationScope[] = [
  'ALL',
  'ABSENCES',
  'VACATIONS',
  'OVERTIME',
  'REQUESTS',
];

export interface CreateDelegationInput {
  tenantId: string;
  delegatorId: string;
  delegateId: string;
  scope: string;
  startDate: Date;
  endDate?: Date;
  reason?: string;
}

export interface CreateDelegationOutput {
  delegation: ApprovalDelegation;
}

export class CreateDelegationUseCase {
  constructor(
    private approvalDelegationsRepository: ApprovalDelegationsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(input: CreateDelegationInput): Promise<CreateDelegationOutput> {
    const {
      tenantId,
      delegatorId,
      delegateId,
      scope,
      startDate,
      endDate,
      reason,
    } = input;

    if (delegatorId === delegateId) {
      throw new BadRequestError(
        'Cannot delegate approval authority to yourself',
      );
    }

    if (!VALID_SCOPES.includes(scope as DelegationScope)) {
      throw new BadRequestError(
        `Invalid scope: ${scope}. Valid scopes: ${VALID_SCOPES.join(', ')}`,
      );
    }

    if (endDate && endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    // Verify delegator exists
    const delegator = await this.employeesRepository.findById(
      new UniqueEntityID(delegatorId),
      tenantId,
    );
    if (!delegator) {
      throw new BadRequestError('Delegator employee not found');
    }

    // Verify delegate exists
    const delegate = await this.employeesRepository.findById(
      new UniqueEntityID(delegateId),
      tenantId,
    );
    if (!delegate) {
      throw new BadRequestError('Delegate employee not found');
    }

    // Check for existing active delegation between same pair
    const existingDelegation =
      await this.approvalDelegationsRepository.findActiveDelegation(
        new UniqueEntityID(delegatorId),
        new UniqueEntityID(delegateId),
        tenantId,
      );

    if (existingDelegation) {
      throw new BadRequestError(
        'An active delegation already exists between these employees',
      );
    }

    const delegation = ApprovalDelegation.create({
      tenantId: new UniqueEntityID(tenantId),
      delegatorId: new UniqueEntityID(delegatorId),
      delegateId: new UniqueEntityID(delegateId),
      scope: scope as DelegationScope,
      startDate,
      endDate,
      reason,
    });

    await this.approvalDelegationsRepository.create(delegation);

    return { delegation };
  }
}
