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
const SWIPE_OPEN_THRESHOLD = 56;
const SWIPE_CLOSE_THRESHOLD = 36;

type NextMonthDecision = "continue" | "discharged";

type NextMonthReviewState = {
  month: string;
  patients: Array<{
    patientId: string;
    patientName: string;
    decision: NextMonthDecision;
  }>;
};

type SwipePoint = {
  x: number;
  y: number;
};

const App = () => {
  const {
    currentMonth,
    patients,
    addPatient,
    toggleProgress,
    createMonthlyRecordsForPatients,
    updateMemo,
    updatePatientDetails,
    deleteMonthlyRecordsByMonth,
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
  const [nextMonthReview, setNextMonthReview] = useState<NextMonthReviewState | null>(null);
  const [deleteRevealMonth, setDeleteRevealMonth] = useState<string | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);
  const addFeedbackTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<SwipePoint | null>(null);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  const nextMonth = useMemo(() => shiftMonth(currentMonth, 1), [currentMonth]);
  const months = useMemo(() => {
    const available = getAvailableMonths(patients);
    return available.length > 0 ? available : [currentMonth];
  }, [currentMonth, patients]);

  useEffect(() => {
    if (months.includes(selectedMonth)) {
      return;
    }

    setSelectedMonth(months[0] ?? currentMonth);
    setActiveFilter(null);
  }, [currentMonth, months, selectedMonth]);

  const visiblePatients = useMemo(() => {
    const sorted = sortPatients(patients);

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

  const reviewTargetCount =
    nextMonthReview?.patients.filter((patient) => patient.decision === "continue").length ?? 0;

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

  const handleOpenNextMonthReview = () => {
    const reviewPatients = sortPatients(patients)
      .filter((patient) => !patient.monthlyRecords.some((record) => record.month === nextMonth))
      .map((patient) => ({
        patientId: patient.id,
        patientName: patient.patientName,
        decision: "continue" as const
      }));

    if (reviewPatients.length === 0) {
      showMessage("すべての患者に来月分レコードがあります。");
      return;
    }

    setNextMonthReview({
      month: nextMonth,
      patients: reviewPatients
    });
  };

  const handleConfirmNextMonthCreate = () => {
    if (!nextMonthReview) {
      return;
    }

    const targetIds = nextMonthReview.patients
      .filter((patient) => patient.decision === "continue")
      .map((patient) => patient.patientId);
    const dischargedCount = nextMonthReview.patients.length - targetIds.length;

    if (targetIds.length === 0) {
      showMessage("作成対象がありません。継続患者を選択してください。");
      return;
    }

    createMonthlyRecordsForPatients(targetIds, nextMonthReview.month);
    setNextMonthReview(null);
    setIsMonthMenuOpen(false);
    showMessage(
      dischargedCount > 0
        ? `来月分を ${targetIds.length} 件作成しました。退院済み ${dischargedCount} 件は除外しました。`
        : `来月分を ${targetIds.length} 件作成しました。`
    );
  };

  const handleSelectMonth = (month: string) => {
    if (deleteRevealMonth === month) {
      setDeleteRevealMonth(null);
      return;
    }

    setSelectedMonth(month);
    setActiveFilter(null);
    setDeleteRevealMonth(null);
    setIsMonthMenuOpen(false);
  };

  const handleDeleteMonth = (month: string) => {
    const confirmed = window.confirm(
      "この月の一括作成データを削除しますか？この操作は元に戻せません。"
    );

    if (!confirmed) {
      return;
    }

    deleteMonthlyRecordsByMonth(month);
    setDeleteRevealMonth(null);
    setNextMonthReview((current) => (current?.month === month ? null : current));
    showMessage(`${formatMonth(month)} を削除しました。`);
  };

  const handleMonthTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const handleMonthTouchEnd = (month: string, event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < SWIPE_CLOSE_THRESHOLD) {
      return;
    }

    if (deltaX <= -SWIPE_OPEN_THRESHOLD) {
      setDeleteRevealMonth(month);
      return;
    }

    if (deltaX >= SWIPE_CLOSE_THRESHOLD) {
      setDeleteRevealMonth((current) => (current === month ? null : current));
    }
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
            onClick={() => {
              setIsMonthMenuOpen((current) => !current);
              setDeleteRevealMonth(null);
            }}
            aria-label="月メニューを開く"
            aria-expanded={isMonthMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="hero__copy">
            <h1>計画書進捗ボード</h1>
          </div>
        </div>

        <div className="hero__status-card">
          <strong>{formatMonth(selectedMonth)}</strong>
        </div>
      </header>

      {isMonthMenuOpen ? (
        <div
          className="month-menu-backdrop"
          onClick={() => {
            setDeleteRevealMonth(null);
            setIsMonthMenuOpen(false);
          }}
        >
          <aside
            className="month-menu"
            onClick={(event) => event.stopPropagation()}
            aria-label="月一覧"
          >
            <div className="month-menu__header">
              <h2>月ページ</h2>
            </div>

            <button
              className="primary-button month-menu__bulk-button"
              type="button"
              onClick={handleOpenNextMonthReview}
            >
              来月分を一括作成
            </button>

            <div className="month-menu__list">
              {months.map((month) => (
                <div
                  key={month}
                  className={`month-menu__item-row ${deleteRevealMonth === month ? "is-delete-revealed" : ""}`}
                  onTouchStart={handleMonthTouchStart}
                  onTouchEnd={(event) => handleMonthTouchEnd(month, event)}
                >
                  <div className="month-menu__delete-slot">
                    <button
                      type="button"
                      className="month-menu__delete-button"
                      onClick={() => handleDeleteMonth(month)}
                      aria-label={`${formatMonth(month)} を削除`}
                    >
                      削除
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`month-menu__item ${month === selectedMonth ? "is-active" : ""}`}
                    onClick={() => handleSelectMonth(month)}
                  >
                    <div className="month-menu__item-copy">
                      <span>{formatMonth(month)}</span>
                    </div>
                    {month === currentMonth ? <strong>今月</strong> : null}
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {nextMonthReview ? (
        <div className="dialog-backdrop" onClick={() => setNextMonthReview(null)}>
          <section
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="来月分作成の確認"
          >
            <div className="dialog-panel__header">
              <h2>{formatMonth(nextMonthReview.month)} の一括作成</h2>
              <p>患者ごとに「継続」か「退院済み」かを確認してから作成します。</p>
            </div>

            <p className="dialog-panel__summary">
              作成対象 {reviewTargetCount} / {nextMonthReview.patients.length} 人
            </p>

            <div className="review-list">
              {nextMonthReview.patients.map((patient, index) => (
                <article key={patient.patientId} className="review-card">
                  <div className="review-card__copy">
                    <span>{index + 1}</span>
                    <strong>{patient.patientName}</strong>
                  </div>

                  <div
                    className="decision-group"
                    role="group"
                    aria-label={`${patient.patientName} の来月判定`}
                  >
                    <button
                      type="button"
                      className={`decision-chip ${patient.decision === "continue" ? "is-active" : ""}`}
                      onClick={() =>
                        setNextMonthReview((current) =>
                          current
                            ? {
                                ...current,
                                patients: current.patients.map((currentPatient) =>
                                  currentPatient.patientId === patient.patientId
                                    ? { ...currentPatient, decision: "continue" }
                                    : currentPatient
                                )
                              }
                            : current
                        )
                      }
                    >
                      継続
                    </button>
                    <button
                      type="button"
                      className={`decision-chip ${patient.decision === "discharged" ? "is-active is-danger" : ""}`}
                      onClick={() =>
                        setNextMonthReview((current) =>
                          current
                            ? {
                                ...current,
                                patients: current.patients.map((currentPatient) =>
                                  currentPatient.patientId === patient.patientId
                                    ? { ...currentPatient, decision: "discharged" }
                                    : currentPatient
                                )
                              }
                            : current
                        )
                      }
                    >
                      退院済み
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="dialog-panel__actions">
              <button
                type="button"
                className="dialog-button dialog-button--ghost"
                onClick={() => setNextMonthReview(null)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="dialog-button dialog-button--primary"
                onClick={handleConfirmNextMonthCreate}
                disabled={reviewTargetCount === 0}
              >
                {reviewTargetCount} 人で作成する
              </button>
            </div>
          </section>
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
              <div className="board-header__title-row">
                <h2>{formatMonth(selectedMonth)}</h2>
                <span className="selected-month-badge">
                  {selectedMonth === currentMonth ? "現在選択中の月" : "選択中の月"}
                </span>
                {activeFilter ? (
                  <span className="selected-month-badge selected-month-badge--filter">フィルタ中</span>
                ) : null}
              </div>
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
            onUpdatePatientDetails={updatePatientDetails}
            onDeletePatient={deletePatient}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
