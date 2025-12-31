import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyStakeholder,
  type CompanyStakeholderRole,
  type CompanyStakeholderStatus,
  type CompanyStakeholderSource,
} from '@/entities/hr';
import {
  CompanyStakeholderRepository,
  CreateCompanyStakeholderSchema,
} from '../company-stakeholder-repository';

export class InMemoryCompanyStakeholderRepository
  implements CompanyStakeholderRepository
{
  private items: CompanyStakeholder[] = [];

  async create(
    data: CreateCompanyStakeholderSchema,
  ): Promise<CompanyStakeholder> {
    const stakeholder = CompanyStakeholder.create({
      companyId: data.companyId,
      name: data.name,
      role: data.role as CompanyStakeholderRole | undefined,
      entryDate: data.entryDate,
      exitDate: data.exitDate,
      personDocumentMasked: data.personDocumentMasked,
      isLegalRepresentative: data.isLegalRepresentative ?? false,
      status: (data.status ?? 'ACTIVE') as CompanyStakeholderStatus,
      source: (data.source ?? 'MANUAL') as CompanyStakeholderSource,
      rawPayloadRef: data.rawPayloadRef,
      metadata: data.metadata ?? {},
      pendingIssues: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.items.push(stakeholder);
    return stakeholder;
  }

  async findById(id: UniqueEntityID): Promise<CompanyStakeholder | null> {
    const stakeholder = this.items.find(
      (item) => item.id.toString() === id.toString() && !item.deletedAt,
    );
    return stakeholder ?? null;
  }

  async findByCompanyId(
    companyId: UniqueEntityID,
  ): Promise<CompanyStakeholder[]> {
    return this.items.filter(
      (item) =>
        item.companyId.toString() === companyId.toString() && !item.deletedAt,
    );
  }

  async findByCompanyIdAndName(
    companyId: UniqueEntityID,
    name: string,
  ): Promise<CompanyStakeholder | null> {
    const stakeholder = this.items.find(
      (item) =>
        item.companyId.toString() === companyId.toString() &&
        item.name === name &&
        !item.deletedAt,
    );
    return stakeholder ?? null;
  }

  async findLegalRepresentativeByCompanyId(
    companyId: UniqueEntityID,
  ): Promise<CompanyStakeholder | null> {
    const stakeholder = this.items.find(
      (item) =>
        item.companyId.toString() === companyId.toString() &&
        item.isLegalRepresentative &&
        item.status === 'ACTIVE' &&
        !item.deletedAt,
    );
    return stakeholder ?? null;
  }

  async countActiveLegalRepresentatives(
    companyId: UniqueEntityID,
  ): Promise<number> {
    return this.items.filter(
      (item) =>
        item.companyId.toString() === companyId.toString() &&
        item.isLegalRepresentative &&
        item.status === 'ACTIVE' &&
        !item.deletedAt,
    ).length;
  }

  async save(stakeholder: CompanyStakeholder): Promise<CompanyStakeholder> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === stakeholder.id.toString(),
    );

    if (index > -1) {
      this.items[index] = stakeholder;
    } else {
      this.items.push(stakeholder);
    }

    return stakeholder;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => item.id.toString() !== id.toString(),
    );
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const stakeholder = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    if (stakeholder) {
      const updated = CompanyStakeholder.create(
        {
          ...stakeholder.props,
          deletedAt: new Date(),
        },
        stakeholder.id,
      );
      await this.save(updated);
    }
  }

  async anonimize(id: UniqueEntityID): Promise<void> {
    const stakeholder = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    if (stakeholder) {
      const updated = CompanyStakeholder.create(
        {
          ...stakeholder.props,
          personDocumentMasked: undefined,
          rawPayloadRef: undefined,
          anonimizedAt: new Date(),
        },
        stakeholder.id,
      );
      await this.save(updated);
    }
  }
}
