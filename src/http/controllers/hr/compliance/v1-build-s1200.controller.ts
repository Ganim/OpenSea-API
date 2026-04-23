import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  buildS1200BodySchema,
  buildS1200ResponseSchema,
} from '@/http/schemas/hr/compliance/build-s1200.schema';
import { prisma } from '@/lib/prisma';
import type { S1200EmployeeDataset } from '@/use-cases/hr/compliance/build-s1200-for-competencia';
import { makeBuildS1200ForCompetenciaUseCase } from '@/use-cases/hr/compliance/factories/make-build-s1200-for-competencia';

/**
 * POST /v1/hr/compliance/esocial-s1200
 *
 * Gera eventos S-1200 (Remuneração do Trabalhador) + cria EsocialBatch em DRAFT.
 *
 * Permissão: `hr.compliance.s1200.submit`. ADR-026: usa preHandler.
 *
 * Fluxo:
 *  1. Zod valida body (competencia + scope + optional retify).
 *  2. Controller fetch EsocialConfig (environment → tpAmb; employerDocument → CNPJ).
 *  3. Resolve lista de employeeIds com base no scope.
 *  4. Para cada employee: busca Payroll(competencia) + payrollItems + TimeBank.
 *  5. Chama BuildS1200ForCompetenciaUseCase com dataset pronto.
 *  6. Persiste EsocialBatch + EsocialEvent[] no DB.
 *  7. Audit log ESOCIAL_S1200_SUBMITTED.
 *  8. Retorna 202 { batchId, eventIds, artifactIds, errors }.
 *
 * T-06-05-11: tpAmb é derivado EXCLUSIVAMENTE do EsocialConfig.environment do
 * tenant — o cliente NÃO pode forçar produção via body.
 */
