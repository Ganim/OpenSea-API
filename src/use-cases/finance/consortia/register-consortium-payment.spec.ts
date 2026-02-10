import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { InMemoryConsortiumPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-consortium-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterConsortiumPaymentUseCase } from './register-consortium-payment';

let consortiaRepository: InMemoryConsortiaRepository;
let paymentsRepository: InMemoryConsortiumPaymentsRepository;
let sut: RegisterConsortiumPaymentUseCase;

let seededConsortiumId: string;
let seededPaymentId: string;

describe('RegisterConsortiumPaymentUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    paymentsRepository = new InMemoryConsortiumPaymentsRepository();
    sut = new RegisterConsortiumPaymentUseCase(
      consortiaRepository,
      paymentsRepository,
    );

    const consortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio para pagamento',
      administrator: 'Admin',
      creditValue: 50000,
      monthlyPayment: 500,
      totalInstallments: 2,
      startDate: new Date('2026-01-01'),
    });
    seededConsortiumId = consortium.id.toString();

    const payment = await paymentsRepository.create({
      consortiumId: seededConsortiumId,
      installmentNumber: 1,
      dueDate: new Date('2026-02-01'),
      expectedAmount: 500,
    });
    seededPaymentId = payment.id.toString();

    await paymentsRepository.create({
      consortiumId: seededConsortiumId,
      installmentNumber: 2,
      dueDate: new Date('2026-03-01'),
      expectedAmount: 500,
    });
  });

  it('should register a payment and update consortium', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: seededConsortiumId,
      paymentId: seededPaymentId,
      amount: 500,
      paidAt: new Date('2026-02-01'),
    });

    expect(result.payment.status).toBe('PAID');
    expect(result.payment.paidAmount).toBe(500);
    expect(result.consortium.paidInstallments).toBe(1);
    expect(result.consortium.status).toBe('ACTIVE');
  });

  it('should mark consortium as COMPLETED when last payment is made', async () => {
    // Pay first
    await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: seededConsortiumId,
      paymentId: seededPaymentId,
      amount: 500,
      paidAt: new Date('2026-02-01'),
    });

    // Pay second
    const secondPayment = paymentsRepository.items.find(
      (i) => i.installmentNumber === 2,
    );
    const result = await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: seededConsortiumId,
      paymentId: secondPayment!.id.toString(),
      amount: 500,
      paidAt: new Date('2026-03-01'),
    });

    expect(result.consortium.status).toBe('COMPLETED');
    expect(result.consortium.paidInstallments).toBe(2);
  });

  it('should not pay an already paid payment', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: seededConsortiumId,
      paymentId: seededPaymentId,
      amount: 500,
      paidAt: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        consortiumId: seededConsortiumId,
        paymentId: seededPaymentId,
        amount: 500,
        paidAt: new Date('2026-02-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not pay for non-existent consortium', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        consortiumId: 'non-existent-id',
        paymentId: seededPaymentId,
        amount: 500,
        paidAt: new Date('2026-02-01'),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
