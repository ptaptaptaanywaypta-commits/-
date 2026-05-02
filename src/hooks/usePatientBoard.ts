import { useEffect, useState } from "react";
import { samplePatients } from "../data/samplePatients";
import type { Patient, PatientProgressKey } from "../types";
import {
  createEmptyPatient,
  createMonthlyRecord,
  fromCsv,
  getCurrentMonth,
  getRecordByMonth,
  normalizePatients,
  parseImportedPatients,
  sortMonthlyRecords,
  sortPatients,
  updateProgressField
} from "../utils/patientUtils";

const STORAGE_KEY = "pt-plan-progress-mini-board";

const createInitialPatients = () => normalizePatients(sortPatients(samplePatients));

export const usePatientBoard = () => {
  const currentMonth = getCurrentMonth();
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createInitialPatients();
    }

    try {
      const parsed = JSON.parse(saved) as unknown;
      const imported = parseImportedPatients(parsed);
      return imported ?? createInitialPatients();
    } catch {
      return createInitialPatients();
    }
  });

  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const addPatient = (input: ReturnType<typeof createEmptyPatient>) => {
    const id = crypto.randomUUID();

    setPatients((current) => {
      const nextSortOrder =
        current.length > 0
          ? Math.min(...current.map((patient) => patient.sortOrder ?? 0)) - 1
          : 0;
      const nextPatient: Patient = {
        id,
        sortOrder: nextSortOrder,
        ...input,
        monthlyRecords: [createMonthlyRecord(currentMonth)]
      };

      return [nextPatient, ...current];
    });

    return id;
  };

  const toggleProgress = (patientId: string, month: string, key: PatientProgressKey) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              monthlyRecords: sortMonthlyRecords(
                patient.monthlyRecords.map((record) =>
                  record.month === month ? updateProgressField(record, key) : record
                )
              )
            }
          : patient
      )
    );
  };

  const createMonthlyRecordForPatient = (patientId: string, month = currentMonth) => {
    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== patientId || getRecordByMonth(patient, month)) {
          return patient;
        }

        return {
          ...patient,
          monthlyRecords: sortMonthlyRecords([
            ...patient.monthlyRecords,
            createMonthlyRecord(month)
          ])
        };
      })
    );
  };

  const createMonthlyRecordsForPatients = (patientIds: string[], month = currentMonth) => {
    const targetIds = new Set(patientIds);

    setPatients((current) =>
      current.map((patient) => {
        if (!targetIds.has(patient.id) || getRecordByMonth(patient, month)) {
          return patient;
        }

        return {
          ...patient,
          monthlyRecords: sortMonthlyRecords([
            ...patient.monthlyRecords,
            createMonthlyRecord(month)
          ])
        };
      })
    );
  };

  const createMonthlyRecordsForAll = (month = currentMonth) => {
    setPatients((current) =>
      current.map((patient) =>
        getRecordByMonth(patient, month)
          ? patient
          : {
              ...patient,
              monthlyRecords: sortMonthlyRecords([
                ...patient.monthlyRecords,
                createMonthlyRecord(month)
              ])
            }
      )
    );
  };

  const updateMemo = (id: string, memo: string) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === id
          ? {
              ...patient,
              memo
            }
          : patient
      )
    );
  };

  const updatePatientDetails = (
    id: string,
    updates: Pick<Patient, "patientName" | "rehabStartDate">
  ) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === id
          ? {
              ...patient,
              ...updates
            }
          : patient
      )
    );
  };

  const deleteMonthlyRecordsByMonth = (month: string) => {
    setPatients((current) =>
      current.map((patient) => ({
        ...patient,
        monthlyRecords: patient.monthlyRecords.filter((record) => record.month !== month)
      }))
    );
  };

  const deletePatient = (id: string) => {
    setPatients((current) => current.filter((patient) => patient.id !== id));
  };

  const importFromCsv = (csvText: string) => {
    const imported = fromCsv(csvText);
    setPatients(imported);
  };

  const restoreSamples = () => {
    setPatients(createInitialPatients());
  };

  return {
    currentMonth,
    patients,
    showIncompleteOnly,
    setShowIncompleteOnly,
    addPatient,
    toggleProgress,
    createMonthlyRecordForPatient,
    createMonthlyRecordsForPatients,
    createMonthlyRecordsForAll,
    updateMemo,
    updatePatientDetails,
    deleteMonthlyRecordsByMonth,
    deletePatient,
    importFromCsv,
    restoreSamples
  };
};
