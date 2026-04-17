import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Candidate } from '@/entities/hr/candidate';
import { prisma } from '@/lib/prisma';
import { mapCandidatePrismaToDomain } from '@/mappers/hr/candidate';
import type {
  CandidatesRepository,
  CreateCandidateSchema,
  FindCandidateFilters,
  UpdateCandidateSchema,
} from '../candidates-repository';

export class PrismaCandidatesRepository implements CandidatesRepository {
  async create(data: CreateCandidateSchema): Promise<Candidate> {
    const candidateData = await prisma.candidate.create({
      data: {
        tenantId: data.tenantId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        resumeUrl: data.resumeUrl,
        linkedinUrl: data.linkedinUrl,
        source: (data.source as 'OTHER') ?? 'OTHER',
        notes: data.notes,
        tags: data.tags,
      },
    });

    return Candidate.create(
      mapCandidatePrismaToDomain(candidateData),
      new UniqueEntityID(candidateData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Candidate | null> {
    const candidateData = await prisma.candidate.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!candidateData) return null;

    return Candidate.create(
      mapCandidatePrismaToDomain(candidateData),
      new UniqueEntityID(candidateData.id),
    );
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<Candidate | null> {
    const candidateData = await prisma.candidate.findFirst({
      where: { email, tenantId, deletedAt: null },
    });

    if (!candidateData) return null;

    return Candidate.create(
      mapCandidatePrismaToDomain(candidateData),
      new UniqueEntityID(candidateData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindCandidateFilters,
  ): Promise<{ candidates: Candidate[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      source: filters?.source as 'OTHER' | undefined,
      ...(filters?.search
        ? {
            OR: [
              {
                fullName: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: filters.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(filters?.tags && filters.tags.length > 0
        ? { tags: { hasSome: filters.tags } }
        : {}),
    };

    const [candidatesData, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.candidate.count({ where }),
    ]);

    const candidates = candidatesData.map((candidate) =>
      Candidate.create(
        mapCandidatePrismaToDomain(candidate),
        new UniqueEntityID(candidate.id),
      ),
    );

    return { candidates, total };
  }

  async update(data: UpdateCandidateSchema): Promise<Candidate | null> {
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existingCandidate) return null;

    const candidateData = await prisma.candidate.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        resumeUrl: data.resumeUrl,
        linkedinUrl: data.linkedinUrl,
        source: data.source as 'OTHER' | undefined,
        notes: data.notes,
        tags: data.tags,
      },
    });

    return Candidate.create(
      mapCandidatePrismaToDomain(candidateData),
      new UniqueEntityID(candidateData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.candidate.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
      data: { deletedAt: new Date() },
    });
  }
}
