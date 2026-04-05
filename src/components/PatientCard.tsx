import type { MonthlyRecord, Patient, PatientProgressKey } from "../types";
import {
  calculateDaysSinceStart,
  formatDate,
  formatDateTime,
  formatMonth,
  isMonthlyRecordComplete
} from "../utils/patientUtils";

type PatientCardProps = {
  patient: Patient;
  currentRecord?: MonthlyRecord;
  selectedMonth: string;
  pastIncompleteCount: number;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onDeletePatient: (id: string) => void;
};

const progressButtons: Array<{
  key: PatientProgressKey;
  label: string;
}> = [
  { key: "documentCreated", label: "文書作成" },
  { key: "signed", label: "サイン済" },
  { key: "submitted", label: "提出/算定済" }
];

export const PatientCard = ({
  patient,
  currentRecord,
  selectedMonth,
  pastIncompleteCount,
  onToggleProgress,
  onUpdateMemo,
  onDeletePatient
}: PatientCardProps) => {
  const complete = currentRecord ? isMonthlyRecordComplete(currentRecord) : false;
  const daysSinceStart = calculateDaysSinceStart(patient.rehabStartDate);

  return (
    <article
      className={[
        "patient-card",
        complete ? "patient-card--complete" : "",
        pastIncompleteCount > 0 ? "patient-card--warning" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        className="delete-button delete-button--compact"
        type="button"
        onClick={() => onDeletePatient(patient.id)}
        aria-label={`${patient.patientName} を削除`}
      >
        削除
      </button>

      <div className="patient-card__header">
        <div className="patient-card__title-row">
          <h3>{patient.patientName}</h3>
          {complete ? <span className="badge">完了</span> : null}
          {pastIncompleteCount > 0 ? (
            <span className="badge badge--warning">過去分未完了あり</span>
          ) : null}
        </div>
        <p className="patient-card__meta">
          {formatMonth(selectedMonth)} ・ 開始 {formatDate(patient.rehabStartDate)} ・ {daysSinceStart}日
        </p>
      </div>

      {currentRecord ? (
        <>
          <div
            className="progress-grid progress-grid--compact"
            role="group"
            aria-label={`${patient.patientName} の工程`}
          >
            {progressButtons.map((button) => {
              const active = currentRecord[button.key];

              return (
                <button
                  key={button.key}
                  type="button"
                  className={`progress-toggle progress-toggle--compact ${active ? "is-active" : ""}`}
                  onClick={() => onToggleProgress(patient.id, currentRecord.month, button.key)}
                  aria-pressed={active}
                >
                  <span>{button.label}</span>
                  <strong>{active ? "済" : "未"}</strong>
                </button>
              );
            })}
          </div>

          <p className="patient-card__updated">更新 {formatDateTime(currentRecord.updatedAt)}</p>
        </>
      ) : (
        <div className="record-missing record-missing--compact">
          <p>{formatMonth(selectedMonth)} のレコードは未作成です。</p>
        </div>
      )}

      <label className="memo-field memo-field--compact">
        <span>メモ</span>
        <textarea
          value={patient.memo}
          rows={1}
          placeholder="必要時のみメモ"
          onChange={(event) => onUpdateMemo(patient.id, event.target.value)}
        />
      </label>
    </article>
  );
};
