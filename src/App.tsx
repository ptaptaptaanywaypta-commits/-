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
  const { currentMonth, patients, addPatient, toggleProgress, createMonthlyRecordsForAll, updateMemo, deletePatient } =
    usePatientBoard();
  const [message, setMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window === "undefined") {
      return currentMonth;
    }

    return window.localStorage.getItem(SELECTED_MONTH_STORAGE_KEY) ?? currentMonth;
  });
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SummaryFilterKey | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);

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
    }, 3000);
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

  return (
    <div className="app-shell">
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
          <div>
            <h1>計画書進捗ボード</h1>
            <p className="hero__description">進捗を分かりやすく管理</p>
          </div>
        </div>
        <div className="hero__status">
          <strong>{formatMonth(selectedMonth)}</strong>
          <span>{selectedMonth === currentMonth ? "今月を表示中" : "月ページを表示中"}</span>
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
              <h2>月ページ</h2>
              <p>新しい月から表示</p>
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
                  <span>{formatMonth(month)}</span>
                  {month === currentMonth ? <strong>今月</strong> : null}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <SummaryBar summary={summary} activeFilter={activeFilter} onToggleFilter={handleToggleFilter} />

      <div className="layout-grid">
        <div className="layout-grid__side">
          <AddPatientForm onAddPatient={addPatient} />
        </div>

        <main className="layout-grid__main">
          <div className="board-header board-header--month-page">
            <div>
              <div className="board-header__title-row">
                <h2>{formatMonth(selectedMonth)}</h2>
                <span className="selected-month-badge">
                  {selectedMonth === currentMonth ? "現在選択中の月" : "選択中の月"}
                </span>
                {activeFilter ? <span className="selected-month-badge selected-month-badge--filter">フィルタ中</span> : null}
              </div>
              <p>表示中 {visiblePatients.length}件 / 全体 {patients.length}件</p>
            </div>

            <div className="board-header__actions">
              {message ? (
                <p className="status-message" role="status">
                  {message}
                </p>
              ) : null}
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
