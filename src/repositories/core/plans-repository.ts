import type { Plan } from '@/entities/core/plan';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreatePlanSchema {
  name: string;
  tier?: string;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  maxUsers?: number;
  maxWarehouses?: number;
  maxProducts?: number;
}

export interface UpdatePlanSchema {
  id: UniqueEntityID;
  name?: string;
  tier?: string;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  maxUsers?: number;
  maxWarehouses?: number;
  maxProducts?: number;
}

export interface PlansRepository {
  create(data: CreatePlanSchema): Promise<Plan>;
  update(data: UpdatePlanSchema): Promise<Plan | null>;
  findById(id: UniqueEntityID): Promise<Plan | null>;
  findByName(name: string): Promise<Plan | null>;
  findMany(): Promise<Plan[]>;
}
