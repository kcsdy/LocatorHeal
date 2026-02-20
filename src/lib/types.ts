export type ChangedFile = {
  path: string;
  changes: number;
  summary: string;
  status: "modified" | "added" | "deleted";
};

export type RunResult = {
  runId: string;
  confidence: number; // 0..100
  prUrl: string;
  summary: string;
  changedFiles: ChangedFile[];
};

export type ScanConfig = {
  repoUrl: string;
  feature: string;
  branch: string;
  output: string;
  framework: string;
  language: string;
  writeAccess: boolean;
};
