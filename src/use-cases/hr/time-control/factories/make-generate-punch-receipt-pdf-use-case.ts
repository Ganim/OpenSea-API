import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { GeneratePunchReceiptPDFUseCase } from '../generate-punch-receipt-pdf';

export function makeGeneratePunchReceiptPDFUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new GeneratePunchReceiptPDFUseCase(
    timeEntriesRepository,
    employeesRepository,
  );
}
