import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';
import type {
  CreateGeneratedEmploymentContractSchema,
  FindManyGeneratedContractsParams,
  FindManyGeneratedContractsResult,
  GeneratedEmploymentContractsRepository,
} from '../generated-employment-contracts-repository';

export class InMemoryGeneratedEmploymentContractsRepository
  implements GeneratedEmploymentContractsRepository
{
  public items: GeneratedEmploymentContract[] = [];

  async create(
    data: CreateGeneratedEmploymentContractSchema,
  ): Promise<GeneratedEmploymentContract> {
    const contract = GeneratedEmploymentContract.create({
      tenantId: new UniqueEntityID(data.tenantId),
      templateId: data.templateId,
      employeeId: data.employeeId,
      generatedBy: data.generatedBy,
      storageFileId: data.storageFileId,
      pdfUrl: data.pdfUrl,
      pdfKey: data.pdfKey,
      variables: data.variables,
    });

    this.items.push(contract);
    return contract;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null> {
    const contract = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return contract ?? null;
  }

  async findBySignatureEnvelopeId(
    envelopeId: string,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null> {
    const contract = this.items.find(
      (item) =>
        item.signatureEnvelopeId === envelopeId &&
        item.tenantId.toString() === tenantId,
    );
    return contract ?? null;
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findMany(
    params: FindManyGeneratedContractsParams,
  ): Promise<FindManyGeneratedContractsResult> {
    const { tenantId, employeeId, templateId, page = 1, perPage = 20 } = params;

    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (employeeId) {
      filtered = filtered.filter((item) => item.employeeId.equals(employeeId));
    }

    if (templateId) {
      filtered = filtered.filter((item) => item.templateId.equals(templateId));
    }

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const contracts = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);

    return { contracts, total };
  }

  async save(contract: GeneratedEmploymentContract): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(contract.id));
    if (index !== -1) {
      this.items[index] = contract;
    } else {
      this.items.push(contract);
    }
  }

  async updateSignatureEnvelopeId(
    id: UniqueEntityID,
    envelopeId: string | null,
    tenantId: string,
  ): Promise<void> {
    const contract = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    if (!contract) return;
    contract.signatureEnvelopeId = envelopeId;
  }

  clear(): void {
    this.items = [];
  }
}
