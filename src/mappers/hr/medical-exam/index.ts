export { mapMedicalExamPrismaToDomain } from './medical-exam-prisma-to-domain';

export interface MedicalExamDTO {
  id: string;
  employeeId: string;
  type: string;
  examDate: string;
  expirationDate: string | null;
  doctorName: string;
  doctorCrm: string;
  result: string;
  observations: string | null;
  documentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export { medicalExamToDTO } from './medical-exam-to-dto';
