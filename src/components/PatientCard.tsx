import type { MonthlyRecord, Patient, PatientProgressKey } from "../types";
import {
  calculateDaysSinceStart,
  formatDate,
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
          {complete ? <span className="badge">今月完了</span> : null}
          {pastIncompleteCount > 0 ? (
            <span className="badge badge--warning">過去分未完了あり（{pastIncompleteCount}件）</span>
          ) : null}
        </div>

        <div className="patient-card__meta-grid" aria-label="患者情報">
          <div className="meta-pill">
            <span>開始日</span>
            <strong>{formatDate(patient.rehabStartDate)}</strong>
          </div>
          <div className="meta-pill">
            <span>経過日</span>
            <strong>{daysSinceStart}日</strong>
          </div>
        </div>
      </div>

      {currentRecord ? (
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
      ) : (
        <div className="record-missing record-missing--compact">
          <p>未作成</p>
        </div>
      )}

      <label className="memo-field memo-field--compact">
        <span>メモ</span>
        <textarea
          value={patient.memo}
          rows={2}
          placeholder="補足事項"
          onChange={(event) => onUpdateMemo(patient.id, event.target.value)}
        />
      </label>
    </article>
  );
};
