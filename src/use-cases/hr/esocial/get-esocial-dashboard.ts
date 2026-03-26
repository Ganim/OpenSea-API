import { prisma } from '@/lib/prisma';
import { CertificateManager } from '@/services/esocial/crypto/certificate-manager';

export interface GetEsocialDashboardRequest {
  tenantId: string;
}

export interface EsocialDashboardResponse {
  totalEvents: number;
  byStatus: Record<string, number>;
  pendingDeadlines: number;
  certificateExpiry: {
    daysLeft: number;
    validUntil: string | null;
    isExpired: boolean;
    hasCertificate: boolean;
  };
  lastTransmission: string | null;
  rejectedEvents: Array<{
    id: string;
    eventType: string;
    referenceName: string | null;
    rejectionCode: string | null;
    rejectionMessage: string | null;
    createdAt: string;
  }>;
}

export class GetEsocialDashboardUseCase {
  private certManager = new CertificateManager();

  async execute(
    request: GetEsocialDashboardRequest,
  ): Promise<EsocialDashboardResponse> {
    const { tenantId } = request;

    // 1. Count events by status
    const statusCounts = await prisma.esocialEvent.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    });

    const byStatus: Record<string, number> = {
      DRAFT: 0,
      REVIEWED: 0,
      APPROVED: 0,
      TRANSMITTING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      ERROR: 0,
    };

    let totalEvents = 0;
    for (const row of statusCounts) {
      byStatus[row.status] = row._count.id;
      totalEvents += row._count.id;
    }

    // 2. Pending deadlines (events with deadline in next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const pendingDeadlines = await prisma.esocialEvent.count({
      where: {
        tenantId,
        status: { in: ['DRAFT', 'REVIEWED', 'APPROVED'] },
        deadline: { lte: sevenDaysFromNow },
      },
    });

    // 3. Certificate info
    const certificate = await prisma.esocialCertificate.findUnique({
      where: { tenantId },
    });

    const certificateExpiry = {
      daysLeft: certificate
        ? this.certManager.daysUntilExpiry(certificate.validUntil)
        : 0,
      validUntil: certificate?.validUntil.toISOString() || null,
      isExpired: certificate
        ? this.certManager.isExpired(certificate.validUntil)
        : true,
      hasCertificate: !!certificate,
    };

    // 4. Last transmission
    const lastBatch = await prisma.esocialBatch.findFirst({
      where: { tenantId, transmittedAt: { not: null } },
      orderBy: { transmittedAt: 'desc' },
      select: { transmittedAt: true },
    });

    // 5. Recent rejected events
    const rejectedEvents = await prisma.esocialEvent.findMany({
      where: { tenantId, status: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        referenceName: true,
        rejectionCode: true,
        rejectionMessage: true,
        createdAt: true,
      },
    });

    return {
      totalEvents,
      byStatus,
      pendingDeadlines,
      certificateExpiry,
      lastTransmission: lastBatch?.transmittedAt?.toISOString() || null,
      rejectedEvents: rejectedEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }
}
