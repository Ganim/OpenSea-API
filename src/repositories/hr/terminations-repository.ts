import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  NoticeType,
  Termination,
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateTerminationSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  type: TerminationType;
  terminationDate: Date;
  lastWorkDay: Date;
  noticeType: NoticeType;
  noticeDays: number;
  paymentDeadline: Date;
  notes?: string;
}

export interface UpdateTerminationSchema {
  id: UniqueEntityID;
  status?: TerminationStatus;
  paidAt?: Date;
  notes?: string;
  saldoSalario?: number;
  avisoIndenizado?: number;
  decimoTerceiroProp?: number;
  feriasVencidas?: number;
  feriasVencidasTerco?: number;
  feriasProporcional?: number;
  feriasProporcionalTerco?: number;
  multaFgts?: number;
  inssRescisao?: number;
  irrfRescisao?: number;
  outrosDescontos?: number;
  totalBruto?: number;
  totalDescontos?: number;
  totalLiquido?: number;
}

export interface FindTerminationFilters {
  employeeId?: UniqueEntityID;
  status?: TerminationStatus;
  type?: TerminationType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  perPage?: number;
}

export interface TerminationsRepository {
  create(data: CreateTerminationSchema): Promise<Termination>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<Termination | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Termination | null>;
  findMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<Termination[]>;
  countMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<number>;
  update(data: UpdateTerminationSchema): Promise<Termination | null>;
  save(termination: Termination, tx?: TransactionClient): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