export async function v1BuildS1200Controller(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/compliance/esocial-s1200',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPLIANCE.S1200_SUBMIT,
        resource: 'hr-compliance-s1200',
      }),
    ],
    schema: {
      tags: ['HR - Compliance'],
      summary: 'Gerar eventos eSocial S-1200 (por competência)',
      description:
        'Orquestra a geração de eventos S-1200 para uma competência, agrupa em EsocialBatch (DRAFT) e persiste XMLs como ComplianceArtifact(type=S1200_XML). Submissão SOAP ao eSocial fica a cargo do RH via UI específica.',
      body: buildS1200BodySchema,
      response: {
        202: buildS1200ResponseSchema,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const invokedByUserId = request.user.sub;
        const body = request.body;

        // ── 1. Fetch EsocialConfig ────────────────────────────────────
        const esocialConfig = await prisma.esocialConfig.findUnique({
          where: { tenantId },
        });
        if (!esocialConfig || !esocialConfig.employerDocument) {
          return reply.status(400).send({
            message:
              'Configure eSocial antes de gerar S-1200 (EsocialConfig + employerDocument obrigatórios).',
          });
        }
        const employerCnpj = esocialConfig.employerDocument.replace(/\D/g, '');
        if (employerCnpj.length !== 14) {
          return reply.status(400).send({
            message:
              'CNPJ do empregador (EsocialConfig.employerDocument) inválido — deve ter 14 dígitos.',
          });
        }
        const tpAmb: 1 | 2 = esocialConfig.environment === 'PRODUCAO' ? 1 : 2;
        const environment: 'HOMOLOGACAO' | 'PRODUCAO' =
          tpAmb === 1 ? 'PRODUCAO' : 'HOMOLOGACAO';

        // ── 2. Resolve employeeIds baseado em scope ────────────────────
        let employeeIds: string[] = [];
        if (body.scope === 'CUSTOM') {
          employeeIds = body.employeeIds ?? [];
        } else if (body.scope === 'DEPARTMENT') {
          const employees = await prisma.employee.findMany({
            where: {
              tenantId,
              departmentId: { in: body.departmentIds ?? [] },
            },
            select: { id: true },
          });
          employeeIds = employees.map((e) => e.id);
        } else {
          // ALL
          const employees = await prisma.employee.findMany({
            where: { tenantId },
            select: { id: true },
          });
          employeeIds = employees.map((e) => e.id);
        }

        if (employeeIds.length === 0) {
          return reply.status(400).send({
            message:
              'Nenhum funcionário encontrado no escopo informado para a competência.',
          });
        }

        // ── 3. Para cada employee, monta dataset com payroll + timebank ──
        const [year, month] = body.competencia.split('-').map(Number);
        const datasets: S1200EmployeeDataset[] = [];

        // Fetch payroll da competência (tenant-scoped)
        const payroll = await prisma.payroll.findFirst({
          where: {
            tenantId,
            referenceYear: year,
            referenceMonth: month,
          },
          select: { id: true },
        });

        const employees = await prisma.employee.findMany({
          where: { id: { in: employeeIds }, tenantId },
          select: {
            id: true,
            cpf: true,
          },
        });

        for (const employee of employees) {
          // Fetch payroll items para esse funcionário (se o payroll existe)
          let payrollItems: Array<{
            codRubr: string;
            ideTabRubr: string;
            vrRubr: number;
            indApurIR?: number;
          }> = [];

          if (payroll) {
            const items = await prisma.payrollItem.findMany({
              where: {
                payrollId: payroll.id,
                employeeId: employee.id,
              },
              select: {
                type: true,
                amount: true,
                description: true,
                isDeduction: true,
              },
            });

            // v1 simplificada: todas as rubricas payroll usam placeholders.
            // Para uma geração fidedigna ao mapeamento real codRubr, o Payroll
            // precisa ser evoluído (fase futura). Nesta v1 consumimos apenas
            // o valor monetário e deixamos o codRubr como '1000' (salário base
            // genérico) — o governo aceitará o evento em homologação para teste
            // de pipeline; UAT-04 valida se precisa upgrade.
            payrollItems = items
              .filter((it) => !it.isDeduction)
              .map((it) => ({
                codRubr: '1000',
                ideTabRubr: 'TAB01',
                vrRubr: Number(it.amount),
              }));
          }

          datasets.push({
            id: employee.id,
            cpfTrab: (employee.cpf ?? '').replace(/\D/g, ''),
            codCateg: 101, // Empregado geral — v1 padrão
            codLotacao: 'LOT01', // Lotação padrão — tenant pode configurar em fase futura
            estabCnpj: employerCnpj,
            estabTpInsc: 1,
            payrollItems,
            // timeBank: opcional — deferred para próximo plano que tenha
            // método TimeBankRepository.getByEmployeeAndCompetencia
            // consolidando HE50/HE100/DSR separadamente. Hoje o adapter 06-04
            // expõe por DATA mas não por competência crua.
          });
        }

        // ── 4. Invoca o use case puro ──────────────────────────────────
        const useCase = makeBuildS1200ForCompetenciaUseCase();
        const result = await useCase.execute({
          tenantId,
          invokedByUserId,
          competencia: body.competencia,
          tpAmb,
          employerCnpj,
          employees: datasets,
          retify: body.retify,
        });

        // ── 5. Persiste EsocialBatch + Events no DB ──────────────────
        const batch = await prisma.esocialBatch.create({
          data: {
            id: result.batchId,
            tenantId,
            status: 'PENDING',
            environment,
            totalEvents: result.events.length,
            acceptedCount: 0,
            rejectedCount: 0,
            createdBy: invokedByUserId,
          },
        });

        if (result.events.length > 0) {
          await prisma.esocialEvent.createMany({
            data: result.events.map((ev) => ({
              id: ev.eventId,
              tenantId,
              eventType: 'S-1200',
              description: `S-1200 ${body.competencia} — employee ${ev.referenceId}`,
              status: 'DRAFT',
              referenceId: ev.referenceId,
              referenceType: 'employee',
              xmlContent: ev.xmlContent,
              batchId: batch.id,
              rectifiedEventId: ev.rectifiedEventId ?? null,
            })),
          });
        }

        // ── 6. Audit log ───────────────────────────────────────────────
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ESOCIAL_S1200_SUBMITTED,
          entityId: batch.id,
          placeholders: {
            userName: invokedByUserId,
            competencia: body.competencia,
            eventCount: result.events.length,
            tpAmb,
          },
        });

        // Response 202 — batch criado; submissão SOAP separada.
        return reply.status(202).send({
          batchId: result.batchId,
          environment: result.environment,
          eventIds: result.eventIds,
          artifactIds: result.artifactIds,
          errors: result.errors,
          touched: result.touched,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
