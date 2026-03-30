import type { JobPosting } from '@/entities/hr/job-posting';

export interface JobPostingDTO {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  positionId: string | null;
  status: string;
  type: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requirements: unknown;
  benefits: string | null;
  maxApplicants: number | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function jobPostingToDTO(posting: JobPosting): JobPostingDTO {
  return {
    id: posting.id.toString(),
    title: posting.title,
    description: posting.description ?? null,
    departmentId: posting.departmentId?.toString() ?? null,
    positionId: posting.positionId?.toString() ?? null,
    status: posting.status,
    type: posting.type,
    location: posting.location ?? null,
    salaryMin: posting.salaryMin ?? null,
    salaryMax: posting.salaryMax ?? null,
    requirements: posting.requirements ?? null,
    benefits: posting.benefits ?? null,
    maxApplicants: posting.maxApplicants ?? null,
    publishedAt: posting.publishedAt?.toISOString() ?? null,
    closedAt: posting.closedAt?.toISOString() ?? null,
    createdAt: posting.createdAt.toISOString(),
    updatedAt: posting.updatedAt.toISOString(),
  };
}
