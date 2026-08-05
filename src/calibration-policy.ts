export type HumanCalibration = {
  reviewStatus: string;
  checklist: {
    centralQuestion: unknown;
    mainContribution: unknown;
    strongestResults: unknown;
    limitations: unknown;
    qualificationRisks: unknown;
  };
};

export function isCompleteHumanCalibration(item: HumanCalibration) {
  return (
    item.reviewStatus === "human-reviewed" &&
    nonEmptyString(item.checklist.centralQuestion) &&
    nonEmptyString(item.checklist.mainContribution) &&
    nonEmptyStringArray(item.checklist.strongestResults) &&
    nonEmptyStringArray(item.checklist.limitations) &&
    nonEmptyStringArray(item.checklist.qualificationRisks)
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
}
