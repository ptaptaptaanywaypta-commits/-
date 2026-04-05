import { useMemo, useRef, useState } from "react";
import { AddPatientForm } from "./components/AddPatientForm";
import { HistoryView } from "./components/HistoryView";
import { PatientBoard } from "./components/PatientBoard";
import { SummaryBar } from "./components/SummaryBar";
import { Toolbar } from "./components/Toolbar";
import { usePatientBoard } from "./hooks/usePatientBoard";
import { sortMonthlyRecords, toCsv } from "./utils/patientUtils";

const App = () => {
  const {
    currentMonth,
    patients,
    visiblePatients,
    summary,
    showIncompleteOnly,
    setShowIncompleteOnly,
    addPatient,
    toggleProgress,
    createMonthlyRecordForPatient,
    updateMemo,
    deletePatient,
    importFromCsv,
    restoreSamples
  } = usePatientBoard();
  const [message, setMessage] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  const historyRecords = useMemo(
    () =>
      selectedPatient
        ? sortMonthlyRecords(
            selectedPatient.monthlyRecords.filter((record) => record.month < currentMonth)
          )
        : [],
    [currentMonth, selectedPatient]
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
      setSelectedPatientId(null);
      showMessage("CSVを読み込みました。");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "CSVの読み込みに失敗しました。");
    }
  };

  const handleRestoreSamples = () => {
    restoreSamples();
    setSelectedPatientId(null);
    showMessage("サンプルデータを復元しました。");
  };

  const handleCreateCurrentMonth = (patientId: string) => {
    const before = patients.find((patient) => patient.id === patientId);
    const alreadyExists = before?.monthlyRecords.some((record) => record.month === currentMonth);

    createMonthlyRecordForPatient(patientId, currentMonth);
    showMessage(alreadyExists ? "今月分はすでに作成済みです。" : "今月分を作成しました。");
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>計画書進捗ボード</h1>
          <p className="hero__description">進捗を分かりやすく管理</p>
        </div>
        <div className="hero__status">
          <strong>{summary.incompleteCount}件が今月未完了</strong>
          <span>{currentMonth} の進捗状況</span>
        </div>
      </header>

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
          <div className="board-header">
            <div>
              <h2>{selectedPatient ? "履歴" : "今月の患者カード"}</h2>
              <p>
                {selectedPatient
                  ? `${selectedPatient.patientName} の過去月レコード`
                  : `表示中 ${visiblePatients.length}件 / 全体 ${patients.length}件`}
              </p>
            </div>
            {message ? (
              <p className="status-message" role="status">
                {message}
              </p>
            ) : null}
          </div>

          {selectedPatient ? (
            <HistoryView
              patient={selectedPatient}
              records={historyRecords}
              onBack={() => setSelectedPatientId(null)}
              onToggleProgress={toggleProgress}
            />
          ) : (
            <PatientBoard
              patients={visiblePatients}
              currentMonth={currentMonth}
              onToggleProgress={toggleProgress}
              onCreateCurrentMonth={handleCreateCurrentMonth}
              onShowHistory={setSelectedPatientId}
              onUpdateMemo={updateMemo}
              onDeletePatient={deletePatient}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
