import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Transfer Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer employee to new department as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create departments
    const oldDepartment = await prisma.department.create({
      data: {
        name: `Old Department ${Date.now()}`,
        code: `OLD-${Date.now()}`,
      },
    });

    const newDepartment = await prisma.department.create({
      data: {
        name: `New Department ${Date.now()}`,
        code: `NEW-${Date.now()}`,
      },
    });

    const { employee } = await createEmployeeE2E({
      departmentId: oldDepartment.id,
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Promoção para novo departamento',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.departmentId).toBe(newDepartment.id);
  });

  it('should transfer employee to new position as ADMIN', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    // Create positions
    const oldPosition = await prisma.position.create({
      data: {
        name: `Old Position ${Date.now()}`,
        code: `OLDPOS-${Date.now()}`,
      },
    });

    const newPosition = await prisma.position.create({
      data: {
        name: `New Position ${Date.now()}`,
        code: `NEWPOS-${Date.now()}`,
      },
    });

    const { employee } = await createEmployeeE2E({
      positionId: oldPosition.id,
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newPositionId: newPosition.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Promoção de cargo',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.positionId).toBe(newPosition.id);
  });

  it('should transfer employee to both new department and position', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const newDepartment = await prisma.department.create({
      data: {
        name: `Dept Transfer Both ${Date.now()}`,
        code: `DEPTBOTH-${Date.now()}`,
      },
    });

    const newPosition = await prisma.position.create({
      data: {
        name: `Pos Transfer Both ${Date.now()}`,
        code: `POSBOTH-${Date.now()}`,
      },
    });

    const { employeeId, employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        newPositionId: newPosition.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Reestruturação organizacional',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.departmentId).toBe(newDepartment.id);
    expect(response.body.employee.positionId).toBe(newPosition.id);
  });

  it('should NOT allow USER to transfer employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employeeId, employee } = await createEmployeeE2E();

    const newDepartment = await prisma.department.create({
      data: {
        name: `User Dept ${Date.now()}`,
        code: `USERDEPT-${Date.now()}`,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Should not work',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const newDepartment = await prisma.department.create({
      data: {
        name: `NonExist Dept ${Date.now()}`,
        code: `NONEXIST-${Date.now()}`,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${nonExistentId}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Non existent',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId, employee } = await createEmployeeE2E();

    const newDepartment = await prisma.department.create({
      data: {
        name: `NoToken Dept ${Date.now()}`,
        code: `NOTOKEN-${Date.now()}`,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .send({
        newDepartmentId: newDepartment.id,
        effectiveDate: new Date().toISOString(),
        reason: 'No token',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should not allow transfer of terminated employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E({ status: 'TERMINATED' });

    const newDepartment = await prisma.department.create({
      data: {
        name: `Terminated Dept ${Date.now()}`,
        code: `TERM-${Date.now()}`,
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        effectiveDate: new Date().toISOString(),
        reason: 'Terminated employee',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('terminated employee');
  });

  it('should update employee base salary on transfer', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const newDepartment = await prisma.department.create({
      data: {
        name: `Salary Dept ${Date.now()}`,
        code: `SALARY-${Date.now()}`,
      },
    });

    const { employee } = await createEmployeeE2E({ baseSalary: 5000 });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId: newDepartment.id,
        newBaseSalary: 7500,
        effectiveDate: new Date().toISOString(),
        reason: 'Promoção com aumento salarial',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.baseSalary).toBe(7500);
  });
});


