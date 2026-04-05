import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaInvoicesRepository } from '@/repositories/sales/prisma/prisma-invoices-repository';
import { PrismaFocusNfeConfigRepository } from '@/repositories/sales/prisma/prisma-focus-nfe-config-repository';
import { FocusNfeProviderImpl } from '@/providers/nfe/implementations/focus-nfe.impl';
import { IssueInvoiceUseCase } from '../issue-invoice.use-case';
import { CheckInvoiceStatusUseCase } from '../check-invoice-status.use-case';
import { CancelInvoiceUseCase } from '../cancel-invoice.use-case';
import { ConfigureFocusNfeUseCase } from '../configure-focus-nfe.use-case';
import { ListInvoicesUseCase } from '../list-invoices.use-case';

export function makeIssueInvoiceUseCase(): IssueInvoiceUseCase {
  return new IssueInvoiceUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaCustomersRepository(),
    new PrismaInvoicesRepository(),
    new PrismaFocusNfeConfigRepository(),
    new FocusNfeProviderImpl(true), // production
  );
}

export function makeCheckInvoiceStatusUseCase(): CheckInvoiceStatusUseCase {
  return new CheckInvoiceStatusUseCase(
    new PrismaInvoicesRepository(),
    new FocusNfeProviderImpl(true),
  );
}

export function makeCancelInvoiceUseCase(): CancelInvoiceUseCase {
  return new CancelInvoiceUseCase(
    new PrismaInvoicesRepository(),
    new FocusNfeProviderImpl(true),
  );
}

export function makeConfigureFocusNfeUseCase(): ConfigureFocusNfeUseCase {
  return new ConfigureFocusNfeUseCase(
    new PrismaFocusNfeConfigRepository(),
    new FocusNfeProviderImpl(true),
  );
}

export function makeListInvoicesUseCase(): ListInvoicesUseCase {
  return new ListInvoicesUseCase(new PrismaInvoicesRepository());
}
