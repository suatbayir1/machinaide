export const ANOMALY_DETECTION_TASK_TEXT = "Perform anomaly detection"
export const RULREG_TASK_TEXT  = "Estimate the number of days of remaining useful lifetime"
export const RUL_TASK_TEXT  = "Guess whether RUL is under X days"
export const POF_TASK_TEXT  = "Estimate the probability of failure"

export const ANOMALY_DETECTION_TASK = "Perform anomaly detection"
export const RULREG_TASK  = "Estimate the number of days of remaining useful lifetime"
export const RUL_TASK = "Guess whether RUL is under X days"
export const POF_TASK  = "Estimate the probability of failure"

export const anomalyCountDailyThreshold = 6
export const rulDangerValue = 1
export const rulDangerValueThreshold = 0.5
export const rulregCycleDangerThreshold = 24 * 2 * 7 // 1 cycle = 30 min, 1 day = 24 * 2 = 48 cycle, 1 week = 48 * 7 = 336 cycle
export const pofProbabilityThreshold = 50