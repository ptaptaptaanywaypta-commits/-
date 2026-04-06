import type { Patient, PatientProgressKey } from "../types";
import { getPastIncompleteCount, getRecordByMonth } from "../utils/patientUtils";
import { PatientCard } from "./PatientCard";

type PatientBoardProps = {
  patients: Patient[];
  selectedMonth: string;
  currentMonth: string;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onDeletePatient: (id: string) => void;
};

export const PatientBoard = ({
  patients,
  selectedMonth,
  currentMonth,
  onToggleProgress,
  onUpdateMemo,
  onDeletePatient
}: PatientBoardProps) => {
  if (patients.length === 0) {
    return (
      <section className="empty-state">
        <p className="empty-state__eyebrow">No Matching Patients</p>
        <h2>表示できる患者がいません</h2>
        <p>月を切り替えるか、フィルタを解除してください。</p>
      </section>
    );
  }

  return (
    <section className="card-list">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          currentRecord={getRecordByMonth(patient, selectedMonth)}
          selectedMonth={selectedMonth}
          pastIncompleteCount={getPastIncompleteCount(patient, currentMonth)}
          onToggleProgress={onToggleProgress}
          onUpdateMemo={onUpdateMemo}
          onDeletePatient={onDeletePatient}
        />
      ))}
    </section>
  );
};
