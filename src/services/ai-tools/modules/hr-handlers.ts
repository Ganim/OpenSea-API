import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { TOOL_LIST_MAX_ITEMS } from '../tool-types';

// === Employee Factories ===
import { makeListEmployeesUseCase } from '@/use-cases/hr/employees/factories/make-list-employees-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeCreateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-create-employee-use-case';
import { makeUpdateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-update-employee-use-case';

// === Department Factories ===
import { makeListDepartmentsUseCase } from '@/use-cases/hr/departments/factories/make-list-departments-use-case';
import { makeCreateDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-create-department-use-case';

// === Position Factories ===
import { makeListPositionsUseCase } from '@/use-cases/hr/positions/factories/make-list-positions-use-case';
import { makeCreatePositionUseCase } from '@/use-cases/hr/positions/factories/make-create-position-use-case';

// === Work Schedule Factories ===
import { makeListWorkSchedulesUseCase } from '@/use-cases/hr/work-schedules/factories/make-list-work-schedules-use-case';
import { makeGetWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-get-work-schedule-use-case';

// === Absence Factories ===
import { makeListAbsencesUseCase } from '@/use-cases/hr/absences/factories/make-list-absences-use-case';
import { makeRequestSickLeaveUseCase } from '@/use-cases/hr/absences/factories/make-request-sick-leave-use-case';
import { makeRequestVacationUseCase } from '@/use-cases/hr/absences/factories/make-request-vacation-use-case';
import { makeApproveAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-approve-absence-use-case';
import { makeCalculateVacationBalanceUseCase } from '@/use-cases/hr/absences/factories/make-calculate-vacation-balance-use-case';

// === Vacation Period Factories ===
import { makeListVacationPeriodsUseCase } from '@/use-cases/hr/vacation-periods/factories/make-list-vacation-periods-use-case';

// === Payroll Factories ===
import { makeListPayrollsUseCase } from '@/use-cases/hr/payrolls/factories/make-list-payrolls-use-case';

// ─── Helpers ─────────────────────────────────────────────────────────

function clampLimit(limit: unknown, fallback = 10): number {
  const n = typeof limit === 'number' ? limit : fallback;
  return Math.min(Math.max(1, n), TOOL_LIST_MAX_ITEMS);
}

// ─── Export ──────────────────────────────────────────────────────────

export function getHrHandlers(): Record<string, ToolHandler> {
  return {
    // =========================================================
    // QUERY TOOLS (10)
    // =========================================================

    hr_list_employees: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListEmployeesUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          status: args.status as string | undefined,
          departmentId: args.departmentId as string | undefined,
          positionId: args.positionId as string | undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.totalPages,
          showing: result.employees.length,
          employees: result.employees
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((e) => ({
              id: e.id.toString(),
              fullName: e.fullName,
              registrationNumber: e.registrationNumber,
              status: e.status.value,
              email: e.email,
              phone: e.phone,
              departmentId: e.departmentId?.toString() ?? null,
              positionId: e.positionId?.toString() ?? null,
              contractType: e.contractType.value,
              hireDate: e.hireDate?.toISOString().split('T')[0] ?? null,
            })),
        };
      },
    },

    hr_get_employee: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // If employeeId provided, use get-by-id directly
        if (args.employeeId) {
          const useCase = makeGetEmployeeByIdUseCase();
          const result = await useCase.execute({
            tenantId: context.tenantId,
            employeeId: args.employeeId as string,
          });
          const e = result.employee;
          return {
            id: e.id.toString(),
            fullName: e.fullName,
            socialName: e.socialName,
            registrationNumber: e.registrationNumber,
            cpf: `***.***.***-${e.cpf.value.slice(-2)}`,
            status: e.status.value,
            email: e.email,
            phone: e.phone,
            departmentId: e.departmentId?.toString() ?? null,
            positionId: e.positionId?.toString() ?? null,
            supervisorId: e.supervisorId?.toString() ?? null,
            contractType: e.contractType.value,
            workRegime: e.workRegime.value,
            weeklyHours: e.weeklyHours,
            baseSalary: e.baseSalary,
            hireDate: e.hireDate?.toISOString().split('T')[0] ?? null,
            birthDate: e.birthDate?.toISOString().split('T')[0] ?? null,
            gender: e.gender,
            pendingIssues: e.pendingIssues,
            createdAt: e.createdAt.toISOString(),
          };
        }

        // If name provided, search by name
        if (args.name) {
          const listUseCase = makeListEmployeesUseCase();
          const result = await listUseCase.execute({
            tenantId: context.tenantId,
            search: args.name as string,
            page: 1,
            perPage: 5,
          });
          if (result.employees.length === 0) {
            return { error: 'Nenhum funcionário encontrado com esse nome.' };
          }
          if (result.employees.length === 1) {
            const e = result.employees[0];
            return {
              id: e.id.toString(),
              fullName: e.fullName,
              registrationNumber: e.registrationNumber,
              cpf: `***.***.***-${e.cpf.value.slice(-2)}`,
              status: e.status.value,
              email: e.email,
              departmentId: e.departmentId?.toString() ?? null,
              positionId: e.positionId?.toString() ?? null,
              contractType: e.contractType.value,
              hireDate: e.hireDate?.toISOString().split('T')[0] ?? null,
              createdAt: e.createdAt.toISOString(),
            };
          }
          return {
            message: `Encontrados ${result.employees.length} funcionários. Especifique o ID.`,
            employees: result.employees.map((e) => ({
              id: e.id.toString(),
              fullName: e.fullName,
              registrationNumber: e.registrationNumber,
              status: e.status.value,
            })),
          };
        }

        return { error: 'Informe o employeeId ou o nome do funcionário.' };
      },
    },

    hr_list_departments: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListDepartmentsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          isActive: args.isActive as boolean | undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.totalPages,
          showing: result.departments.length,
          departments: result.departments
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((d) => ({
              id: d.id.toString(),
              name: d.name,
              code: d.code,
              description: d.description,
              parentId: d.parentId?.toString() ?? null,
              managerId: d.managerId?.toString() ?? null,
              companyId: d.companyId.toString(),
              isActive: d.isActive,
            })),
        };
      },
    },

    hr_list_positions: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListPositionsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          search: args.search as string | undefined,
          departmentId: args.departmentId as string | undefined,
          isActive: args.isActive as boolean | undefined,
          level: args.level as number | undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.totalPages,
          showing: result.positions.length,
          positions: result.positions
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((p) => ({
              id: p.id.toString(),
              name: p.name,
              code: p.code,
              description: p.description,
              departmentId: p.departmentId?.toString() ?? null,
              level: p.level,
              minSalary: p.minSalary,
              maxSalary: p.maxSalary,
              isActive: p.isActive,
            })),
        };
      },
    },

    hr_list_work_schedules: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListWorkSchedulesUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          activeOnly: args.activeOnly as boolean | undefined,
        });
        return {
          total: result.total,
          workSchedules: result.workSchedules
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((ws) => ({
              id: ws.id.toString(),
              name: ws.name,
              description: ws.description,
              weeklyHours: ws.calculateWeeklyHours(),
              breakDuration: ws.breakDuration,
              isActive: ws.isActive,
            })),
        };
      },
    },

    hr_get_work_schedule: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.workScheduleId) {
          return { error: 'Informe o workScheduleId.' };
        }
        const useCase = makeGetWorkScheduleUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.workScheduleId as string,
        });
        const ws = result.workSchedule;
        const days = [
          { day: 'Domingo', start: ws.sundayStart, end: ws.sundayEnd },
          { day: 'Segunda', start: ws.mondayStart, end: ws.mondayEnd },
          { day: 'Terça', start: ws.tuesdayStart, end: ws.tuesdayEnd },
          { day: 'Quarta', start: ws.wednesdayStart, end: ws.wednesdayEnd },
          { day: 'Quinta', start: ws.thursdayStart, end: ws.thursdayEnd },
          { day: 'Sexta', start: ws.fridayStart, end: ws.fridayEnd },
          { day: 'Sábado', start: ws.saturdayStart, end: ws.saturdayEnd },
        ].filter((d) => d.start && d.end);

        return {
          id: ws.id.toString(),
          name: ws.name,
          description: ws.description,
          weeklyHours: ws.calculateWeeklyHours(),
          breakDuration: ws.breakDuration,
          isActive: ws.isActive,
          schedule: days.map((d) => ({
            day: d.day,
            start: d.start,
            end: d.end,
          })),
          createdAt: ws.createdAt.toISOString(),
        };
      },
    },

    hr_list_absences: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListAbsencesUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string | undefined,
          type: args.type as string | undefined,
          status: args.status as string | undefined,
          startDate: args.startDate
            ? new Date(args.startDate as string)
            : undefined,
          endDate: args.endDate ? new Date(args.endDate as string) : undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.totalPages,
          showing: result.absences.length,
          absences: result.absences.slice(0, TOOL_LIST_MAX_ITEMS).map((a) => ({
            id: a.id.toString(),
            employeeId: a.employeeId.toString(),
            type: a.type.value,
            status: a.status.value,
            startDate: a.startDate.toISOString().split('T')[0],
            endDate: a.endDate.toISOString().split('T')[0],
            totalDays: a.totalDays,
            reason: a.reason?.slice(0, 100),
            isPaid: a.isPaid,
          })),
        };
      },
    },

    hr_list_vacation_periods: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListVacationPeriodsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string | undefined,
          status: args.status as string | undefined,
          year: args.year as number | undefined,
        });
        return {
          total: result.vacationPeriods.length,
          vacationPeriods: result.vacationPeriods
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((vp) => ({
              id: vp.id.toString(),
              employeeId: vp.employeeId.toString(),
              acquisitionStart: vp.acquisitionStart.toISOString().split('T')[0],
              acquisitionEnd: vp.acquisitionEnd.toISOString().split('T')[0],
              concessionEnd: vp.concessionEnd.toISOString().split('T')[0],
              totalDays: vp.totalDays,
              usedDays: vp.usedDays,
              soldDays: vp.soldDays,
              remainingDays: vp.remainingDays,
              status: vp.status.value,
            })),
        };
      },
    },

    hr_get_vacation_balance: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.employeeId) {
          return { error: 'Informe o employeeId.' };
        }
        const useCase = makeCalculateVacationBalanceUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string,
        });
        return {
          employeeId: result.employeeId,
          employeeName: result.employeeName,
          totalAvailableDays: result.totalAvailableDays,
          totalUsedDays: result.totalUsedDays,
          totalSoldDays: result.totalSoldDays,
          periods: result.periods.slice(0, TOOL_LIST_MAX_ITEMS).map((p) => ({
            acquisitionPeriod: p.acquisitionPeriod,
            concessionDeadline: p.concessionDeadline
              .toISOString()
              .split('T')[0],
            totalDays: p.totalDays,
            usedDays: p.usedDays,
            soldDays: p.soldDays,
            remainingDays: p.remainingDays,
            status: p.status,
            isExpired: p.isExpired,
            daysUntilExpiration: p.daysUntilExpiration,
          })),
        };
      },
    },

    hr_list_payrolls: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListPayrollsUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          referenceMonth: args.referenceMonth as number | undefined,
          referenceYear: args.referenceYear as number | undefined,
          status: args.status as string | undefined,
          page: (args.page as number) ?? 1,
          perPage: limit,
        });
        return {
          total: result.payrolls.length,
          payrolls: result.payrolls.slice(0, TOOL_LIST_MAX_ITEMS).map((p) => ({
            id: p.id.toString(),
            referenceMonth: p.referenceMonth,
            referenceYear: p.referenceYear,
            status: p.status.value,
            totalGross: p.totalGross,
            totalDeductions: p.totalDeductions,
            totalNet: p.totalNet,
            employeeCount: p.employeeCount,
          })),
        };
      },
    },

    // =========================================================
    // ACTION TOOLS (7)
    // =========================================================

    hr_create_employee: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateEmployeeUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          fullName: args.fullName as string,
          cpf: args.cpf as string,
          registrationNumber: args.registrationNumber as string,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          departmentId: args.departmentId as string | undefined,
          positionId: args.positionId as string | undefined,
          hireDate: new Date(args.hireDate as string),
          baseSalary: args.baseSalary as number | undefined,
          contractType: (args.contractType as string) ?? 'CLT',
          workRegime: (args.workRegime as string) ?? 'FULL_TIME',
          weeklyHours: (args.weeklyHours as number) ?? 44,
          gender: args.gender as string | undefined,
          birthDate: args.birthDate
            ? new Date(args.birthDate as string)
            : undefined,
        });
        const e = result.employee;
        return {
          success: true,
          message: `Funcionário "${e.fullName}" cadastrado com sucesso.`,
          employee: {
            id: e.id.toString(),
            fullName: e.fullName,
            registrationNumber: e.registrationNumber,
            status: e.status.value,
            contractType: e.contractType.value,
          },
        };
      },
    },

    hr_update_employee: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeUpdateEmployeeUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string,
          fullName: args.fullName as string | undefined,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          departmentId: args.departmentId as string | undefined,
          positionId: args.positionId as string | undefined,
          baseSalary: args.baseSalary as number | undefined,
          contractType: args.contractType as string | undefined,
          workRegime: args.workRegime as string | undefined,
          weeklyHours: args.weeklyHours as number | undefined,
        });
        const e = result.employee;
        return {
          success: true,
          message: `Funcionário "${e.fullName}" atualizado com sucesso.`,
          employee: {
            id: e.id.toString(),
            fullName: e.fullName,
            registrationNumber: e.registrationNumber,
            status: e.status.value,
          },
        };
      },
    },

    hr_create_department: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateDepartmentUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          code: args.code as string,
          description: args.description as string | undefined,
          companyId: args.companyId as string,
          parentId: args.parentId as string | undefined,
          managerId: args.managerId as string | undefined,
        });
        const d = result.department;
        return {
          success: true,
          message: `Departamento "${d.name}" criado com sucesso.`,
          department: {
            id: d.id.toString(),
            name: d.name,
            code: d.code,
          },
        };
      },
    },

    hr_create_position: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreatePositionUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          code: args.code as string,
          description: args.description as string | undefined,
          departmentId: args.departmentId as string | undefined,
          level: args.level as number | undefined,
          minSalary: args.minSalary as number | undefined,
          maxSalary: args.maxSalary as number | undefined,
        });
        const p = result.position;
        return {
          success: true,
          message: `Cargo "${p.name}" criado com sucesso.`,
          position: {
            id: p.id.toString(),
            name: p.name,
            code: p.code,
            level: p.level,
          },
        };
      },
    },

    hr_request_sick_leave: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeRequestSickLeaveUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string,
          startDate: new Date(args.startDate as string),
          endDate: new Date(args.endDate as string),
          cid: args.cid as string,
          reason: args.reason as string | undefined,
          requestedBy: context.userId,
        });
        const a = result.absence;
        return {
          success: true,
          message: `Licença médica registrada com sucesso (${a.totalDays} dias).`,
          absence: {
            id: a.id.toString(),
            type: a.type.value,
            status: a.status.value,
            startDate: a.startDate.toISOString().split('T')[0],
            endDate: a.endDate.toISOString().split('T')[0],
            totalDays: a.totalDays,
            isPaid: a.isPaid,
          },
        };
      },
    },

    hr_request_vacation: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeRequestVacationUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string,
          vacationPeriodId: args.vacationPeriodId as string,
          startDate: new Date(args.startDate as string),
          endDate: new Date(args.endDate as string),
          reason: args.reason as string | undefined,
          requestedBy: context.userId,
        });
        const a = result.absence;
        return {
          success: true,
          message: `Férias solicitadas com sucesso (${a.totalDays} dias).`,
          absence: {
            id: a.id.toString(),
            type: a.type.value,
            status: a.status.value,
            startDate: a.startDate.toISOString().split('T')[0],
            endDate: a.endDate.toISOString().split('T')[0],
            totalDays: a.totalDays,
          },
        };
      },
    },

    hr_approve_absence: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.absenceId) {
          return { error: 'Informe o absenceId.' };
        }
        const useCase = makeApproveAbsenceUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          absenceId: args.absenceId as string,
          approvedBy: context.userId,
        });
        const a = result.absence;
        return {
          success: true,
          message: `Ausência aprovada com sucesso.`,
          absence: {
            id: a.id.toString(),
            type: a.type.value,
            status: a.status.value,
            startDate: a.startDate.toISOString().split('T')[0],
            endDate: a.endDate.toISOString().split('T')[0],
            totalDays: a.totalDays,
          },
        };
      },
    },

    // =========================================================
    // REPORT TOOLS (4)
    // =========================================================

    hr_headcount_summary: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListEmployeesUseCase();

        // Get all employees (up to 1000 for summary)
        const result = await useCase.execute({
          tenantId: context.tenantId,
          departmentId: args.departmentId as string | undefined,
          page: 1,
          perPage: 1000,
        });

        // Group by status
        const byStatus: Record<string, number> = {};
        const byContractType: Record<string, number> = {};

        for (const emp of result.employees) {
          const status = emp.status.value;
          byStatus[status] = (byStatus[status] ?? 0) + 1;

          const contract = emp.contractType.value;
          byContractType[contract] = (byContractType[contract] ?? 0) + 1;
        }

        return {
          totalEmployees: result.meta.total,
          byStatus,
          byContractType,
          activeCount: byStatus['ACTIVE'] ?? 0,
          onLeaveCount: byStatus['ON_LEAVE'] ?? 0,
          vacationCount: byStatus['VACATION'] ?? 0,
          suspendedCount: byStatus['SUSPENDED'] ?? 0,
          terminatedCount: byStatus['TERMINATED'] ?? 0,
        };
      },
    },

    hr_department_distribution: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        // Get departments
        const deptUseCase = makeListDepartmentsUseCase();
        const deptResult = await deptUseCase.execute({
          tenantId: context.tenantId,
          page: 1,
          perPage: 100,
        });

        // Get employees
        const empUseCase = makeListEmployeesUseCase();
        const empResult = await empUseCase.execute({
          tenantId: context.tenantId,
          status: (args.status as string) ?? 'ACTIVE',
          page: 1,
          perPage: 1000,
        });

        // Build department name map
        const deptNames: Record<string, string> = {};
        for (const dept of deptResult.departments) {
          deptNames[dept.id.toString()] = dept.name;
        }

        // Group employees by department
        const byDepartment: Record<string, number> = {};
        let unassigned = 0;

        for (const emp of empResult.employees) {
          if (emp.departmentId) {
            const deptId = emp.departmentId.toString();
            const deptName = deptNames[deptId] ?? deptId;
            byDepartment[deptName] = (byDepartment[deptName] ?? 0) + 1;
          } else {
            unassigned++;
          }
        }

        const totalFiltered = empResult.meta.total;
        const distribution = Object.entries(byDepartment)
          .map(([department, count]) => ({
            department,
            count,
            percentage:
              totalFiltered > 0
                ? Math.round((count / totalFiltered) * 10000) / 100
                : 0,
          }))
          .sort((a, b) => b.count - a.count);

        return {
          totalEmployees: totalFiltered,
          statusFilter: (args.status as string) ?? 'ACTIVE',
          unassigned,
          departments: distribution.slice(0, TOOL_LIST_MAX_ITEMS),
        };
      },
    },

    hr_absence_rate_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const absenceUseCase = makeListAbsencesUseCase();
        const result = await absenceUseCase.execute({
          tenantId: context.tenantId,
          employeeId: args.employeeId as string | undefined,
          startDate: new Date(args.startDate as string),
          endDate: new Date(args.endDate as string),
          page: 1,
          perPage: 1000,
        });

        // Group by type
        const byType: Record<string, { count: number; totalDays: number }> = {};
        let totalAbsenceDays = 0;

        for (const absence of result.absences) {
          const type = absence.type.value;
          if (!byType[type]) {
            byType[type] = { count: 0, totalDays: 0 };
          }
          byType[type].count++;
          byType[type].totalDays += absence.totalDays;
          totalAbsenceDays += absence.totalDays;
        }

        // Group by status
        const byStatus: Record<string, number> = {};
        for (const absence of result.absences) {
          const status = absence.status.value;
          byStatus[status] = (byStatus[status] ?? 0) + 1;
        }

        return {
          period: {
            startDate: args.startDate,
            endDate: args.endDate,
          },
          totalAbsences: result.meta.total,
          totalAbsenceDays,
          byType,
          byStatus,
        };
      },
    },

    hr_payroll_summary: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListPayrollsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          referenceMonth: args.referenceMonth as number,
          referenceYear: args.referenceYear as number,
        });

        if (result.payrolls.length === 0) {
          return {
            message: `Nenhuma folha de pagamento encontrada para ${String(args.referenceMonth as number).padStart(2, '0')}/${args.referenceYear}.`,
          };
        }

        const payroll = result.payrolls[0];
        return {
          referenceMonth: payroll.referenceMonth,
          referenceYear: payroll.referenceYear,
          status: payroll.status.value,
          employeeCount: payroll.employeeCount,
          totalGross: Math.round((payroll.totalGross ?? 0) * 100) / 100,
          totalDeductions:
            Math.round((payroll.totalDeductions ?? 0) * 100) / 100,
          totalNet: Math.round((payroll.totalNet ?? 0) * 100) / 100,
        };
      },
    },
  };
}
