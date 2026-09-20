// First version of the time prediction: assignment features and course defaults.
// Personal pace is added once finished assignments carry actual hours (see docs/BUILD_PLAN.md M2).

// Hours of setup and reading that the submission type implies on its own.
const baseHours: Record<string, number> = {
  online_upload: 2,
  external_tool: 4,
  on_paper: 2.5,
  online_quiz: 2,
  online_text_entry: 1.5,
  discussion_topic: 0.5,
};
const defaultBaseHours = 2;
const hoursPerPoint = 1 / 50;
const hoursPerRubricSection = 0.4;
const longDescriptionChars = 200;
const longDescriptionHours = 0.5;
const maxHours = 20;

// Each driver names a number the student can check, so the basis line is never a bare claim.
export type Driver =
  | { key: "type"; value: string }
  | { key: "points"; value: number }
  | { key: "rubric"; value: number }
  | { key: "length"; value: number };

export type PredictionInput = {
  submissionType: string;
  points: number | null;
  rubricSections: number;
  descriptionLength: number;
};

export type Prediction = { hours: number; drivers: Driver[] };

const roundToHalfHour = (hours: number) => Math.round(hours * 2) / 2;

export function predictHours({ submissionType, points, rubricSections, descriptionLength }: PredictionInput): Prediction {
  // Canvas allows several submission types on one assignment; the first one sets the base.
  const primaryType = submissionType.split(",")[0];
  const drivers: Driver[] = [{ key: "type", value: primaryType }];
  let hours = baseHours[primaryType] ?? defaultBaseHours;

  if (points && points > 0) {
    hours += points * hoursPerPoint;
    drivers.push({ key: "points", value: points });
  }
  if (rubricSections > 0) {
    hours += rubricSections * hoursPerRubricSection;
    drivers.push({ key: "rubric", value: rubricSections });
  }
  if (descriptionLength >= longDescriptionChars) {
    hours += longDescriptionHours;
    drivers.push({ key: "length", value: descriptionLength });
  }
  return { hours: Math.min(roundToHalfHour(hours), maxHours), drivers };
}

// Hours left never goes negative, so a student who overshoots sees zero rather than a negative number.
export function hoursLeft(predicted: number, done: number) {
  return Math.max(roundToHalfHour(predicted - done), 0);
}
