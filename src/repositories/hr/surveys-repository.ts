import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';

export interface CreateSurveySchema {
  tenantId: string;
  title: string;
  description?: string;
  type: string;
  status?: string;
  isAnonymous?: boolean;
  startDate: Date;
  endDate: Date;
  createdBy: UniqueEntityID;
}

export interface UpdateSurveySchema {
  id: UniqueEntityID;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  isAnonymous?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface FindSurveyFilters {
  type?: string;
  status?: string;
  createdBy?: UniqueEntityID;
  page?: number;
  perPage?: number;
}

export interface SurveysRepository {
  create(data: CreateSurveySchema): Promise<Survey>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Survey | null>;
  findMany(
    tenantId: string,
    filters?: FindSurveyFilters,
  ): Promise<{ surveys: Survey[]; total: number }>;
  update(data: UpdateSurveySchema): Promise<Survey | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
