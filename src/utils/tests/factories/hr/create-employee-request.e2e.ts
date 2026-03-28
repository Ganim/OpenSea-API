import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateEmployeeRequestE2EProps {
  tenantId: string;
  employeeId: string;
  type?: string;
  status?: string;
  data?: Record<string, unknown>;
  approverEmployeeId?: string;
  rejectionReason?: string;
}

/**
 * Creates an employee request directly in the database for E2E tests.
 * Uses a UUID as ID to pass controller param validation (z.string().uuid()).
 */
export async function createEmployeeRequestE2E(
  props: CreateEmployeeRequestE2EProps,
) {
  const employeeRequest = await prisma.employeeRequest.create({
    data: {
      id: randomUUID(),
      tenantId: props.tenantId,
      employeeId: props.employeeId,
      type: props.type ?? 'VACATION',
      status: props.status ?? 'PENDING',
      data: props.data ?? {},
      approverEmployeeId: props.approverEmployeeId,
      rejectionReason: props.rejectionReason,
    },
  });

  return {
    employeeRequest,
    employeeRequestId: employeeRequest.id,
  };
}
