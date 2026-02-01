import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type SystemModule =
  | 'CORE'
  | 'STOCK'
  | 'SALES'
  | 'HR'
  | 'PAYROLL'
  | 'REPORTS'
  | 'AUDIT'
  | 'REQUESTS'
  | 'NOTIFICATIONS';

export interface PlanModuleProps {
  id: UniqueEntityID;
  planId: UniqueEntityID;
  module: SystemModule;
}

export class PlanModule extends Entity<PlanModuleProps> {
  get planModuleId(): UniqueEntityID {
    return this.props.id;
  }
  get planId(): UniqueEntityID {
    return this.props.planId;
  }
  get module(): SystemModule {
    return this.props.module;
  }

  static create(
    props: Optional<PlanModuleProps, 'id'>,
    id?: UniqueEntityID,
  ): PlanModule {
    const pmId = id ?? props.id ?? new UniqueEntityID();
    return new PlanModule(
      {
        ...props,
        id: pmId,
      },
      pmId,
    );
  }
}
