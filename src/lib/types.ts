export type ChangedFile = {
  path: string;
  changes: number;
  summary: string;
  status: "modified" | "added" | "deleted";
};

export type LocatorStatus = "broken" | "working" | "warning";

export type LocatorResult = {
  selector: string;
  type: "css" | "xpath" | "id" | "data-testid" | "text" | "other";
  file: string;
  line: number;
  status: LocatorStatus;
  confidence: number;
  suggestedFix?: string;
  reason: string;
};

export type RunResult = {
  runId: string;
  confidence: number;
  prUrl: string;
  summary: string;
  changedFiles: ChangedFile[];
  locators: LocatorResult[];
  totalLocators: number;
  brokenCount: number;
  workingCount: number;
};

export type ScanConfig = {
  repoUrl: string;
  websiteUrl: string;
  feature: string;
  branch: string;
  output: string;
  framework: string;
  language: string;
  writeAccess: boolean;
};

export type ScanEvent =
  | { type: "step"; message: string }
  | { type: "result"; data: RunResult }
  | { type: "error"; message: string };
