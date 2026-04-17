import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Candidate } from '@/entities/hr/candidate';
import type {
  AnonymizeCandidateSchema,
  CandidatesRepository,
  CreateCandidateSchema,
  FindCandidateFilters,
  UpdateCandidateSchema,
} from '../candidates-repository';

export class InMemoryCandidatesRepository implements CandidatesRepository {
  public items: Candidate[] = [];

  async create(data: CreateCandidateSchema): Promise<Candidate> {
    const candidate = Candidate.create({
      tenantId: new UniqueEntityID(data.tenantId),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      resumeUrl: data.resumeUrl,
      linkedinUrl: data.linkedinUrl,
      source: data.source ?? 'OTHER',
      notes: data.notes,
      tags: data.tags,
    });

    this.items.push(candidate);
    return candidate;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Candidate | null> {
    return (
      this.items.find(
        (candidate) =>
          candidate.id.equals(id) &&
          candidate.tenantId.toString() === tenantId &&
          !candidate.deletedAt,
      ) ?? null
    );
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<Candidate | null> {
    return (
      this.items.find(
        (candidate) =>
          candidate.email.toLowerCase() === email.toLowerCase() &&
          candidate.tenantId.toString() === tenantId &&
          !candidate.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindCandidateFilters,
  ): Promise<{ candidates: Candidate[]; total: number }> {
    let filtered = this.items.filter(
      (candidate) =>
        candidate.tenantId.toString() === tenantId && !candidate.deletedAt,
    );

    if (filters?.source) {
      filtered = filtered.filter(
        (candidate) => candidate.source === filters.source,
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.fullName.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower),
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter((candidate) =>
        filters.tags!.some((tag) => candidate.tags?.includes(tag)),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      candidates: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateCandidateSchema): Promise<Candidate | null> {
    const index = this.items.findIndex((candidate) =>
      candidate.id.equals(data.id),
    );
    if (index === -1) return null;

    const candidate = this.items[index];

    if (data.fullName !== undefined) candidate.updateName(data.fullName);
    if (data.email !== undefined) {
      candidate.props.email = data.email;
      candidate.props.updatedAt = new Date();
    }
    if (data.phone !== undefined) {
      candidate.props.phone = data.phone;
      candidate.props.updatedAt = new Date();
    }
    if (data.cpf !== undefined) {
      candidate.props.cpf = data.cpf;
      candidate.props.updatedAt = new Date();
    }
    if (data.resumeUrl !== undefined) {
      candidate.props.resumeUrl = data.resumeUrl;
      candidate.props.updatedAt = new Date();
    }
    if (data.linkedinUrl !== undefined) {
      candidate.props.linkedinUrl = data.linkedinUrl;
      candidate.props.updatedAt = new Date();
    }
    if (data.source !== undefined) {
      candidate.props.source = data.source;
      candidate.props.updatedAt = new Date();
    }
    if (data.notes !== undefined) {
      candidate.props.notes = data.notes;
      candidate.props.updatedAt = new Date();
    }
    if (data.tags !== undefined) {
      candidate.props.tags = data.tags;
      candidate.props.updatedAt = new Date();
    }

    return candidate;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((candidate) => candidate.id.equals(id));
    if (index >= 0) {
      this.items[index].softDelete();
    }
  }

  async anonymize(
    data: AnonymizeCandidateSchema,
  ): Promise<Candidate | null> {
    const candidate = this.items.find(
      (item) =>
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );

    if (!candidate) return null;

    // Idempotent: already anonymized records are returned unchanged.
    if (candidate.isAnonymized) return candidate;

    candidate.anonymize({
      anonymizedAt: data.anonymizedAt,
      anonymizedByUserId: data.anonymizedByUserId,
    });

    // The caller passes the expected placeholder fullName/email so the
    // in-memory repo mirrors exactly what the Prisma one would persist.
    candidate.props.fullName = data.fullName;
    candidate.props.email = data.email;

    return candidate;
  }
}
