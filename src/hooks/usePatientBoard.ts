import { useEffect, useState } from "react";
import { samplePatients } from "../data/samplePatients";
import type { Patient, PatientProgressKey } from "../types";
import {
  createEmptyPatient,
  createMonthlyRecord,
  fromCsv,
  getCurrentMonth,
  getRecordByMonth,
  parseImportedPatients,
  sortPatients,
  sortMonthlyRecords,
  updateProgressField
} from "../utils/patientUtils";

const STORAGE_KEY = "pt-plan-progress-mini-board";

export const usePatientBoard = () => {
  const currentMonth = getCurrentMonth();
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return sortPatients(samplePatients, currentMonth);
    }

    try {
      const parsed = JSON.parse(saved) as unknown;
      const imported = parseImportedPatients(parsed);
      return imported ?? sortPatients(samplePatients, currentMonth);
    } catch {
      return sortPatients(samplePatients, currentMonth);
    }
  });

  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const addPatient = (input: ReturnType<typeof createEmptyPatient>) => {
    const nextPatient: Patient = {
      id: crypto.randomUUID(),
      ...input,
      monthlyRecords: [createMonthlyRecord(currentMonth)]
    };

    setPatients((current) => sortPatients([nextPatient, ...current], currentMonth));
  };

  const toggleProgress = (patientId: string, month: string, key: PatientProgressKey) => {
    setPatients((current) =>
      sortPatients(
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
        ),
        month
      )
    );
  };

  const createMonthlyRecordForPatient = (patientId: string, month = currentMonth) => {
    setPatients((current) =>
      sortPatients(
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
        }),
        month
      )
    );
  };

  const createMonthlyRecordsForAll = (month = currentMonth) => {
    setPatients((current) =>
      sortPatients(
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
        ),
        month
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

  const deletePatient = (id: string) => {
    setPatients((current) => current.filter((patient) => patient.id !== id));
  };

  const importFromCsv = (csvText: string) => {
    const imported = fromCsv(csvText);
    setPatients(sortPatients(imported, currentMonth));
  };

  const restoreSamples = () => {
    setPatients(sortPatients(samplePatients, currentMonth));
  };

  return {
    currentMonth,
    patients,
    showIncompleteOnly,
    setShowIncompleteOnly,
    addPatient,
    toggleProgress,
    createMonthlyRecordForPatient,
    createMonthlyRecordsForAll,
    updateMemo,
    deletePatient,
    importFromCsv,
    restoreSamples
  };
};
