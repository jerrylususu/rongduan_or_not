
const probCountMap = {
    "ok": 0,
    "minor": 5,
    "major": 10,
    "immediate": 30
}

function calculate(datesDetails){
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
        if (0 <= item.count && item.count < 5) {
          item.triggerStatus = "ok";
        } else if (5 <= item.count && item.count < 10) {
          item.triggerStatus = "minor";
          breakWeekCount = 2;
          advanceWeek = 4 - 1;
        } else if (10 <= item.count && item.count < 30) {
          item.triggerStatus = "major";
          breakWeekCount = 4;
          advanceWeek = 4 - 1;

          // special case: 连续两周 10+，立刻熔断八周
          if (i - 1 >= 0) {
            let prevItem = datesDetails[i - 1];
            if (prevItem.count >= 10) {
              breakWeekCount = 8;
              advanceWeek = 1;
              forceImmediateBreak = true;
            }
          }
        } else {
          item.triggerStatus = "immediate";
          breakWeekCount = 4;
          advanceWeek = 1;
        }
      }

      let j = 0;
      while (
        breakWeekCount > 0 &&
        (i + advanceWeek + j < datesDetails.length)
      ) {
        let futureItem = datesDetails[i + advanceWeek + j];
        if (futureItem.enabled) {
          if (futureItem.flightStatus === "yes" || forceImmediateBreak) {
            futureItem.flightStatus = "no";
            futureItem.triggerStatus = `broken by ${item.date}`;
            breakWeekCount--;
            if (breakWeekCount === 0) {
              forceImmediateBreak = false;
            }
          }
        }

        j++;
      }
    }

    return datesDetails
}

function calculateSurely(datesDetails) {

    // inplace

    // 计算稳的航班
    // 稳的航班：连续触发熔断（或者被取消）的航班和被熔断的航班相连，熔断结束后的头两个航班是一定安全的
    let i = 0;
    let surelyMarked = false
    while (i < datesDetails.length) {
    
    if (datesDetails[i].flightStatus === "no" 
        && i - 1 >= 0 
        &&  ["major", "minor", "immediate"].includes(datesDetails[i-1].triggerStatus)) {
        console.log(i)
        while (datesDetails[i].flightStatus === "no") {
        i++;
        }
        let safeCount = 2;
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
      let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
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

function applyCountState(datesDetails, countState) {
    for (let [idx, val] of countState.entries()) {
        datesDetails[idx].count = val;
    }
}

function buildInitialCountState(datesDetails, numberOfWeeks, knownWeekCount){
    let countState = []
    for (let i = 0; i < numberOfWeeks; i++) {
        countState.push(0)
    }
    for (let i = 0; i < knownWeekCount; i++) {
        countState[i] = datesDetails[i].count
    }
    return countState
}

function generateNext(datesDetails, currentSequence, probMap) {
    let [actions, prob] = currentSequence;
    let lastActedIndex = 0
    for (let i=0; i < actions.length; i++) {
        let [action, idx] = actions[i]
        lastActedIndex = idx
        if (action === "nop"){
            continue
        }
        datesDetails[idx].count = probCountMap[action]
    }

    calculateBreak(datesDetails)

    let nextUndertermined = lastActedIndex + 1
    while (nextUndertermined < datesDetails.length && 
            datesDetails[nextUndertermined].triggerStatus !== "ok") {
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

function getDailyResult(datesDetails, completedActions, initialState) {
    let dayToStatusMap = {}

    for (let item of datesDetails){
        dayToStatusMap[item.date] = {"yes_prob": 0, "yes": 0, "no": 0}
    }

    for (let actions_and_prob of completedActions) {
        let [actions, prob] = actions_and_prob
        for (let i=0; i < actions.length; i++) {
            let [action, idx] = actions[i]
            if (action === "nop"){
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

function simulationMain(simConfig){
    // have to copy

    // debugger;
    let {datesDetails, beginDate, numOfWeeks, knownWeekCount, probMap} = simConfig;

    let workingDatesDetails = buildEmptyList(numOfWeeks, beginDate);
    let initialState = buildInitialCountState(datesDetails, numOfWeeks, knownWeekCount); 
    let possibleActions =  [[ [["nop", knownWeekCount - 1]] ,1]] 
    let completedActions = []

    while(possibleActions.length > 0){
        applyCountState(workingDatesDetails, initialState)
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

    let results = getDailyResult(workingDatesDetails, completedActions, initialState)
    console.log(results)   
}

export { simulationMain, calculate, buildEmptyList };