import type { MonthlyRecord, Patient, PatientProgressKey } from "../types";
import { formatDate, formatDateTime, formatMonth } from "../utils/patientUtils";

type HistoryViewProps = {
  patient: Patient;
  records: MonthlyRecord[];
  onBack: () => void;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
};

const progressButtons: Array<{
  key: PatientProgressKey;
  label: string;
}> = [
  { key: "documentCreated", label: "文書作成" },
  { key: "signed", label: "サイン済" },
  { key: "submitted", label: "提出・コスト算定済" }
];

export const HistoryView = ({
  patient,
  records,
  onBack,
  onToggleProgress
}: HistoryViewProps) => (
  <section className="history-view">
    <div className="history-view__header">
      <div>
        <button className="ghost-button history-view__back" type="button" onClick={onBack}>
          一覧に戻る
        </button>
        <h2>{patient.patientName} の履歴</h2>
        <p>
          リハ開始日 {formatDate(patient.rehabStartDate)} ・ 過去月レコードを新しい順に表示
        </p>
      </div>
    </div>

    {records.length === 0 ? (
      <section className="empty-state">
        <h2>過去月レコードはありません</h2>
        <p>今後作成された月次レコードはここで確認できます。</p>
      </section>
    ) : (
      <div className="history-list">
        {records.map((record) => (
          <article key={record.id} className="history-card">
            <div className="history-card__top">
              <div>
                <h3>{formatMonth(record.month)}</h3>
                <p className="history-card__meta">
                  最終更新日時 {formatDateTime(record.updatedAt)}
                </p>
              </div>
              <span className={`history-status ${record.submitted ? "is-complete" : ""}`}>
                {record.documentCreated && record.signed && record.submitted
                  ? "完了"
                  : "未完了"}
              </span>
            </div>

            <div
              className="progress-grid progress-grid--history"
              role="group"
              aria-label={`${patient.patientName} ${record.month} の工程`}
            >
              {progressButtons.map((button) => {
                const active = record[button.key];

                return (
                  <button
                    key={button.key}
                    type="button"
                    className={`progress-toggle ${active ? "is-active" : ""}`}
                    onClick={() => onToggleProgress(patient.id, record.month, button.key)}
                    aria-pressed={active}
                  >
                    <span>{button.label}</span>
                    <strong>{active ? "済" : "未"}</strong>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);
