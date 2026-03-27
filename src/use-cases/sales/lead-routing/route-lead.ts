import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Customer } from '@/entities/sales/customer';
import type {
  LeadRoutingRule,
  SegmentConfig,
  TerritoryConfig,
} from '@/entities/sales/lead-routing-rule';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface RouteLeadUseCaseRequest {
  tenantId: string;
  customerId: string;
}

interface RouteLeadUseCaseResponse {
  assignedToUserId: string;
  routingRuleName: string;
  strategy: string;
}

export class RouteLeadUseCase {
  constructor(
    private leadRoutingRulesRepository: LeadRoutingRulesRepository,
    private customersRepository: CustomersRepository,
    private dealsRepository: DealsRepository,
  ) {}

  async execute(
    request: RouteLeadUseCaseRequest,
  ): Promise<RouteLeadUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(request.customerId),
      request.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    const activeRules =
      await this.leadRoutingRulesRepository.findActiveByTenant(
        request.tenantId,
      );

    if (activeRules.length === 0) {
      throw new BadRequestError(
        'No active routing rules found for this tenant.',
      );
    }

    for (const rule of activeRules) {
      const assignedUserId = await this.tryAssignByStrategy(
        rule,
        customer,
        request.tenantId,
      );

      if (assignedUserId) {
        return {
          assignedToUserId: assignedUserId,
          routingRuleName: rule.name,
          strategy: rule.strategy,
        };
      }
    }

    throw new BadRequestError(
      'No matching routing rule could assign a user for this customer.',
    );
  }

  private async tryAssignByStrategy(
    rule: LeadRoutingRule,
    customer: Customer,
    tenantId: string,
  ): Promise<string | null> {
    switch (rule.strategy) {
      case 'ROUND_ROBIN':
        return this.assignRoundRobin(rule, tenantId);
      case 'TERRITORY':
        return this.assignByTerritory(rule, customer);
      case 'SEGMENT':
        return this.assignBySegment(rule, customer);
      case 'LOAD_BALANCE':
        return this.assignByLoadBalance(rule, tenantId);
      default:
        return null;
    }
  }

  private async assignRoundRobin(
    rule: LeadRoutingRule,
    tenantId: string,
  ): Promise<string | null> {
    if (rule.assignToUsers.length === 0) return null;

    const assignedUserId = rule.advanceRoundRobin();

    if (assignedUserId) {
      await this.leadRoutingRulesRepository.updateLastAssignedIndex(
        rule.id,
        tenantId,
        rule.lastAssignedIndex,
      );
    }

    return assignedUserId;
  }

  private assignByTerritory(
    rule: LeadRoutingRule,
    customer: Customer,
  ): string | null {
    const territoryConfig = rule.config as unknown as TerritoryConfig;

    if (!territoryConfig.territories) return null;

    const customerState = customer.props.state?.toUpperCase();
    const customerCity = customer.props.city?.toUpperCase();

    for (const territory of territoryConfig.territories) {
      const stateMatch =
        !territory.states ||
        territory.states.length === 0 ||
        (customerState &&
          territory.states.map((s) => s.toUpperCase()).includes(customerState));

      const cityMatch =
        !territory.cities ||
        territory.cities.length === 0 ||
        (customerCity &&
          territory.cities.map((c) => c.toUpperCase()).includes(customerCity));

      if (stateMatch && cityMatch) {
        return territory.userId;
      }
    }

    return null;
  }

  private assignBySegment(
    rule: LeadRoutingRule,
    customer: Customer,
  ): string | null {
    const segmentConfig = rule.config as unknown as SegmentConfig;

    if (!segmentConfig.segments) return null;

    const customerType = customer.type.value;

    for (const segment of segmentConfig.segments) {
      const typeMatch =
        !segment.customerTypes ||
        segment.customerTypes.length === 0 ||
        segment.customerTypes.includes(customerType);

      if (typeMatch) {
        return segment.userId;
      }
    }

    return null;
  }

  private async assignByLoadBalance(
    rule: LeadRoutingRule,
    tenantId: string,
  ): Promise<string | null> {
    if (rule.assignToUsers.length === 0) return null;

    const dealCountsByUser = await Promise.all(
      rule.assignToUsers.map(async (userId) => {
        const dealsForUser = await this.dealsRepository.findManyPaginated({
          tenantId,
          page: 1,
          limit: 1,
          assignedToUserId: userId,
          status: 'OPEN',
        });

        return { userId, activeDealCount: dealsForUser.total };
      }),
    );

    // Filter by maxLeadsPerUser if set
    const eligibleUsers = rule.maxLeadsPerUser
      ? dealCountsByUser.filter(
          (userDeals) => userDeals.activeDealCount < rule.maxLeadsPerUser!,
        )
      : dealCountsByUser;

    if (eligibleUsers.length === 0) return null;

    // Assign to user with fewest active deals
    eligibleUsers.sort((a, b) => a.activeDealCount - b.activeDealCount);

    return eligibleUsers[0].userId;
  }
}
