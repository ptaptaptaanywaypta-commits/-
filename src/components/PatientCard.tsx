import type { MonthlyRecord, Patient, PatientProgressKey } from "../types";
import {
  calculateDaysSinceStart,
  formatDate,
  formatDateTime,
  isMonthlyRecordComplete
} from "../utils/patientUtils";

type PatientCardProps = {
  patient: Patient;
  currentRecord?: MonthlyRecord;
  pastIncompleteCount: number;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
  onCreateCurrentMonth: (patientId: string) => void;
  onShowHistory: (patientId: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onDeletePatient: (id: string) => void;
};

const progressButtons: Array<{
  key: PatientProgressKey;
  label: string;
}> = [
  { key: "documentCreated", label: "文書作成" },
  { key: "signed", label: "サイン済" },
  { key: "submitted", label: "提出・コスト算定済" }
];

export const PatientCard = ({
  patient,
  currentRecord,
  pastIncompleteCount,
  onToggleProgress,
  onCreateCurrentMonth,
  onShowHistory,
  onUpdateMemo,
  onDeletePatient
}: PatientCardProps) => {
  const complete = currentRecord ? isMonthlyRecordComplete(currentRecord) : false;
  const daysSinceStart = calculateDaysSinceStart(patient.rehabStartDate);
  const warningText = `過去分未完了あり（${pastIncompleteCount}件）`;

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
      <div className="patient-card__header">
        <div>
          <div className="patient-card__title-row">
            <h3>{patient.patientName}</h3>
            {complete ? <span className="badge">今月完了</span> : null}
            {pastIncompleteCount > 0 ? (
              <span className="badge badge--warning">{warningText}</span>
            ) : null}
          </div>
          <p className="patient-card__meta">
            リハ開始日 {formatDate(patient.rehabStartDate)} ・ 経過 {daysSinceStart}日
          </p>
        </div>

        <button
          className="delete-button"
          type="button"
          onClick={() => onDeletePatient(patient.id)}
          aria-label={`${patient.patientName} を削除`}
        >
          削除
        </button>
      </div>

      {currentRecord ? (
        <>
          <div
            className="progress-grid"
            role="group"
            aria-label={`${patient.patientName} の今月工程`}
          >
            {progressButtons.map((button) => {
              const active = currentRecord[button.key];

              return (
                <button
                  key={button.key}
                  type="button"
                  className={`progress-toggle ${active ? "is-active" : ""}`}
                  onClick={() => onToggleProgress(patient.id, currentRecord.month, button.key)}
                  aria-pressed={active}
                >
                  <span>{button.label}</span>
                  <strong>{active ? "済" : "未"}</strong>
                </button>
              );
            })}
          </div>

          <p className="patient-card__updated">
            最終更新日時 {formatDateTime(currentRecord.updatedAt)}
          </p>
        </>
      ) : (
        <div className="record-missing">
          <p>今月分の月次レコードはまだありません。</p>
        </div>
      )}

      <label className="memo-field">
        <span>メモ</span>
        <textarea
          value={patient.memo}
          rows={2}
          placeholder="必要に応じてメモを残す"
          onChange={(event) => onUpdateMemo(patient.id, event.target.value)}
        />
      </label>

      <div className="patient-card__footer">
        <button
          className="secondary-button patient-card__footer-button"
          type="button"
          onClick={() => onCreateCurrentMonth(patient.id)}
        >
          今月分を作成
        </button>
        <button
          className="ghost-button patient-card__footer-button"
          type="button"
          onClick={() => onShowHistory(patient.id)}
        >
          履歴を見る
        </button>
      </div>
    </article>
  );
};
