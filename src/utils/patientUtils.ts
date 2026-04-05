import type { MonthlyRecord, Patient, PatientProgressKey, SummaryStats } from "../types";

type LegacyPatientRecord = {
  id: string;
  patientName: string;
  rehabStartDate: string;
  documentCreated: boolean;
  signed: boolean;
  submitted: boolean;
  memo: string;
  updatedAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const monthFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long"
});

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

export const getCurrentMonth = () =>
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

export const createMonthlyRecord = (month = getCurrentMonth()): MonthlyRecord => ({
  id: crypto.randomUUID(),
  month,
  documentCreated: false,
  signed: false,
  submitted: false,
  updatedAt: new Date().toISOString()
});

export const isMonthlyRecordComplete = (record: MonthlyRecord): boolean =>
  record.documentCreated && record.signed && record.submitted;

export const getRecordByMonth = (
  patient: Patient,
  month: string
): MonthlyRecord | undefined => patient.monthlyRecords.find((record) => record.month === month);

export const getPastIncompleteCount = (
  patient: Patient,
  currentMonth = getCurrentMonth()
): number =>
  patient.monthlyRecords.filter(
    (record) => record.month < currentMonth && !isMonthlyRecordComplete(record)
  ).length;

export const sortMonthlyRecords = (records: MonthlyRecord[]): MonthlyRecord[] =>
  [...records].sort((a, b) => {
    const monthCompare = b.month.localeCompare(a.month);

    if (monthCompare !== 0) {
      return monthCompare;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

export const sortPatients = (
  patients: Patient[],
  currentMonth = getCurrentMonth()
): Patient[] =>
  [...patients].sort((a, b) => {
    const aCurrent = getRecordByMonth(a, currentMonth);
    const bCurrent = getRecordByMonth(b, currentMonth);
    const aComplete = aCurrent ? isMonthlyRecordComplete(aCurrent) : false;
    const bComplete = bCurrent ? isMonthlyRecordComplete(bCurrent) : false;

    if (aComplete !== bComplete) {
      return Number(aComplete) - Number(bComplete);
    }

    const dateCompare =
      new Date(a.rehabStartDate).getTime() - new Date(b.rehabStartDate).getTime();

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const aUpdated = aCurrent?.updatedAt ?? "";
    const bUpdated = bCurrent?.updatedAt ?? "";
    return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
  });

export const getAvailableMonths = (
  patients: Patient[],
  fallbackMonth = getCurrentMonth()
): string[] => {
  const monthSet = new Set<string>([fallbackMonth]);

  patients.forEach((patient) => {
    patient.monthlyRecords.forEach((record) => {
      monthSet.add(record.month);
    });
  });

  return [...monthSet].sort((a, b) => b.localeCompare(a));
};

export const calculateDaysSinceStart = (rehabStartDate: string): number => {
  const start = new Date(rehabStartDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
};

export const formatDate = (value: string): string => dateFormatter.format(new Date(value));

export const formatMonth = (value: string): string => {
  const [year, month] = value.split("-").map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
};

export const formatDateTime = (value: string): string =>
  dateTimeFormatter.format(new Date(value));

export const createEmptyPatient = (): Omit<Patient, "id" | "monthlyRecords"> => ({
  patientName: "",
  rehabStartDate: new Date().toISOString().slice(0, 10),
  memo: ""
});

export const updateProgressField = (
  record: MonthlyRecord,
  key: PatientProgressKey
): MonthlyRecord => ({
  ...record,
  [key]: !record[key],
  updatedAt: new Date().toISOString()
});

export const buildSummaryStats = (
  patients: Patient[],
  currentMonth = getCurrentMonth()
): SummaryStats => {
  const currentRecords = patients.map((patient) => getRecordByMonth(patient, currentMonth));

  return {
    incompleteCount: currentRecords.filter(
      (record) => !record || !isMonthlyRecordComplete(record)
    ).length,
    completeCount: currentRecords.filter(
      (record): record is MonthlyRecord => Boolean(record && isMonthlyRecordComplete(record))
    ).length,
    waitingDocumentCount: currentRecords.filter(
      (record) => !record || !record.documentCreated
    ).length,
    waitingSignCount: currentRecords.filter(
      (record) => Boolean(record?.documentCreated && !record.signed)
    ).length,
    waitingSubmissionCount: currentRecords.filter(
      (record) => Boolean(record?.signed && !record.submitted)
    ).length
  };
};

const isMonthlyRecord = (value: unknown): value is MonthlyRecord =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as MonthlyRecord).id === "string" &&
  typeof (value as MonthlyRecord).month === "string" &&
  typeof (value as MonthlyRecord).documentCreated === "boolean" &&
  typeof (value as MonthlyRecord).signed === "boolean" &&
  typeof (value as MonthlyRecord).submitted === "boolean" &&
  typeof (value as MonthlyRecord).updatedAt === "string";

const isPatient = (value: unknown): value is Patient =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Patient).id === "string" &&
  typeof (value as Patient).patientName === "string" &&
  typeof (value as Patient).rehabStartDate === "string" &&
  typeof (value as Patient).memo === "string" &&
  Array.isArray((value as Patient).monthlyRecords) &&
  (value as Patient).monthlyRecords.every(isMonthlyRecord);

const isLegacyPatientRecord = (value: unknown): value is LegacyPatientRecord =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as LegacyPatientRecord).id === "string" &&
  typeof (value as LegacyPatientRecord).patientName === "string" &&
  typeof (value as LegacyPatientRecord).rehabStartDate === "string" &&
  typeof (value as LegacyPatientRecord).documentCreated === "boolean" &&
  typeof (value as LegacyPatientRecord).signed === "boolean" &&
  typeof (value as LegacyPatientRecord).submitted === "boolean" &&
  typeof (value as LegacyPatientRecord).memo === "string" &&
  typeof (value as LegacyPatientRecord).updatedAt === "string";

const migrateLegacyPatient = (
  legacyPatient: LegacyPatientRecord,
  currentMonth = getCurrentMonth()
): Patient => ({
  id: legacyPatient.id,
  patientName: legacyPatient.patientName,
  rehabStartDate: legacyPatient.rehabStartDate,
  memo: legacyPatient.memo,
  monthlyRecords: sortMonthlyRecords([
    {
      id: `${legacyPatient.id}-${currentMonth}`,
      month: currentMonth,
      documentCreated: legacyPatient.documentCreated,
      signed: legacyPatient.signed,
      submitted: legacyPatient.submitted,
      updatedAt: legacyPatient.updatedAt
    }
  ])
});

export const parseImportedPatients = (raw: unknown): Patient[] | null => {
  if (!Array.isArray(raw)) {
    return null;
  }

  if (raw.every(isPatient)) {
    return sortPatients(
      raw.map((patient) => ({
        ...patient,
        monthlyRecords: sortMonthlyRecords(patient.monthlyRecords)
      }))
    );
  }

  if (raw.every(isLegacyPatientRecord)) {
    return sortPatients(raw.map((patient) => migrateLegacyPatient(patient)));
  }

  return null;
};

export const toCsv = (patients: Patient[]): string => {
  const headers = [
    "patientId",
    "patientName",
    "rehabStartDate",
    "memo",
    "recordId",
    "month",
    "documentCreated",
    "signed",
    "submitted",
    "updatedAt"
  ];

  const escapeCell = (value: string): string => `"${value.split('"').join('""')}"`;

  const lines = patients.flatMap((patient) =>
    sortMonthlyRecords(patient.monthlyRecords).map((record) =>
      [
        patient.id,
        patient.patientName,
        patient.rehabStartDate,
        patient.memo,
        record.id,
        record.month,
        String(record.documentCreated),
        String(record.signed),
        String(record.submitted),
        record.updatedAt
      ]
        .map((value) => escapeCell(value))
        .join(",")
    )
  );

  return [headers.map(escapeCell).join(","), ...lines].join("\n");
};

export const fromCsv = (csvText: string): Patient[] => {
  const rows = parseCsvRows(csvText);

  if (rows.length < 2) {
    throw new Error("CSV にデータ行がありません。");
  }

  const [header, ...dataRows] = rows;

  if (header.length >= 10 && header[0] === "patientId") {
    const grouped = new Map<string, Patient>();

    dataRows
      .filter((row) => row.some((cell) => cell.trim() !== ""))
      .forEach((row, index) => {
        if (row.length < 10) {
          throw new Error(`${index + 2} 行目の列数が不足しています。`);
        }

        const patientId = row[0] || crypto.randomUUID();
        const existing = grouped.get(patientId);
        const nextRecord: MonthlyRecord = {
          id: row[4] || crypto.randomUUID(),
          month: row[5],
          documentCreated: row[6].toLowerCase() === "true",
          signed: row[7].toLowerCase() === "true",
          submitted: row[8].toLowerCase() === "true",
          updatedAt: row[9] || new Date().toISOString()
        };

        if (existing) {
          existing.monthlyRecords = sortMonthlyRecords([
            ...existing.monthlyRecords.filter((record) => record.month !== nextRecord.month),
            nextRecord
          ]);
          return;
        }

        grouped.set(patientId, {
          id: patientId,
          patientName: row[1],
          rehabStartDate: row[2],
          memo: row[3],
          monthlyRecords: [nextRecord]
        });
      });

    return sortPatients(Array.from(grouped.values()));
  }

  const patients = dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row, index) => {
      if (row.length < 8) {
        throw new Error(`${index + 2} 行目の列数が不足しています。`);
      }

      return migrateLegacyPatient({
        id: row[0] || crypto.randomUUID(),
        patientName: row[1],
        rehabStartDate: row[2],
        documentCreated: row[3].toLowerCase() === "true",
        signed: row[4].toLowerCase() === "true",
        submitted: row[5].toLowerCase() === "true",
        memo: row[6],
        updatedAt: row[7] || new Date().toISOString()
      });
    });

  return sortPatients(patients);
};

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};
