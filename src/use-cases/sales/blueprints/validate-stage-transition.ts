import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { StageValidation } from '@/entities/sales/blueprint-stage-rule';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface ValidateStageTransitionUseCaseRequest {
  tenantId: string;
  dealId: string;
  targetStageId: string;
}

interface ValidateStageTransitionUseCaseResponse {
  valid: boolean;
  errors: string[];
}

function getDealFieldValue(deal: Deal, fieldName: string): unknown {
  const fieldMap: Record<string, () => unknown> = {
    title: () => deal.title,
    customerId: () => deal.customerId?.toString(),
    contactId: () => deal.contactId?.toString(),
    pipelineId: () => deal.pipelineId?.toString(),
    stageId: () => deal.stageId?.toString(),
    status: () => deal.status,
    priority: () => deal.priority,
    value: () => deal.value,
    currency: () => deal.currency,
    probability: () => deal.probability,
    expectedCloseDate: () => deal.expectedCloseDate,
    source: () => deal.source,
    tags: () => deal.tags,
    assignedToUserId: () => deal.assignedToUserId?.toString(),
    lostReason: () => deal.lostReason,
  };

  // Also check customFields
  const getter = fieldMap[fieldName];
  if (getter) return getter();

  // Try customFields
  if (deal.customFields && fieldName in deal.customFields) {
    return deal.customFields[fieldName];
  }

  return undefined;
}

function checkValidation(
  deal: Deal,
  validation: StageValidation,
): string | null {
  const fieldValue = getDealFieldValue(deal, validation.field);
  const expectedValue = validation.value;

  switch (validation.condition) {
    case 'greater_than': {
      const numValue = Number(fieldValue);
      const numExpected = Number(expectedValue);
      if (isNaN(numValue) || numValue <= numExpected) {
        return `Field "${validation.field}" must be greater than ${expectedValue}`;
      }
      return null;
    }
    case 'less_than': {
      const numValue = Number(fieldValue);
      const numExpected = Number(expectedValue);
      if (isNaN(numValue) || numValue >= numExpected) {
        return `Field "${validation.field}" must be less than ${expectedValue}`;
      }
      return null;
    }
    case 'equals': {
      if (String(fieldValue) !== String(expectedValue)) {
        return `Field "${validation.field}" must equal "${expectedValue}"`;
      }
      return null;
    }
    case 'not_equals': {
      if (String(fieldValue) === String(expectedValue)) {
        return `Field "${validation.field}" must not equal "${expectedValue}"`;
      }
      return null;
    }
    case 'not_empty': {
      if (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === ''
      ) {
        return `Field "${validation.field}" must not be empty`;
      }
      return null;
    }
    case 'min_length': {
      const strValue = String(fieldValue ?? '');
      const minLen = Number(expectedValue);
      if (strValue.length < minLen) {
        return `Field "${validation.field}" must have at least ${expectedValue} characters`;
      }
      return null;
    }
    default:
      return `Unknown validation condition: ${validation.condition}`;
  }
}

export class ValidateStageTransitionUseCase {
  constructor(
    private blueprintsRepository: ProcessBlueprintsRepository,
    private dealsRepository: DealsRepository,
  ) {}

  async execute(
    request: ValidateStageTransitionUseCaseRequest,
  ): Promise<ValidateStageTransitionUseCaseResponse> {
    const { tenantId, dealId, targetStageId } = request;

    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(dealId),
      tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    const activeBlueprint =
      await this.blueprintsRepository.findActiveByPipelineId(
        deal.pipelineId.toString(),
        tenantId,
      );

    // If no active blueprint exists for this pipeline, transition is always valid
    if (!activeBlueprint) {
      return { valid: true, errors: [] };
    }

    const targetStageRule = activeBlueprint.stageRules.find(
      (rule) => rule.stageId.toString() === targetStageId,
    );

    // If no rule exists for the target stage, transition is valid
    if (!targetStageRule) {
      return { valid: true, errors: [] };
    }

    const validationErrors: string[] = [];

    // Check required fields
    for (const requiredField of targetStageRule.requiredFields) {
      const fieldValue = getDealFieldValue(deal, requiredField);
      if (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === ''
      ) {
        validationErrors.push(
          `Required field "${requiredField}" is missing or empty`,
        );
      }
    }

    // Check custom validations
    for (const validation of targetStageRule.validations) {
      const errorMessage = checkValidation(deal, validation);
      if (errorMessage) {
        validationErrors.push(errorMessage);
      }
    }

    const isValid = validationErrors.length === 0;

    return {
      valid: isValid,
      errors: validationErrors,
    };
  }
}
