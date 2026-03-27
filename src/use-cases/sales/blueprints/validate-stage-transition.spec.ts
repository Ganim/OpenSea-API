import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BlueprintStageRule } from '@/entities/sales/blueprint-stage-rule';
import { Deal } from '@/entities/sales/deal';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateStageTransitionUseCase } from './validate-stage-transition';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let dealsRepository: InMemoryDealsRepository;
let sut: ValidateStageTransitionUseCase;

const TENANT_ID = 'tenant-1';
const PIPELINE_ID = new UniqueEntityID();
const STAGE_A_ID = new UniqueEntityID();
const STAGE_B_ID = new UniqueEntityID();
const CUSTOMER_ID = new UniqueEntityID();

describe('Validate Stage Transition Use Case', () => {
  beforeEach(() => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    dealsRepository = new InMemoryDealsRepository();
    sut = new ValidateStageTransitionUseCase(
      blueprintsRepository,
      dealsRepository,
    );
  });

  it('should return valid when no blueprint exists for the pipeline', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: CUSTOMER_ID,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_A_ID,
    });
    await dealsRepository.create(deal);

    const { valid, errors } = await sut.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
      targetStageId: STAGE_B_ID.toString(),
    });

    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should return valid when no rule exists for the target stage', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: CUSTOMER_ID,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_A_ID,
    });
    await dealsRepository.create(deal);

    const blueprintId = new UniqueEntityID();
    const blueprint = ProcessBlueprint.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Test Blueprint',
        pipelineId: PIPELINE_ID,
        isActive: true,
        stageRules: [
          BlueprintStageRule.create({
            blueprintId,
            stageId: STAGE_A_ID,
            requiredFields: ['contactId'],
            blocksAdvance: true,
          }),
        ],
      },
      blueprintId,
    );
    await blueprintsRepository.create(blueprint);

    // Target stage B has no rules
    const { valid, errors } = await sut.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
      targetStageId: STAGE_B_ID.toString(),
    });

    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should return invalid when required fields are missing', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: CUSTOMER_ID,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_A_ID,
      // contactId is missing
    });
    await dealsRepository.create(deal);

    const blueprintId = new UniqueEntityID();
    const blueprint = ProcessBlueprint.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Validation Blueprint',
        pipelineId: PIPELINE_ID,
        isActive: true,
        stageRules: [
          BlueprintStageRule.create({
            blueprintId,
            stageId: STAGE_B_ID,
            requiredFields: ['contactId'],
            blocksAdvance: true,
          }),
        ],
      },
      blueprintId,
    );
    await blueprintsRepository.create(blueprint);

    const { valid, errors } = await sut.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
      targetStageId: STAGE_B_ID.toString(),
    });

    expect(valid).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('contactId');
  });

  it('should return invalid when value validation fails', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: CUSTOMER_ID,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_A_ID,
      value: 0,
    });
    await dealsRepository.create(deal);

    const blueprintId = new UniqueEntityID();
    const blueprint = ProcessBlueprint.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Value Check Blueprint',
        pipelineId: PIPELINE_ID,
        isActive: true,
        stageRules: [
          BlueprintStageRule.create({
            blueprintId,
            stageId: STAGE_B_ID,
            validations: [
              { field: 'value', condition: 'greater_than', value: '0' },
            ],
            blocksAdvance: true,
          }),
        ],
      },
      blueprintId,
    );
    await blueprintsRepository.create(blueprint);

    const { valid, errors } = await sut.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
      targetStageId: STAGE_B_ID.toString(),
    });

    expect(valid).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('greater than');
  });

  it('should return valid when all validations pass', async () => {
    const contactId = new UniqueEntityID();
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Good Deal',
      customerId: CUSTOMER_ID,
      pipelineId: PIPELINE_ID,
      stageId: STAGE_A_ID,
      contactId,
      value: 5000,
    });
    await dealsRepository.create(deal);

    const blueprintId = new UniqueEntityID();
    const blueprint = ProcessBlueprint.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'Full Validation Blueprint',
        pipelineId: PIPELINE_ID,
        isActive: true,
        stageRules: [
          BlueprintStageRule.create({
            blueprintId,
            stageId: STAGE_B_ID,
            requiredFields: ['contactId', 'value'],
            validations: [
              { field: 'value', condition: 'greater_than', value: '0' },
            ],
            blocksAdvance: true,
          }),
        ],
      },
      blueprintId,
    );
    await blueprintsRepository.create(blueprint);

    const { valid, errors } = await sut.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
      targetStageId: STAGE_B_ID.toString(),
    });

    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should throw if deal not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        dealId: new UniqueEntityID().toString(),
        targetStageId: STAGE_B_ID.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
