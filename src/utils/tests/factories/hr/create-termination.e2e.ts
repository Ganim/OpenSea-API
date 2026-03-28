import { prisma } from '@/lib/prisma';
import { createEmployeeE2E } from './create-employee.e2e';

interface CreateTerminationE2EProps {
  tenantId: string;
  employeeId?: string;
  type?: string;
  terminationDate?: Date;
  lastWorkDay?: Date;
  noticeType?: string;
  noticeDays?: number;
  status?: string;
  notes?: string;
}

/**
 * Creates a termination record in the database for E2E tests.
 * If no employeeId is provided, creates an employee automatically.
 */
export async function createTerminationE2E(
  override: CreateTerminationE2EProps,
) {
  let employeeId = override.employeeId;

  if (!employeeId) {
    const { employee } = await createEmployeeE2E({
      tenantId: override.tenantId,
      status: 'TERMINATED',
    });
    employeeId = employee.id;
  }

  const terminationDate = override.terminationDate ?? new Date();
  const lastWorkDay = override.lastWorkDay ?? terminationDate;

  const paymentDeadline = new Date(terminationDate);
  paymentDeadline.setDate(paymentDeadline.getDate() + 10);

  const termination = await prisma.termination.create({
    data: {
      tenantId: override.tenantId,
      employeeId,
      type: override.type ?? 'SEM_JUSTA_CAUSA',
      terminationDate,
      lastWorkDay,
      noticeType: override.noticeType ?? 'INDENIZADO',
      noticeDays: override.noticeDays ?? 30,
      status: override.status ?? 'PENDING',
      notes: override.notes ?? null,
      paymentDeadline,
    },
  });

  return {
    termination,
    terminationId: termination.id,
    employeeId,
  };
}
