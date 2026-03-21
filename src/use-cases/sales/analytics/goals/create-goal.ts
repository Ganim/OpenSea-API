import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { AnalyticsGoalDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { goalToDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { AnalyticsGoalsRepository } from '@/repositories/sales/analytics-goals-repository';

interface CreateGoalUseCaseRequest {
  tenantId: string;
  name: string;
  type: string;
  targetValue: number;
  unit?: string;
  period: string;
  startDate: string;
  endDate: string;
  scope: string;
  userId?: string;
  teamId?: string;
  createdByUserId: string;
}

interface CreateGoalUseCaseResponse {
  goal: AnalyticsGoalDTO;
}

const VALID_TYPES = [
  'REVENUE', 'QUANTITY', 'DEALS_WON', 'NEW_CUSTOMERS',
  'TICKET_AVERAGE', 'CONVERSION_RATE', 'COMMISSION', 'BID_WIN_RATE', 'CUSTOM',
];

const VALID_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'];
const VALID_SCOPES = ['INDIVIDUAL', 'TEAM', 'TENANT'];

export class CreateGoalUseCase {
  constructor(private goalsRepository: AnalyticsGoalsRepository) {}

  async execute(input: CreateGoalUseCaseRequest): Promise<CreateGoalUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Goal name is required.');
    }

    if (input.name.length > 128) {
      throw new BadRequestError('Goal name cannot exceed 128 characters.');
    }

    if (!VALID_TYPES.includes(input.type)) {
      throw new BadRequestError(`Invalid goal type: ${input.type}`);
    }

    if (!VALID_PERIODS.includes(input.period)) {
      throw new BadRequestError(`Invalid goal period: ${input.period}`);
    }

    if (!VALID_SCOPES.includes(input.scope)) {
      throw new BadRequestError(`Invalid goal scope: ${input.scope}`);
    }

    if (input.targetValue <= 0) {
      throw new BadRequestError('Target value must be greater than zero.');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestError('Invalid date format.');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date.');
    }

    if (input.scope === 'INDIVIDUAL' && !input.userId) {
      throw new BadRequestError('User ID is required for individual goals.');
    }

    if (input.scope === 'TEAM' && !input.teamId) {
      throw new BadRequestError('Team ID is required for team goals.');
    }

    const goal = await this.goalsRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      type: input.type,
      targetValue: input.targetValue,
      unit: input.unit ?? 'BRL',
      period: input.period,
      startDate,
      endDate,
      scope: input.scope,
      userId: input.userId,
      teamId: input.teamId,
      createdByUserId: input.createdByUserId,
    });

    return { goal: goalToDTO(goal) };
  }
}
