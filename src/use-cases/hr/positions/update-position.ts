import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';
import { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface UpdatePositionRequest {
  tenantId: string;
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  departmentId?: string | null;
  level?: number;
  minSalary?: number | null;
  maxSalary?: number | null;
  isActive?: boolean;
}

export interface UpdatePositionResponse {
  position: Position;
}

export class UpdatePositionUseCase {
  constructor(
    private positionsRepository: PositionsRepository,
    private departmentsRepository?: DepartmentsRepository,
  ) {}

  async execute(
    request: UpdatePositionRequest,
  ): Promise<UpdatePositionResponse> {
    const {
      id,
      name,
      code,
      description,
      departmentId,
      level,
      minSalary,
      maxSalary,
      isActive,
    } = request;

    const positionId = new UniqueEntityID(id);

    // Find existing position
    const existingPosition = await this.positionsRepository.findById(
      positionId,
      request.tenantId,
    );
    if (!existingPosition) {
      throw new ResourceNotFoundError('Position not found');
    }

    // Validate code uniqueness if changing
    if (code && code !== existingPosition.code) {
      const positionWithCode = await this.positionsRepository.findByCode(
        code,
        request.tenantId,
      );
      if (positionWithCode) {
        throw new ConflictError('Position with this code already exists');
      }
    }

    // Validate salary range
    const finalMinSalary =
      minSalary === null
        ? undefined
        : minSalary !== undefined
          ? minSalary
          : existingPosition.minSalary;
    const finalMaxSalary =
      maxSalary === null
        ? undefined
        : maxSalary !== undefined
          ? maxSalary
          : existingPosition.maxSalary;

    if (finalMinSalary !== undefined && finalMaxSalary !== undefined) {
      if (finalMinSalary > finalMaxSalary) {
        throw new BadRequestError(
          'Minimum salary cannot be greater than maximum salary',
        );
      }
    }

    // Validate department if provided
    if (departmentId !== undefined && departmentId !== null) {
      if (this.departmentsRepository) {
        const department = await this.departmentsRepository.findById(
          new UniqueEntityID(departmentId),
          request.tenantId,
        );
        if (!department) {
          throw new ResourceNotFoundError('Department not found');
        }
      }
    }

    // Validate level
    if (level !== undefined && level < 1) {
      throw new BadRequestError('Position level must be at least 1');
    }

    // Update position
    const position = await this.positionsRepository.update({
      id: positionId,
      name,
      code,
      description,
      departmentId:
        departmentId === null
          ? null
          : departmentId
            ? new UniqueEntityID(departmentId)
            : undefined,
      level,
      minSalary,
      maxSalary,
      isActive,
    });

    if (!position) {
      throw new BadRequestError('Failed to update position');
    }

    return { position };
  }
}
