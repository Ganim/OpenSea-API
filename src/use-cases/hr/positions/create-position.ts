import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';
import { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface CreatePositionRequest {
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
}

export interface CreatePositionResponse {
  position: Position;
}

export class CreatePositionUseCase {
  constructor(
    private positionsRepository: PositionsRepository,
    private departmentsRepository?: DepartmentsRepository,
  ) {}

  async execute(
    request: CreatePositionRequest,
  ): Promise<CreatePositionResponse> {
    const {
      name,
      code,
      description,
      departmentId,
      level = 1,
      minSalary,
      maxSalary,
      isActive = true,
    } = request;

    // Validate if code already exists
    const existingPosition = await this.positionsRepository.findByCode(code);
    if (existingPosition) {
      throw new Error('Position with this code already exists');
    }

    // Validate salary range
    if (minSalary !== undefined && maxSalary !== undefined) {
      if (minSalary > maxSalary) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
    }

    // Validate department if provided
    if (departmentId && this.departmentsRepository) {
      const department = await this.departmentsRepository.findById(
        new UniqueEntityID(departmentId),
      );
      if (!department) {
        throw new Error('Department not found');
      }
      if (!department.isActive) {
        throw new Error('Cannot create position in an inactive department');
      }
    }

    // Create position
    const position = await this.positionsRepository.create({
      name,
      code,
      description,
      departmentId: departmentId ? new UniqueEntityID(departmentId) : undefined,
      level,
      minSalary,
      maxSalary,
      isActive,
    });

    return { position };
  }
}
