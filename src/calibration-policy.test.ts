import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteHumanCalibration } from "./calibration-policy.js";

const complete = {
  reviewStatus: "human-reviewed",
  checklist: {
    centralQuestion: "What problem does the paper study?",
    mainContribution: "A new method.",
    strongestResults: ["It improves the primary benchmark."],
    limitations: ["The evaluation is narrow."],
    qualificationRisks: ["The result applies only to the tested setting."],
  },
};

test("requires evidence in every human calibration field", () => {
  assert.equal(isCompleteHumanCalibration(complete), true);
  assert.equal(
    isCompleteHumanCalibration({
      ...complete,
      checklist: { ...complete.checklist, limitations: [] },
    }),
    false,
  );
  assert.equal(
    isCompleteHumanCalibration({ ...complete, reviewStatus: "pending-human" }),
    false,
  );
});
