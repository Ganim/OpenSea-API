import { prisma } from '@/lib/prisma';
import type { PayrollStatus } from '@prisma/generated/client.js';

// Global counter to ensure unique months/years across all tests
let uniqueIdCounter = 0;

export async function createPayroll(data?: {
  referenceMonth?: number;
  referenceYear?: number;
  status?: PayrollStatus;
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
}) {
  let month: number;
  let year: number;

  if (data?.referenceMonth !== undefined && data?.referenceYear !== undefined) {
    // Use provided values but add unique offset to ensure uniqueness across all tests
    const uniqueId = ++uniqueIdCounter;
    month = data.referenceMonth;
    year = data.referenceYear + uniqueId; // Add unique ID to year to ensure uniqueness
  } else {
    // Use random values to ensure uniqueness within valid range (2000-2100)
    const randomSeed = Math.floor(Math.random() * 80);
    month = (randomSeed % 12) + 1;
    year = 2020 + randomSeed; // Start from 2020 to stay within valid range
  }

  return prisma.payroll.create({
    data: {
      referenceMonth: month,
      referenceYear: year,
      status: data?.status ?? 'DRAFT',
      totalGross: data?.totalGross ?? 0,
      totalDeductions: data?.totalDeductions ?? 0,
      totalNet: data?.totalNet ?? 0,
    },
  });
}

export async function createCalculatedPayroll(data?: {
  referenceMonth?: number;
  referenceYear?: number;
}) {
  let month: number;
  let year: number;

  if (data?.referenceMonth !== undefined && data?.referenceYear !== undefined) {
    // Use provided values but add unique offset to ensure uniqueness across all tests
    const uniqueId = ++uniqueIdCounter;
    month = data.referenceMonth;
    year = data.referenceYear + uniqueId; // Add unique ID to year to ensure uniqueness
  } else {
    // Use random values to ensure uniqueness within valid range (2000-2100)
    const randomSeed = Math.floor(Math.random() * 80);
    month = (randomSeed % 12) + 1;
    year = 2020 + randomSeed; // Start from 2020 to stay within valid range
  }

  return prisma.payroll.create({
    data: {
      referenceMonth: month,
      referenceYear: year,
      status: 'CALCULATED',
      totalGross: 5000,
      totalDeductions: 1000,
      totalNet: 4000,
      processedAt: new Date(),
    },
  });
}

export async function createApprovedPayroll(data?: {
  referenceMonth?: number;
  referenceYear?: number;
}) {
  let month: number;
  let year: number;

  if (data?.referenceMonth !== undefined && data?.referenceYear !== undefined) {
    // Use provided values but add unique offset to ensure uniqueness across all tests
    const uniqueId = ++uniqueIdCounter;
    month = data.referenceMonth;
    year = data.referenceYear + uniqueId; // Add unique ID to year to ensure uniqueness
  } else {
    // Use random values to ensure uniqueness within valid range (2000-2100)
    const randomSeed = Math.floor(Math.random() * 80);
    month = (randomSeed % 12) + 1;
    year = 2020 + randomSeed; // Start from 2020 to stay within valid range
  }

  return prisma.payroll.create({
    data: {
      referenceMonth: month,
      referenceYear: year,
      status: 'APPROVED',
      totalGross: 5000,
      totalDeductions: 1000,
      totalNet: 4000,
      processedAt: new Date(),
      approvedAt: new Date(),
    },
  });
}

export function generatePayrollData(data?: {
  referenceMonth?: number;
  referenceYear?: number;
}) {
  return {
    referenceMonth: data?.referenceMonth ?? new Date().getMonth() + 1,
    referenceYear: data?.referenceYear ?? new Date().getFullYear(),
  };
}
