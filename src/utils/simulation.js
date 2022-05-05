
const probCountMap = {
  "ok": 0,
  "minor": 5,
  "major": 10,
  "immediate": 30
}

function calculate(datesDetails) {
  // inplace, return reference
  return calculateSurely(calculateBreak(datesDetails))
}

function calculateBreak(datesDetails) {
  // inplace
  console.log("recalculating...");

  // 状态重置
  for (let i = 0; i < datesDetails.length; i++) {
    let item = datesDetails[i];

    item.triggerStatus = "ok";
    item.flightStatus = "yes";
    item.surely = false;

    if (!item.enabled) {
      item.triggerStatus = "cancelled";
      item.flightStatus = "no";
    }
  }

  // 计算熔断
  for (let i = 0; i < datesDetails.length; i++) {
    let item = datesDetails[i];
    let breakWeekCount = 0;
    let advanceWeek = 0;
    let forceImmediateBreak = false;

    if (item.flightStatus === "yes") {
      // 单周少于5例，无影响
      if (0 <= item.count && item.count < 5) {
        item.triggerStatus = "ok";
        item.flightStatus = "yes";
      } else if (5 <= item.count && item.count < 10) {
        // 单周超过30例，第四周起熔断两周
        item.triggerStatus = "minor";
        for (let j = i + 3; j < i + 5; j++) {
          if (j < datesDetails.length) {
            datesDetails[j].flightStatus = "no";
            datesDetails[j].triggerStatus = `broken by ${item.date}`;
          }
        }

      } else if (10 <= item.count && item.count < 30) {
        // 单周超过10例，第四周起熔断四周
        item.triggerStatus = "major";
        for (let j = i + 3; j < i + 7; j++) {
          if (j < datesDetails.length) {
            datesDetails[j].flightStatus = "no";
            datesDetails[j].triggerStatus = `broken by ${item.date}`;
          }
        }


      } else {
        // 单周超过30例，立即熔断四周
        item.triggerStatus = "immediate";
        for (let j = i + 1; j < i + 5; j++) {
          if (j < datesDetails.length) {
            datesDetails[j].flightStatus = "no";
            datesDetails[j].triggerStatus = `broken by ${item.date}`;
          }
        }
      }
      // special case: 连续两周 10+，立刻熔断八周
      if (i - 1 >= 0 && datesDetails[i].count >= 10 && datesDetails[i - 1].count >= 10) {

        for (let j = i + 1; j < i + 9; j++) {
          if (j < datesDetails.length) {
            datesDetails[j].flightStatus = "no";
            datesDetails[j].triggerStatus = `broken by ${item.date}`;
          }
        }
      }
    }
  }
  return datesDetails
}

function calculateSurely(datesDetails) {

  // inplace

  // 计算稳的航班
  // 稳的航班：连续触发熔断（或者被取消）的航班和被熔断的航班相连，熔断结束后的头一个航班是一定安全的
  let i = 0;
  let surelyMarked = false
  while (i < datesDetails.length) {

    if (datesDetails[i].flightStatus === "no"
      && i - 1 >= 0
      && ["major", "minor", "immediate"].includes(datesDetails[i - 1].triggerStatus)) {
      console.log(i)
      while (datesDetails[i].flightStatus === "no") {
        i++;
      }
      let safeCount = 1;
      while (safeCount > 0 && i < datesDetails.length) {
        if (datesDetails[i].flightStatus === "yes") {
          safeCount--;
          datesDetails[i].surely = true;
          surelyMarked = true;
        }
        i++;
      }
    }

    if (surelyMarked) {
      surelyMarked = false;
      i--;
    }
    i++;
  }

  return datesDetails
}

function buildEmptyList(numberOfWeeks, beginDate) {
  let targetDatesDetails = []
  for (let i = 1; i <= numberOfWeeks; i++) {
    let date = new Date(beginDate);
    date.setDate(date.getDate() + (i - 1) * 7);
    let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split("T")[0];
    targetDatesDetails.push({
      date: dateString,
      count: 0,
      triggerStatus: "ok",
      flightStatus: "yes",
      enabled: true, // 取消
      surely: false, // 稳
    });
  }
  return targetDatesDetails
}

function applyState(datesDetails, countState, enableState) {
  for (let [idx, val] of countState.entries()) {
    datesDetails[idx].count = val;
  }
  for (let [idx, val] of enableState.entries()) {
    datesDetails[idx].enabled = val;
  }
}

