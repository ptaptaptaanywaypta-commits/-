import type { SummaryStats } from "../types";

type SummaryBarProps = {
  summary: SummaryStats;
};

const summaryItems = [
  { key: "incompleteCount", label: "今月未完了", tone: "primary" },
  { key: "completeCount", label: "今月完了", tone: "success" },
  { key: "waitingDocumentCount", label: "文書作成待ち", tone: "neutral" },
  { key: "waitingSignCount", label: "サイン待ち", tone: "neutral" },
  { key: "waitingSubmissionCount", label: "提出待ち", tone: "neutral" }
] as const;

export const SummaryBar = ({ summary }: SummaryBarProps) => (
  <section className="summary-grid" aria-label="集計">
    {summaryItems.map((item) => (
      <article key={item.key} className={`summary-card summary-card--${item.tone}`}>
        <p>{item.label}</p>
        <strong>{summary[item.key]}件</strong>
      </article>
    ))}
  </section>
);
