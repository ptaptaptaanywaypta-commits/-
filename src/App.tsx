import { useEffect, useMemo, useRef, useState } from "react";
import { AddPatientForm } from "./components/AddPatientForm";
import { PatientBoard } from "./components/PatientBoard";
import { SummaryBar, type SummaryFilterKey } from "./components/SummaryBar";
import { usePatientBoard } from "./hooks/usePatientBoard";
import {
  buildSummaryStats,
  formatMonth,
  getAvailableMonths,
  getRecordByMonth,
  isMonthlyRecordComplete,
  shiftMonth,
  sortPatients
} from "./utils/patientUtils";

const SELECTED_MONTH_STORAGE_KEY = "selected-month-page";

const App = () => {
  const {
    currentMonth,
    patients,
    addPatient,
    toggleProgress,
    createMonthlyRecordsForAll,
    updateMemo,
    deletePatient
  } = usePatientBoard();
  const [message, setMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window === "undefined") {
      return currentMonth;
    }

    return window.localStorage.getItem(SELECTED_MONTH_STORAGE_KEY) ?? currentMonth;
  });
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SummaryFilterKey | null>(null);
  const [isAddFeedbackVisible, setIsAddFeedbackVisible] = useState(false);
  const messageTimeoutRef = useRef<number | null>(null);
  const addFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  const nextMonth = useMemo(() => shiftMonth(currentMonth, 1), [currentMonth]);
  const months = useMemo(() => getAvailableMonths(patients, currentMonth), [currentMonth, patients]);

  const visiblePatients = useMemo(() => {
    const sorted = sortPatients(patients, selectedMonth);

    return sorted.filter((patient) => {
      const record = getRecordByMonth(patient, selectedMonth);

      if (!activeFilter) {
        return true;
      }

      switch (activeFilter) {
        case "incompleteCount":
          return !record || !isMonthlyRecordComplete(record);
        case "completeCount":
          return Boolean(record && isMonthlyRecordComplete(record));
        case "waitingDocumentCount":
          return !record || !record.documentCreated;
        case "waitingSignCount":
          return Boolean(record?.documentCreated && !record.signed);
        case "waitingSubmissionCount":
          return Boolean(record?.signed && !record.submitted);
        default:
          return true;
      }
    });
  }, [activeFilter, patients, selectedMonth]);

  const summary = useMemo(
    () => buildSummaryStats(patients, selectedMonth),
    [patients, selectedMonth]
  );

  const showMessage = (nextMessage: string) => {
    setMessage(nextMessage);

    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage("");
      messageTimeoutRef.current = null;
    }, 2800);
  };

  const handleCreateNextMonthForAll = () => {
    const createdCount = patients.filter(
      (patient) => !patient.monthlyRecords.some((record) => record.month === nextMonth)
    ).length;

    createMonthlyRecordsForAll(nextMonth);
    showMessage(
      createdCount > 0
        ? `来月分を ${createdCount} 件作成しました。`
        : "すべての患者に来月分レコードがあります。"
    );
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    setActiveFilter(null);
    setIsMonthMenuOpen(false);
  };

  const handleToggleFilter = (key: SummaryFilterKey) => {
    setActiveFilter((current) => (current === key ? null : key));
  };

  const handleAddPatient = (input: Parameters<typeof addPatient>[0]) => {
    const id = addPatient(input);

    if (addFeedbackTimeoutRef.current) {
      window.clearTimeout(addFeedbackTimeoutRef.current);
    }

    setIsAddFeedbackVisible(false);
    window.requestAnimationFrame(() => {
      setIsAddFeedbackVisible(true);
      addFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsAddFeedbackVisible(false);
        addFeedbackTimeoutRef.current = null;
      }, 220);
    });

    showMessage("患者を追加しました。");
    return id;
  };

  return (
    <div className={`app-shell ${isAddFeedbackVisible ? "app-shell--added" : ""}`}>
      <div className="app-shell__backdrop" aria-hidden="true" />

      <header className="hero">
        <div className="hero__main">
          <button
            className="menu-button"
            type="button"
            onClick={() => setIsMonthMenuOpen((current) => !current)}
            aria-label="月メニューを開く"
            aria-expanded={isMonthMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="hero__copy">
            <p className="hero__eyebrow">Rehab Planning Workflow</p>
            <h1>計画書進捗ボード</h1>
            <p className="hero__description">現場で迷わず使える、月次の書類進捗ボード</p>
          </div>
        </div>

        <div className="hero__status-card">
          <p className="hero__status-label">Current Page</p>
          <strong>{formatMonth(selectedMonth)}</strong>
          <div className="hero__status-meta">
            <span>{selectedMonth === currentMonth ? "今月を表示中" : "月ページを表示中"}</span>
            <span>{visiblePatients.length}件表示</span>
          </div>
        </div>
      </header>

      {isMonthMenuOpen ? (
        <div className="month-menu-backdrop" onClick={() => setIsMonthMenuOpen(false)}>
          <aside
            className="month-menu"
            onClick={(event) => event.stopPropagation()}
            aria-label="月一覧"
          >
            <div className="month-menu__header">
              <p className="month-menu__eyebrow">Monthly Pages</p>
              <h2>月ページを選択</h2>
              <p>よく使う月へすぐ切り替えられます。</p>
            </div>

            <button className="primary-button month-menu__bulk-button" type="button" onClick={handleCreateNextMonthForAll}>
              来月分を一括作成
            </button>

            <div className="month-menu__list">
              {months.map((month) => (
                <button
                  key={month}
                  type="button"
                  className={`month-menu__item ${month === selectedMonth ? "is-active" : ""}`}
                  onClick={() => handleSelectMonth(month)}
                >
                  <div className="month-menu__item-copy">
                    <span>{formatMonth(month)}</span>
                    <small>{month === currentMonth ? "現在運用中" : "履歴ページ"}</small>
                  </div>
                  {month === currentMonth ? <strong>今月</strong> : null}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <SummaryBar summary={summary} activeFilter={activeFilter} onToggleFilter={handleToggleFilter} />

      <div className="layout-grid">
        <aside className="layout-grid__side">
          <AddPatientForm onAddPatient={handleAddPatient} />
        </aside>

        <main className="layout-grid__main">
          <div className="board-header board-header--month-page">
            <div className="board-header__copy">
              <p className="board-header__eyebrow">Selected Workspace</p>
              <div className="board-header__title-row">
                <h2>{formatMonth(selectedMonth)}</h2>
                <span className="selected-month-badge">
                  {selectedMonth === currentMonth ? "現在選択中の月" : "選択中の月"}
                </span>
                {activeFilter ? (
                  <span className="selected-month-badge selected-month-badge--filter">フィルタ中</span>
                ) : null}
              </div>
              <p className="board-header__description">表示中 {visiblePatients.length}件 / 全体 {patients.length}件</p>
            </div>

            <div className="board-header__actions">
              {message ? (
                <p className="status-message" role="status">
                  {message}
                </p>
              ) : (
                <p className="board-header__hint">上部カードをタップすると条件で絞り込めます。</p>
              )}
            </div>
          </div>

          <PatientBoard
            patients={visiblePatients}
            selectedMonth={selectedMonth}
            currentMonth={currentMonth}
            onToggleProgress={toggleProgress}
            onUpdateMemo={updateMemo}
            onDeletePatient={deletePatient}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
