import { useMemo, useRef, useState } from "react";
import { AddPatientForm } from "./components/AddPatientForm";
import { PatientBoard } from "./components/PatientBoard";
import { SummaryBar } from "./components/SummaryBar";
import { Toolbar } from "./components/Toolbar";
import { usePatientBoard } from "./hooks/usePatientBoard";
import {
  buildSummaryStats,
  formatMonth,
  getAvailableMonths,
  getRecordByMonth,
  sortPatients,
  toCsv
} from "./utils/patientUtils";

const App = () => {
  const {
    currentMonth,
    patients,
    showIncompleteOnly,
    setShowIncompleteOnly,
    addPatient,
    toggleProgress,
    createMonthlyRecordsForAll,
    updateMemo,
    deletePatient,
    importFromCsv,
    restoreSamples
  } = usePatientBoard();
  const [message, setMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const messageTimeoutRef = useRef<number | null>(null);

  const months = useMemo(() => getAvailableMonths(patients, currentMonth), [currentMonth, patients]);

  const visiblePatients = useMemo(() => {
    const sorted = sortPatients(patients, selectedMonth);

    return showIncompleteOnly
      ? sorted.filter((patient) => {
          const record = getRecordByMonth(patient, selectedMonth);
          return !record || !(record.documentCreated && record.signed && record.submitted);
        })
      : sorted;
  }, [patients, selectedMonth, showIncompleteOnly]);

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

  const handleExportCsv = () => {
    const csv = toCsv(patients);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `plan-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("CSVを書き出しました。");
  };

  const handleImportCsv = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      importFromCsv(text);
      setSelectedMonth(currentMonth);
      showMessage("CSVを読み込みました。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "CSVの読み込みに失敗しました。");
    }
  };

  const handleRestoreSamples = () => {
    restoreSamples();
    setSelectedMonth(currentMonth);
    showMessage("サンプルデータを復元しました。");
  };

  const handleCreateCurrentMonthForAll = () => {
    const createdCount = patients.filter(
      (patient) => !patient.monthlyRecords.some((record) => record.month === currentMonth)
    ).length;

    createMonthlyRecordsForAll(currentMonth);
    showMessage(
      createdCount > 0
        ? `今月分を ${createdCount} 件作成しました。`
        : "すべての患者に今月分レコードがあります。"
    );
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    setIsMonthMenuOpen(false);
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

      <SummaryBar summary={summary} />

      <div className="layout-grid">
        <div className="layout-grid__side">
          <AddPatientForm onAddPatient={addPatient} />
          <Toolbar
            showIncompleteOnly={showIncompleteOnly}
            onToggleIncompleteOnly={setShowIncompleteOnly}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
            onRestoreSamples={handleRestoreSamples}
          />
        </div>

        <main className="layout-grid__main">
          <div className="board-header board-header--month-page">
            <div>
              <div className="board-header__title-row">
                <h2>{formatMonth(selectedMonth)}</h2>
                <span className="selected-month-badge">
                  {selectedMonth === currentMonth ? "現在選択中の月" : "選択中の月"}
                </span>
              </div>
              <p>表示中 {visiblePatients.length}件 / 全体 {patients.length}件</p>
            </div>

            <div className="board-header__actions">
              {selectedMonth === currentMonth ? (
                <button className="primary-button board-header__bulk-button" type="button" onClick={handleCreateCurrentMonthForAll}>
                  今月分を一括作成
                </button>
              ) : null}
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
