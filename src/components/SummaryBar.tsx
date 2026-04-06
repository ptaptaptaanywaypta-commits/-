import type { SummaryStats } from "../types";

export type SummaryFilterKey =
  | "incompleteCount"
  | "completeCount"
  | "waitingDocumentCount"
  | "waitingSignCount"
  | "waitingSubmissionCount";

type SummaryBarProps = {
  summary: SummaryStats;
  activeFilter: SummaryFilterKey | null;
  onToggleFilter: (key: SummaryFilterKey) => void;
};

const summaryItems = [
  { key: "incompleteCount", label: "今月未完了", caption: "優先確認", tone: "primary" },
  { key: "completeCount", label: "今月完了", caption: "処理済み", tone: "success" },
  { key: "waitingDocumentCount", label: "文書作成待ち", caption: "初動対応", tone: "neutral" },
  { key: "waitingSignCount", label: "サイン待ち", caption: "確認段階", tone: "neutral" },
  { key: "waitingSubmissionCount", label: "提出/算定待ち", caption: "最終工程", tone: "neutral" }
] as const;

export const SummaryBar = ({ summary, activeFilter, onToggleFilter }: SummaryBarProps) => (
  <section className="summary-grid" aria-label="集計">
    {summaryItems.map((item) => (
      <button
        key={item.key}
        type="button"
        className={`summary-card summary-card--${item.tone} ${
          activeFilter === item.key ? "is-active" : ""
        }`}
        onClick={() => onToggleFilter(item.key)}
        aria-pressed={activeFilter === item.key}
      >
        <span className="summary-card__caption">{item.caption}</span>
        <p>{item.label}</p>
        <strong>{summary[item.key]}件</strong>
      </button>
    ))}
  </section>
);
