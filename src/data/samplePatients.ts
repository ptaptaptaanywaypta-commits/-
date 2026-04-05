import type { Patient } from "../types";

const now = new Date().toISOString();

const shiftMonth = (baseMonth: string, offset: number) => {
  const [year, month] = baseMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const currentMonth = `${new Date().getFullYear()}-${String(
  new Date().getMonth() + 1
).padStart(2, "0")}`;

const previousMonth = shiftMonth(currentMonth, -1);
const twoMonthsAgo = shiftMonth(currentMonth, -2);

export const samplePatients: Patient[] = [
  {
    id: "pt-001",
    patientName: "田中 恒一",
    rehabStartDate: "2026-03-10",
    memo: "評価は実施中。家族説明は電話共有予定。",
    monthlyRecords: [
      {
        id: "pt-001-rec-current",
        month: currentMonth,
        documentCreated: false,
        signed: false,
        submitted: false,
        updatedAt: now
      },
      {
        id: "pt-001-rec-prev",
        month: previousMonth,
        documentCreated: true,
        signed: false,
        submitted: false,
        updatedAt: now
      }
    ]
  },
  {
    id: "pt-002",
    patientName: "鈴木 由美",
    rehabStartDate: "2026-03-02",
    memo: "主治医確認待ち。",
    monthlyRecords: [
      {
        id: "pt-002-rec-current",
        month: currentMonth,
        documentCreated: true,
        signed: false,
        submitted: false,
        updatedAt: now
      },
      {
        id: "pt-002-rec-prev",
        month: previousMonth,
        documentCreated: true,
        signed: true,
        submitted: true,
        updatedAt: now
      }
    ]
  },
  {
    id: "pt-003",
    patientName: "山田 恒一",
    rehabStartDate: "2026-02-24",
    memo: "提出タイミングを来週確認。",
    monthlyRecords: [
      {
        id: "pt-003-rec-current",
        month: currentMonth,
        documentCreated: true,
        signed: true,
        submitted: false,
        updatedAt: now
      },
      {
        id: "pt-003-rec-prev",
        month: previousMonth,
        documentCreated: true,
        signed: true,
        submitted: false,
        updatedAt: now
      },
      {
        id: "pt-003-rec-old",
        month: twoMonthsAgo,
        documentCreated: true,
        signed: true,
        submitted: true,
        updatedAt: now
      }
    ]
  },
  {
    id: "pt-004",
    patientName: "高橋 京子",
    rehabStartDate: "2026-02-18",
    memo: "安定運用中。",
    monthlyRecords: [
      {
        id: "pt-004-rec-current",
        month: currentMonth,
        documentCreated: true,
        signed: true,
        submitted: true,
        updatedAt: now
      },
      {
        id: "pt-004-rec-prev",
        month: previousMonth,
        documentCreated: true,
        signed: true,
        submitted: true,
        updatedAt: now
      }
    ]
  }
];
