export type PatientProgressKey = "documentCreated" | "signed" | "submitted";

export type MonthlyRecord = {
  id: string;
  month: string;
  documentCreated: boolean;
  signed: boolean;
  submitted: boolean;
  updatedAt: string;
};

export type Patient = {
  id: string;
  patientName: string;
  rehabStartDate: string;
  memo: string;
  monthlyRecords: MonthlyRecord[];
};

export type SummaryStats = {
  incompleteCount: number;
  completeCount: number;
  waitingDocumentCount: number;
  waitingSignCount: number;
  waitingSubmissionCount: number;
};
