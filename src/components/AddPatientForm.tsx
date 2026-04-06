import { type FormEvent, useState } from "react";
import { createEmptyPatient } from "../utils/patientUtils";

type AddPatientFormProps = {
  onAddPatient: (input: ReturnType<typeof createEmptyPatient>) => string;
};

export const AddPatientForm = ({ onAddPatient }: AddPatientFormProps) => {
  const [form, setForm] = useState(createEmptyPatient);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.patientName.trim()) {
      return;
    }

    onAddPatient({
      ...form,
      patientName: form.patientName.trim(),
      memo: form.memo.trim()
    });
    setForm(createEmptyPatient());
  };

  return (
    <section className="panel panel--form">
      <div className="panel-heading panel-heading--stacked">
        <p className="panel__eyebrow">Quick Intake</p>
        <div>
          <h2>患者を追加</h2>
          <p>現場で必要な最小項目だけを入力し、今月分レコードをすぐ作成します。</p>
        </div>
      </div>

      <form className="patient-form" onSubmit={handleSubmit}>
        <label>
          <span>患者名</span>
          <input
            type="text"
            value={form.patientName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                patientName: event.target.value
              }))
            }
            placeholder="例: 山田 花子"
            required
          />
        </label>

        <label>
          <span>リハ開始日</span>
          <input
            type="date"
            value={form.rehabStartDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                rehabStartDate: event.target.value
              }))
            }
            required
          />
        </label>

        <label className="patient-form__memo">
          <span>メモ</span>
          <textarea
            value={form.memo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                memo: event.target.value
              }))
            }
            rows={2}
            placeholder="例: 主治医確認待ち、家族説明予定 など"
          />
        </label>

        <button className="primary-button primary-button--form" type="submit">
          患者を追加
        </button>
      </form>
    </section>
  );
};
