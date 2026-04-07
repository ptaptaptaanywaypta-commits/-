import type { MonthlyRecord, Patient, PatientProgressKey } from "../types";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  calculateDaysSinceStart,
  formatDate,
  isMonthlyRecordComplete
} from "../utils/patientUtils";

type PatientCardProps = {
  patient: Patient;
  currentRecord?: MonthlyRecord;
  selectedMonth: string;
  pastIncompleteCount: number;
  onToggleProgress: (patientId: string, month: string, key: PatientProgressKey) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdatePatientDetails: (
    id: string,
    updates: Pick<Patient, "patientName" | "rehabStartDate">
  ) => void;
  onDeletePatient: (id: string) => void;
};

type EditableField = "name" | "date" | null;

const progressButtons: Array<{
  key: PatientProgressKey;
  label: string;
}> = [
  { key: "documentCreated", label: "文書作成" },
  { key: "signed", label: "サイン済" },
  { key: "submitted", label: "提出/算定済" }
];

export const PatientCard = ({
  patient,
  currentRecord,
  pastIncompleteCount,
  onToggleProgress,
  onUpdateMemo,
  onUpdatePatientDetails,
  onDeletePatient
}: PatientCardProps) => {
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [nameDraft, setNameDraft] = useState(patient.patientName);
  const [dateDraft, setDateDraft] = useState(patient.rehabStartDate);
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const complete = currentRecord ? isMonthlyRecordComplete(currentRecord) : false;
  const daysSinceStart = calculateDaysSinceStart(patient.rehabStartDate);
  const isEditingName = editingField === "name";
  const isEditingDate = editingField === "date";

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(patient.patientName);
      setNameError("");
    }
  }, [isEditingName, patient.patientName]);

  useEffect(() => {
    if (!isEditingDate) {
      setDateDraft(patient.rehabStartDate);
      setDateError("");
    }
  }, [isEditingDate, patient.rehabStartDate]);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDate) {
      dateInputRef.current?.focus();
      dateInputRef.current?.showPicker?.();
    }
  }, [isEditingDate]);

  const beginEditing = (field: Exclude<EditableField, null>) => {
    setEditingField(field);

    if (field === "name") {
      setNameDraft(patient.patientName);
      setNameError("");
      return;
    }

    setDateDraft(patient.rehabStartDate);
    setDateError("");
  };

  const cancelEditing = (field: Exclude<EditableField, null>) => {
    if (field === "name") {
      setNameDraft(patient.patientName);
      setNameError("");
    } else {
      setDateDraft(patient.rehabStartDate);
      setDateError("");
    }

    setEditingField((current) => (current === field ? null : current));
  };

  const saveName = () => {
    const trimmedName = nameDraft.trim();

    if (!trimmedName) {
      setNameError("名前を入力してください。");
      return;
    }

    if (trimmedName !== patient.patientName) {
      onUpdatePatientDetails(patient.id, {
        patientName: trimmedName,
        rehabStartDate: patient.rehabStartDate
      });
    }

    setNameError("");
    setEditingField((current) => (current === "name" ? null : current));
  };

  const saveDate = () => {
    if (!dateDraft) {
      setDateError("開始日を入力してください。");
      return;
    }

    if (dateDraft !== patient.rehabStartDate) {
      onUpdatePatientDetails(patient.id, {
        patientName: patient.patientName,
        rehabStartDate: dateDraft
      });
    }

    setDateError("");
    setEditingField((current) => (current === "date" ? null : current));
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveName();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing("name");
    }
  };

  const handleDateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveDate();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing("date");
    }
  };

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
      <button
        className="delete-button delete-button--compact"
        type="button"
        onClick={() => onDeletePatient(patient.id)}
        aria-label={`${patient.patientName} を削除`}
      >
        削除
      </button>

      <div className="patient-card__header">
        <div className="patient-card__title-row">
          {isEditingName ? (
            <div className="patient-card__inline-edit">
              <input
                ref={nameInputRef}
                className={`patient-card__inline-input ${nameError ? "is-invalid" : ""}`}
                type="text"
                value={nameDraft}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  if (nameError) {
                    setNameError("");
                  }
                }}
                onBlur={saveName}
                onKeyDown={handleNameKeyDown}
                aria-label="患者名を編集"
              />
              {nameError ? <p className="patient-card__inline-error">{nameError}</p> : null}
            </div>
          ) : (
            <button
              type="button"
              className="patient-card__editable-title"
              onClick={() => beginEditing("name")}
              aria-label={`${patient.patientName} の名前を編集`}
            >
              <h3>{patient.patientName}</h3>
            </button>
          )}
          {complete ? <span className="badge">今月完了</span> : null}
          {pastIncompleteCount > 0 ? (
            <span className="badge badge--warning">過去分未完了あり（{pastIncompleteCount}件）</span>
          ) : null}
        </div>

        <div className="patient-card__meta-grid" aria-label="患者情報">
          <div className="meta-pill meta-pill--editable">
            <span>開始日</span>
            {isEditingDate ? (
              <div className="patient-card__inline-edit patient-card__inline-edit--meta">
                <input
                  ref={dateInputRef}
                  className={`patient-card__inline-input patient-card__inline-input--date ${
                    dateError ? "is-invalid" : ""
                  }`}
                  type="date"
                  value={dateDraft}
                  onChange={(event) => {
                    setDateDraft(event.target.value);
                    if (dateError) {
                      setDateError("");
                    }
                  }}
                  onBlur={saveDate}
                  onKeyDown={handleDateKeyDown}
                  aria-label="開始日を編集"
                />
                {dateError ? <p className="patient-card__inline-error">{dateError}</p> : null}
              </div>
            ) : (
              <button
                type="button"
                className="patient-card__editable-meta"
                onClick={() => beginEditing("date")}
                aria-label={`${patient.patientName} の開始日を編集`}
              >
                <strong>{formatDate(patient.rehabStartDate)}</strong>
              </button>
            )}
          </div>
          <div className="meta-pill">
            <span>経過日</span>
            <strong>{daysSinceStart}日</strong>
          </div>
        </div>
      </div>

      {currentRecord ? (
        <div
          className="progress-grid progress-grid--compact"
          role="group"
          aria-label={`${patient.patientName} の工程`}
        >
          {progressButtons.map((button) => {
            const active = currentRecord[button.key];

            return (
              <button
                key={button.key}
                type="button"
                className={`progress-toggle progress-toggle--compact ${active ? "is-active" : ""}`}
                onClick={() => onToggleProgress(patient.id, currentRecord.month, button.key)}
                aria-pressed={active}
              >
                <span>{button.label}</span>
                <strong>{active ? "済" : "未"}</strong>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="record-missing record-missing--compact">
          <p>未作成</p>
        </div>
      )}

      <label className="memo-field memo-field--compact">
        <span>メモ</span>
        <textarea
          value={patient.memo}
          rows={2}
          placeholder="補足事項"
          onChange={(event) => onUpdateMemo(patient.id, event.target.value)}
        />
      </label>
    </article>
  );
};
