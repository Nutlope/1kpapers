import { readFile } from "node:fs/promises";
import {
  isCompleteHumanCalibration,
  type HumanCalibration,
} from "./calibration-policy.js";

const file = process.argv[2] ?? "corpus/calibration-15.json";
const items = JSON.parse(await readFile(file, "utf8")) as HumanCalibration[];
const completed = items.filter(isCompleteHumanCalibration).length;
console.log(`Complete human calibration checklists: ${completed}/${items.length}`);
if (items.length !== 15 || completed !== 15) process.exitCode = 1;
