import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';
import { prisma } from '@/lib/prisma';
import { mapGeneratedEmploymentContractPrismaToDomain } from '@/mappers/hr/generated-employment-contract';
import type {
  CreateGeneratedEmploymentContractSchema,
  FindManyGeneratedContractsParams,
  FindManyGeneratedContractsResult,
  GeneratedEmploymentContractsRepository,
} from '../generated-employment-contracts-repository';

export class PrismaGeneratedEmploymentContractsRepository
  implements GeneratedEmploymentContractsRepository
{
  async create(
    data: CreateGeneratedEmploymentContractSchema,
  ): Promise<GeneratedEmploymentContract> {
    const contractData = await prisma.generatedEmploymentContract.create({
      data: {
        tenantId: data.tenantId,
        templateId: data.templateId.toString(),
        employeeId: data.employeeId.toString(),
        generatedBy: data.generatedBy.toString(),
        storageFileId: data.storageFileId?.toString(),
        pdfUrl: data.pdfUrl,
        pdfKey: data.pdfKey,
        variables: data.variables as object,
      },
    });

    return GeneratedEmploymentContract.create(
      mapGeneratedEmploymentContractPrismaToDomain(contractData),
      new UniqueEntityID(contractData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null> {
    const contractData = await prisma.generatedEmploymentContract.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!contractData) return null;

    return GeneratedEmploymentContract.create(
      mapGeneratedEmploymentContractPrismaToDomain(contractData),
      new UniqueEntityID(contractData.id),
    );
  }

  async findBySignatureEnvelopeId(
    envelopeId: string,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null> {
    const contractData = await prisma.generatedEmploymentContract.findFirst({
      where: { signatureEnvelopeId: envelopeId, tenantId },
    });

    if (!contractData) return null;

    return GeneratedEmploymentContract.create(
      mapGeneratedEmploymentContractPrismaToDomain(contractData),
      new UniqueEntityID(contractData.id),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract[]> {
    const contractsData = await prisma.generatedEmploymentContract.findMany({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return contractsData.map((contract) =>
      GeneratedEmploymentContract.create(
        mapGeneratedEmploymentContractPrismaToDomain(contract),
        new UniqueEntityID(contract.id),
      ),
    );
  }

  async findMany(
    params: FindManyGeneratedContractsParams,
  ): Promise<FindManyGeneratedContractsResult> {
    const { tenantId, employeeId, templateId, page = 1, perPage = 20 } = params;

    const where = {
      tenantId,
      ...(employeeId && { employeeId: employeeId.toString() }),
      ...(templateId && { templateId: templateId.toString() }),
    };

    const [contracts, total] = await Promise.all([
      prisma.generatedEmploymentContract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.generatedEmploymentContract.count({ where }),
    ]);

    return {
      contracts: contracts.map((contract) =>
        GeneratedEmploymentContract.create(
          mapGeneratedEmploymentContractPrismaToDomain(contract),
          new UniqueEntityID(contract.id),
        ),
      ),
      total,
    };
  }

  async save(contract: GeneratedEmploymentContract): Promise<void> {
    await prisma.generatedEmploymentContract.update({
      where: {
        id: contract.id.toString(),
        tenantId: contract.tenantId.toString(),
      },
      data: {
        pdfUrl: contract.pdfUrl,
        pdfKey: contract.pdfKey,
        storageFileId: contract.storageFileId?.toString(),
        variables: contract.variables as object,
        signatureEnvelopeId: contract.signatureEnvelopeId ?? null,
      },
    });
  }

  async updateSignatureEnvelopeId(
    id: UniqueEntityID,
    envelopeId: string | null,
    tenantId: string,
  ): Promise<void> {
    await prisma.generatedEmploymentContract.updateMany({
      where: { id: id.toString(), tenantId },
      data: { signatureEnvelopeId: envelopeId },
    });
  }
}
