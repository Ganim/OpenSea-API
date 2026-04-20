import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

import { CancelQrRotationBulkUseCase } from './cancel-qr-rotation-bulk';

const { getJobMock, getQueueMock, updateDataMock } = vi.hoisted(() => {
  const getJobMock = vi.fn();
  const updateDataMock = vi.fn();
  const getQueueMock = vi.fn(() => ({ getJob: getJobMock }));
  return { getJobMock, getQueueMock, updateDataMock };
});

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    QR_BATCH: 'qr-batch-operations',
  },
  createQueue: getQueueMock,
}));

describe('CancelQrRotationBulkUseCase', () => {
  let sut: CancelQrRotationBulkUseCase;

  beforeEach(() => {
    getJobMock.mockReset();
    updateDataMock.mockReset();
    getQueueMock.mockClear();
    sut = new CancelQrRotationBulkUseCase();
  });

  it('transitions the job to cancelling by updating its data flag', async () => {
    getJobMock.mockResolvedValueOnce({
      data: { tenantId: 't', employeeIds: ['e1'], generatePdfs: false },
      updateData: updateDataMock,
    });

    const result = await sut.execute({
      tenantId: 't',
      jobId: 'job-1',
    });

    expect(result.cancelled).toBe(true);
    expect(getQueueMock).toHaveBeenCalledWith('qr-batch-operations');
    expect(getJobMock).toHaveBeenCalledWith('job-1');
    expect(updateDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: true }),
    );
  });

  it('throws ResourceNotFoundError when the job does not exist', async () => {
    getJobMock.mockResolvedValueOnce(null);

    await expect(
      sut.execute({ tenantId: 't', jobId: 'missing' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the job belongs to a different tenant', async () => {
    getJobMock.mockResolvedValueOnce({
      data: { tenantId: 'other-tenant', employeeIds: ['e1'] },
      updateData: updateDataMock,
    });

    await expect(
      sut.execute({ tenantId: 't', jobId: 'job-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(updateDataMock).not.toHaveBeenCalled();
  });
});
