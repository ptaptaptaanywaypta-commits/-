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
  { key: "incompleteCount", label: "今月未完了", tone: "primary" },
  { key: "completeCount", label: "今月完了", tone: "success" },
  { key: "waitingDocumentCount", label: "文書作成待ち", tone: "neutral" },
  { key: "waitingSignCount", label: "サイン待ち", tone: "neutral" },
  { key: "waitingSubmissionCount", label: "提出/算定待ち", tone: "neutral" }
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
        <p>{item.label}</p>
        <strong>{summary[item.key]}件</strong>
      </button>
    ))}
  </section>
);
