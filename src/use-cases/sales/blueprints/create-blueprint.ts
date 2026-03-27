import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BlueprintStageRule } from '@/entities/sales/blueprint-stage-rule';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface StageRuleInput {
  stageId: string;
  requiredFields?: string[];
  validations?: Array<{ field: string; condition: string; value: string }>;
  blocksAdvance?: boolean;
}

interface CreateBlueprintUseCaseRequest {
  tenantId: string;
  name: string;
  pipelineId: string;
  isActive?: boolean;
  stageRules?: StageRuleInput[];
}

interface CreateBlueprintUseCaseResponse {
  blueprint: ProcessBlueprint;
}

export class CreateBlueprintUseCase {
  constructor(
    private blueprintsRepository: ProcessBlueprintsRepository,
    private pipelinesRepository: PipelinesRepository,
  ) {}

  async execute(
    request: CreateBlueprintUseCaseRequest,
  ): Promise<CreateBlueprintUseCaseResponse> {
    const { tenantId, name, pipelineId, isActive, stageRules } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Blueprint name is required');
    }

    const pipeline = await this.pipelinesRepository.findById(
      new UniqueEntityID(pipelineId),
      tenantId,
    );

    if (!pipeline) {
      throw new ResourceNotFoundError('Pipeline not found');
    }

    const existingBlueprint = await this.blueprintsRepository.findByName(
      name,
      tenantId,
    );

    if (existingBlueprint) {
      throw new BadRequestError(
        'A blueprint with this name already exists for this tenant',
      );
    }

    const blueprintId = new UniqueEntityID();

    const mappedStageRules = (stageRules ?? []).map((ruleInput) =>
      BlueprintStageRule.create({
        blueprintId,
        stageId: new UniqueEntityID(ruleInput.stageId),
        requiredFields: ruleInput.requiredFields ?? [],
        validations: ruleInput.validations ?? [],
        blocksAdvance: ruleInput.blocksAdvance ?? true,
      }),
    );

    const blueprint = ProcessBlueprint.create(
      {
        tenantId: new UniqueEntityID(tenantId),
        name: name.trim(),
        pipelineId: new UniqueEntityID(pipelineId),
        isActive,
        stageRules: mappedStageRules,
      },
      blueprintId,
    );

    await this.blueprintsRepository.create(blueprint);

    return { blueprint };
  }
}
