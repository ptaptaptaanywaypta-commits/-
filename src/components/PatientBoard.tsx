import type { Patient, PatientProgressKey } from "../types";
import { getPastIncompleteCount, getRecordByMonth } from "../utils/patientUtils";
import { PatientCard } from "./PatientCard";

type PatientBoardProps = {
  patients: Patient[];
  currentMonth: string;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
  onCreateCurrentMonth: (patientId: string) => void;
  onShowHistory: (patientId: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onDeletePatient: (id: string) => void;
};

export const PatientBoard = ({
  patients,
  currentMonth,
  onToggleProgress,
  onCreateCurrentMonth,
  onShowHistory,
  onUpdateMemo,
  onDeletePatient
}: PatientBoardProps) => {
  if (patients.length === 0) {
    return (
      <section className="empty-state">
        <h2>表示できる患者がいません</h2>
        <p>絞り込みを解除するか、患者を追加してください。</p>
      </section>
    );
  }

  return (
    <section className="card-list">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          currentRecord={getRecordByMonth(patient, currentMonth)}
          pastIncompleteCount={getPastIncompleteCount(patient, currentMonth)}
          onToggleProgress={onToggleProgress}
          onCreateCurrentMonth={onCreateCurrentMonth}
          onShowHistory={onShowHistory}
          onUpdateMemo={onUpdateMemo}
          onDeletePatient={onDeletePatient}
        />
      ))}
    </section>
  );
};
