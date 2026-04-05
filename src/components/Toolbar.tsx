type ToolbarProps = {
  showIncompleteOnly: boolean;
  onToggleIncompleteOnly: (next: boolean) => void;
  onExportCsv: () => void;
  onImportCsv: (file: File | null) => void;
  onRestoreSamples: () => void;
};

export const Toolbar = ({
  showIncompleteOnly,
  onToggleIncompleteOnly,
  onExportCsv,
  onImportCsv,
  onRestoreSamples
}: ToolbarProps) => (
  <section className="panel">
    <div className="panel-heading">
      <div>
        <h2>表示とデータ</h2>
        <p>今月の未完了表示、CSV入出力、サンプル復元ができます。</p>
      </div>
    </div>

    <div className="toolbar">
      <label className="switch-row">
        <input
          type="checkbox"
          checked={showIncompleteOnly}
          onChange={(event) => onToggleIncompleteOnly(event.target.checked)}
        />
        <span>今月未完了のみ表示</span>
      </label>

      <button className="secondary-button" type="button" onClick={onExportCsv}>
        CSVを書き出す
      </button>

      <label className="secondary-button secondary-button--file">
        CSVを読み込む
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => onImportCsv(event.target.files?.[0] ?? null)}
        />
      </label>

      <button className="ghost-button" type="button" onClick={onRestoreSamples}>
        サンプルを復元
      </button>
    </div>
  </section>
);
