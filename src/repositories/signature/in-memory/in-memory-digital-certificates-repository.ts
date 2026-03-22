import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DigitalCertificate } from '@/entities/signature/digital-certificate';
import type {
  CreateDigitalCertificateSchema,
  DigitalCertificatesRepository,
  FindManyCertificatesResult,
  ListDigitalCertificatesParams,
} from '../digital-certificates-repository';

export class InMemoryDigitalCertificatesRepository
  implements DigitalCertificatesRepository
{
  public items: DigitalCertificate[] = [];

  async create(
    data: CreateDigitalCertificateSchema,
  ): Promise<DigitalCertificate> {
    const certificate = DigitalCertificate.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      type: data.type as DigitalCertificate['type'],
      status: (data.status as DigitalCertificate['status']) ?? undefined,
      subjectName: data.subjectName,
      subjectCnpj: data.subjectCnpj,
      subjectCpf: data.subjectCpf,
      issuerName: data.issuerName,
      serialNumber: data.serialNumber,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      thumbprint: data.thumbprint,
      pfxFileId: data.pfxFileId,
      pfxPassword: data.pfxPassword,
      cloudProviderId: data.cloudProviderId,
      alertDaysBefore: data.alertDaysBefore,
      isDefault: data.isDefault,
      allowedModules: data.allowedModules,
    });

    this.items.push(certificate);
    return certificate;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<DigitalCertificate | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id.toString() &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    params: ListDigitalCertificatesParams,
  ): Promise<FindManyCertificatesResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === params.tenantId,
    );

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }
    if (params.type) {
      filtered = filtered.filter((item) => item.type === params.type);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(s));
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      certificates: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => item.id.toString() !== id.toString(),
    );
  }
}
