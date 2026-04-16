import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ContractTemplate,
  ContractTemplateTypeValue,
} from '@/entities/hr/contract-template';

export interface CreateContractTemplateSchema {
  tenantId: string;
  name: string;
  type: ContractTemplateTypeValue;
  content: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateContractTemplateSchema {
  id: UniqueEntityID;
  name?: string;
  type?: ContractTemplateTypeValue;
  content?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface FindManyContractTemplatesParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  type?: ContractTemplateTypeValue;
  isActive?: boolean;
}

export interface FindManyContractTemplatesResult {
  templates: ContractTemplate[];
  total: number;
}

export interface ContractTemplatesRepository {
  create(data: CreateContractTemplateSchema): Promise<ContractTemplate>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ContractTemplate | null>;
  findDefaultByType(
    type: ContractTemplateTypeValue,
    tenantId: string,
  ): Promise<ContractTemplate | null>;
  findMany(
    params: FindManyContractTemplatesParams,
  ): Promise<FindManyContractTemplatesResult>;
  update(
    data: UpdateContractTemplateSchema,
  ): Promise<ContractTemplate | null>;
  save(template: ContractTemplate): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