function buildInitialState(datesDetails, numberOfWeeks, knownWeekCount) {
  let countState = []
  for (let i = 0; i < numberOfWeeks; i++) {
    countState.push(0)
  }
  for (let i = 0; i < knownWeekCount; i++) {
    countState[i] = datesDetails[i].count
  }
  let enableState = datesDetails.map(item => item.enabled)
  return [countState, enableState]
}

function generateNext(datesDetails, currentSequence, probMap) {
  let [actions, prob] = currentSequence;
  let lastActedIndex = 0
  for (let i = 0; i < actions.length; i++) {
    let [action, idx] = actions[i]
    lastActedIndex = idx
    if (action === "nop") {
      continue
    }
    datesDetails[idx].count = probCountMap[action]
  }

  calculateBreak(datesDetails)

  let nextUndertermined = lastActedIndex + 1
  while (nextUndertermined < datesDetails.length &&
    (datesDetails[nextUndertermined].triggerStatus !== "ok" || !datesDetails[nextUndertermined].enabled)) {
    nextUndertermined++
  }

  if (nextUndertermined === datesDetails.length) {
    return null
  }

  let results = []
  for (const [triggerState, triggerProb] of Object.entries(probMap)) {
    if (triggerProb !== 0) {
      let newActions = [...actions]
      newActions.push([triggerState, nextUndertermined])
      let newProb = prob * triggerProb
      results.push([newActions, newProb])
    }
  }
  return results
}

function getDailyResult(datesDetails, completedActions, initialCountState, initialEnableState) {
  let dayToStatusMap = {}

  for (let item of datesDetails) {
    dayToStatusMap[item.date] = { "yes_prob": 0, "yes": 0, "no": 0 }
  }

  for (let actions_and_prob of completedActions) {
    applyState(datesDetails, initialCountState, initialEnableState)
    let [actions, prob] = actions_and_prob
    for (let i = 0; i < actions.length; i++) {
      let [action, idx] = actions[i]
      if (action === "nop") {
        continue
      }
      datesDetails[idx].count = probCountMap[action]
    }
    calculateBreak(datesDetails)
    for (let item of datesDetails) {
      dayToStatusMap[item.date][item.flightStatus] = 1 + (dayToStatusMap[item.date][item.flightStatus] ?? 0)
      if (item.flightStatus === "yes") {
        dayToStatusMap[item.date]["yes_prob"] = prob + (dayToStatusMap[item.date]["yes_prob"] ?? 0)
      }
    }
  }

  return dayToStatusMap
}

function simulationMain(simConfig) {
  // have to copy

  // debugger;
  let { datesDetails, beginDate, numOfWeeks, knownWeekCount, probMap } = simConfig;

  console.log("datesDetails", datesDetails)

  let workingDatesDetails = buildEmptyList(numOfWeeks, beginDate);
  let [initialCountState, initialEnableState] = buildInitialState(datesDetails, numOfWeeks, knownWeekCount);
  let possibleActions = [[[["nop", knownWeekCount - 1]], 1]]
  let completedActions = []

  while (possibleActions.length > 0) {
    applyState(workingDatesDetails, initialCountState, initialEnableState)
    let currentSequence = possibleActions.shift()
    let nextSteps = generateNext(workingDatesDetails, currentSequence, probMap)
    if (nextSteps === null) {
      completedActions.push(currentSequence)
    } else {
      possibleActions = possibleActions.concat(nextSteps)
    }
  }

  console.log("sim done")
  console.log(`prob sum: ${completedActions.map(x => x[1]).reduce((a, b) => a + b, 0)}`)

  let results = getDailyResult(workingDatesDetails, completedActions, initialCountState, initialEnableState)
  return results
}

// https://gist.github.com/nikolas/b0cce2261f1382159b507dd492e1ceef
/**
 * A linear interpolator for hex colors.
 *
 * Based on:
 * https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 *
 * @param {Number} a  (hex color start val)
 * @param {Number} b  (hex color end val)
 * @param {Number} amount  (the amount to fade from a to b)
 *
 * @example
 * // returns 0x7f7f7f
 * lerpColor(0x000000, 0xffffff, 0.5)
 *
 * @returns {Number}
 */
const lerpColor = function (a, b, amount) {
  const ar = a >> 16,
    ag = a >> 8 & 0xff,
    ab = a & 0xff,

    br = b >> 16,
    bg = b >> 8 & 0xff,
    bb = b & 0xff,

    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

export { simulationMain, calculate, buildEmptyList, lerpColor };
