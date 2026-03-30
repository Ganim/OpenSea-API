import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import type { MedicalExamType } from '@/entities/hr/medical-exam';
import type {
  CreateOccupationalExamRequirementSchema,
  FindOccupationalExamRequirementFilters,
  OccupationalExamRequirementsRepository,
} from '../occupational-exam-requirements-repository';

export class InMemoryOccupationalExamRequirementsRepository
  implements OccupationalExamRequirementsRepository
{
  private items: OccupationalExamRequirement[] = [];

  async create(
    data: CreateOccupationalExamRequirementSchema,
  ): Promise<OccupationalExamRequirement> {
    const id = new UniqueEntityID();
    const requirement = OccupationalExamRequirement.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        positionId: data.positionId
          ? new UniqueEntityID(data.positionId)
          : undefined,
        examType: data.examType,
        examCategory: data.examCategory as MedicalExamType,
        frequencyMonths: data.frequencyMonths,
        isMandatory: data.isMandatory ?? true,
        description: data.description,
      },
      id,
    );

    this.items.push(requirement);
    return requirement;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement | null> {
    const requirement = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return requirement || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindOccupationalExamRequirementFilters,
  ): Promise<OccupationalExamRequirement[]> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.positionId) {
      filteredItems = filteredItems.filter(
        (item) => item.positionId?.toString() === filters.positionId,
      );
    }

    if (filters?.examCategory) {
      filteredItems = filteredItems.filter(
        (item) => item.examCategory === filters.examCategory,
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 50;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async findByPositionId(
    positionId: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement[]> {
    return this.items.filter(
      (item) =>
        item.positionId?.equals(positionId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
