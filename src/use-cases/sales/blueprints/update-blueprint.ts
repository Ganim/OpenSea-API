import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BlueprintStageRule } from '@/entities/sales/blueprint-stage-rule';
import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface StageRuleInput {
  stageId: string;
  requiredFields?: string[];
  validations?: Array<{ field: string; condition: string; value: string }>;
  blocksAdvance?: boolean;
}

interface UpdateBlueprintUseCaseRequest {
  tenantId: string;
  blueprintId: string;
  name?: string;
  isActive?: boolean;
  stageRules?: StageRuleInput[];
}

interface UpdateBlueprintUseCaseResponse {
  blueprint: ProcessBlueprint;
}

export class UpdateBlueprintUseCase {
  constructor(private blueprintsRepository: ProcessBlueprintsRepository) {}

  async execute(
    request: UpdateBlueprintUseCaseRequest,
  ): Promise<UpdateBlueprintUseCaseResponse> {
    const { tenantId, blueprintId, name, isActive, stageRules } = request;

    const blueprint = await this.blueprintsRepository.findById(
      new UniqueEntityID(blueprintId),
      tenantId,
    );

    if (!blueprint) {
      throw new ResourceNotFoundError('Blueprint not found');
    }

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Blueprint name cannot be empty');
      }

      const existingBlueprint = await this.blueprintsRepository.findByName(
        name,
        tenantId,
      );

      if (
        existingBlueprint &&
        existingBlueprint.id.toString() !== blueprintId
      ) {
        throw new BadRequestError(
          'A blueprint with this name already exists for this tenant',
        );
      }

      blueprint.name = name.trim();
    }

    if (isActive !== undefined) {
      blueprint.isActive = isActive;
    }

    if (stageRules !== undefined) {
      const mappedStageRules = stageRules.map((ruleInput) =>
        BlueprintStageRule.create({
          blueprintId: blueprint.id,
          stageId: new UniqueEntityID(ruleInput.stageId),
          requiredFields: ruleInput.requiredFields ?? [],
          validations: ruleInput.validations ?? [],
          blocksAdvance: ruleInput.blocksAdvance ?? true,
        }),
      );

      blueprint.stageRules = mappedStageRules;
    }

    await this.blueprintsRepository.save(blueprint);

    return { blueprint };
  }
}
