import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Discrepancy {
  field: string;
  expected: string;
  actual: string;
  tolerance: string;
}

interface InvoiceMatch {
  id: string;
  number: string;
  amount: number;
  date: string;
}

interface PurchaseOrderMatch {
  id: string;
  code: string;
  amount: number;
  date: string;
}

interface GoodsReceiptMatch {
  id: string;
  code: string;
  items: number;
  date: string;
}

export interface ThreeWayMatchResult {
  entryId: string;
  matchStatus: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH';
  invoice?: InvoiceMatch;
  purchaseOrder?: PurchaseOrderMatch;
  goodsReceipt?: GoodsReceiptMatch;
  discrepancies: Discrepancy[];
  recommendation: string;
}

interface ThreeWayMatchUseCaseRequest {
  tenantId: string;
  entryId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AMOUNT_TOLERANCE = 0.01; // 1%

function amountMatches(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true;
  const diff = Math.abs(a - b);
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  return avg > 0 ? diff / avg <= AMOUNT_TOLERANCE : true;
}

// ─── Use Case ────────────────────────────────────────────────────────────────

export class ThreeWayMatchUseCase {
  async execute({
    tenantId,
    entryId,
  }: ThreeWayMatchUseCaseRequest): Promise<ThreeWayMatchResult> {
    // 1. Load the entry
    const entry = await prisma.financeEntry.findFirst({
      where: { id: entryId, tenantId, deletedAt: null },
    });

    if (!entry) {
      throw new ResourceNotFoundError('Lançamento financeiro não encontrado');
    }

    if (entry.type !== 'PAYABLE') {
      throw new ResourceNotFoundError(
        'Three-way matching é aplicável apenas a contas a pagar',
      );
    }

    const entryAmount = Number(entry.expectedAmount);
    const supplierName = entry.supplierName;
    const discrepancies: Discrepancy[] = [];

    let invoice: InvoiceMatch | undefined;
    let purchaseOrder: PurchaseOrderMatch | undefined;
    let goodsReceipt: GoodsReceiptMatch | undefined;

    // 2. Find Invoice (FiscalDocument) — linked directly or by supplier + similar amount
    if (entry.fiscalDocumentId) {
      const doc = await prisma.fiscalDocument.findUnique({
        where: { id: entry.fiscalDocumentId },
      });
      if (doc) {
        invoice = {
          id: doc.id,
          number: `${doc.series}-${doc.number}`,
          amount: Number(doc.totalValue),
          date: doc.createdAt.toISOString().split('T')[0],
        };

        if (!amountMatches(entryAmount, Number(doc.totalValue))) {
          discrepancies.push({
            field: 'amount',
            expected: `R$ ${entryAmount.toFixed(2)}`,
            actual: `R$ ${Number(doc.totalValue).toFixed(2)}`,
            tolerance: '1%',
          });
        }
      }
    } else if (supplierName) {
      // Search for fiscal document by supplier name and similar amount
      const docs = await prisma.fiscalDocument.findMany({
        where: {
          tenantId,
          recipientName: { contains: supplierName, mode: 'insensitive' },
          status: { in: ['AUTHORIZED', 'DRAFT'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const doc of docs) {
        if (amountMatches(entryAmount, Number(doc.totalValue))) {
          invoice = {
            id: doc.id,
            number: `${doc.series}-${doc.number}`,
            amount: Number(doc.totalValue),
            date: doc.createdAt.toISOString().split('T')[0],
          };
          break;
        }
      }
    }

    // 3. Find Purchase Order (another PAYABLE entry with same supplier, status PENDING/SCHEDULED)
    if (supplierName) {
      const poEntries = await prisma.financeEntry.findMany({
        where: {
          tenantId,
          type: 'PAYABLE',
          deletedAt: null,
          supplierName: { contains: supplierName, mode: 'insensitive' },
          id: { not: entryId },
          status: { in: ['PENDING', 'SCHEDULED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const po of poEntries) {
        if (amountMatches(entryAmount, Number(po.expectedAmount))) {
          purchaseOrder = {
            id: po.id,
            code: po.code,
            amount: Number(po.expectedAmount),
            date: po.issueDate.toISOString().split('T')[0],
          };
          break;
        }
      }
    }

    // 4. Find Goods Receipt (ItemMovement with PURCHASE type + same supplier in notes/refs)
    if (supplierName) {
      const movements = await prisma.itemMovement.findMany({
        where: {
          tenantId,
          movementType: 'PURCHASE',
          OR: [
            { notes: { contains: supplierName, mode: 'insensitive' } },
            { originRef: { contains: supplierName, mode: 'insensitive' } },
            { destinationRef: { contains: supplierName, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (movements.length > 0) {
        // Group by date to find a single goods receipt "batch"
        const latestDate = movements[0].createdAt.toISOString().split('T')[0];
        const batch = movements.filter(
          (m) => m.createdAt.toISOString().split('T')[0] === latestDate,
        );

        goodsReceipt = {
          id: batch[0].id,
          code: `MOV-${latestDate}`,
          items: batch.length,
          date: latestDate,
        };
      }
    }

    // 5. Score match
    const matches = [invoice, purchaseOrder, goodsReceipt].filter(
      Boolean,
    ).length;
    let matchStatus: ThreeWayMatchResult['matchStatus'];

    if (matches >= 3 && discrepancies.length === 0) {
      matchStatus = 'FULL_MATCH';
    } else if (matches >= 2) {
      matchStatus = 'PARTIAL_MATCH';
    } else {
      matchStatus = 'NO_MATCH';
    }

    // 6. Generate recommendation
    let recommendation: string;
    switch (matchStatus) {
      case 'FULL_MATCH':
        recommendation =
          'Correspondência completa: nota fiscal, pedido de compra e recebimento de mercadoria conferem. Lançamento pode ser aprovado automaticamente.';
        break;
      case 'PARTIAL_MATCH': {
        const missing: string[] = [];
        if (!invoice) missing.push('nota fiscal');
        if (!purchaseOrder) missing.push('pedido de compra');
        if (!goodsReceipt) missing.push('recebimento de mercadoria');
        recommendation = `Correspondência parcial. Documento(s) ausente(s): ${missing.join(', ')}. ${
          discrepancies.length > 0
            ? `Encontrada(s) ${discrepancies.length} divergência(s). Recomenda-se revisão manual antes da aprovação.`
            : 'Recomenda-se verificar os documentos ausentes antes da aprovação.'
        }`;
        break;
      }
      case 'NO_MATCH':
        recommendation =
          'Sem correspondência: não foi possível localizar documentos relacionados. Verifique se o fornecedor, valor e período estão corretos. Este lançamento requer aprovação manual.';
        break;
    }

    // 7. Persist computed status on entry for fast read on listings
    await prisma.financeEntry.update({
      where: { id: entryId },
      data: {
        threeWayMatchStatus: matchStatus,
        threeWayMatchedAt: new Date(),
      },
    });

    return {
      entryId,
      matchStatus,
      invoice,
      purchaseOrder,
      goodsReceipt,
      discrepancies,
      recommendation,
    };
  }
}
