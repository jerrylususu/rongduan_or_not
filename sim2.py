import json
from unittest import result
from tqdm import tqdm
import numpy as np
import pandas as pd
from dataclasses import dataclass

from datetime import datetime
from datetime import timedelta

from typing import List
from typing import Tuple

from itertools import product

from pprint import pprint


@dataclass
class DateItem:
    date: str
    count: int
    triggerStatus: str
    flightStatus: str
    enabled: bool


beginDate = datetime(2022, 3, 31)
weekCount = 30
aWeek = timedelta(days=7)
knownCount = [3, 6, 5, 0]
probMap = {
    "ok": 0.5,
    "minor": 0.4,
    "major": 0.08,
    "immediate": 0.02
}
probCountMap = {
    "ok": 0,
    "minor": 5,
    "major": 10,
    "immediate": 30
}

assert(sum(probMap.values()) == 1)


def buildEmptyList():
    dateDetails = []

    for i in range(weekCount):
        date = beginDate + i * aWeek
        dateStr = str(date)[:10]
        dateItem = DateItem(date=dateStr, count=0,
                            triggerStatus="ok", flightStatus="yes", enabled=True)
        dateDetails.append(dateItem)

    # dateDetails[-2].enabled = False
    # dateDetails[-2].triggerStatus = "cancelled"

    return dateDetails


def calculateOneState(items: List[DateItem]):
    # warning: item will be modified!

    # reset internal state
    for item in items:
        item.triggerStatus = "ok"
        item.flightStatus = "yes"

        if not item.enabled:
            item.triggerStatus = "cancelled"
            item.flightStatus = "no"

    # do calculation
    for idx, item in enumerate(items):
        breakWeekCount = 0
        advanceWeek = 0
        forceImmediateBreak = False

        if item.flightStatus == "yes":
            if 0 <= item.count < 5:
                item.triggerStatus = "ok"
            elif 5 <= item.count < 10:
                item.triggerStatus = "minor"
                breakWeekCount = 2
                advanceWeek = 4-1
            elif 10 <= item.count < 30:
                item.triggerStatus = "major"
                breakWeekCount = 4
                advanceWeek = 4-1

                # special case
                if idx - 1 >= 0:
                    prevItem = items[idx - 1]
                    if prevItem.count >= 10:
                        breakWeekCount = 8
                        advanceWeek = 1
                        forceImmediateBreak = True
            else:
                item.triggerStatus = "immedaite"
                breakWeekCount = 4
                advanceWeek = 1

        j = 0
        while (breakWeekCount > 0 and (idx+advanceWeek+j < len(items))):
            futureItem = items[idx+advanceWeek+j]
            if futureItem.enabled:
                if futureItem.flightStatus == "yes" or forceImmediateBreak:
                    futureItem.flightStatus = "no"
                    futureItem.triggerStatus = f"broken"
                    breakWeekCount -= 1
                    if breakWeekCount == 0:
                        forceImmediateBreak = False

            j += 1

    return

def findLastAvailableFlight(items: List[DateItem]):
    idx = len(items) - 1
    while items[idx].flightStatus == "yes" and idx >= 0:
        idx -= 1
    if idx == -1:
        return -1
    else:
        return idx + 1
    

def saveCountState(items: List[DateItem]):
    return [item.count for item in items]


def applyCountState(items: List[DateItem], state: List[int]):
    for idx, item in enumerate(items):
        item.count = state[idx]
    return

def generateNext(items: List[DateItem], action_and_prob: List[Tuple[Tuple[str, int], float]]):
    actions, prob = action_and_prob
    for action, idx in actions:
        if action == "nop":
            continue
        items[idx].count = probCountMap[action]

    calculateOneState(items)
    
    # next undertermined
    nextUndertermined = idx + 1
    while nextUndertermined < len(items) and items[nextUndertermined].triggerStatus != "ok":
        nextUndertermined += 1

    if nextUndertermined == len(items):
        return None # finished
    else:
        results = []
        for triggerState in probMap.keys():
            if probMap[triggerState] != 0:
                newActions = actions + [(triggerState, nextUndertermined)]
                newProb = prob * probMap[triggerState]
                
                results.append((newActions, newProb))
        return results


def getDailyResult(items: List[DateItem], completedActions: List[Tuple[List[Tuple[str, int]], float]]):
    freeSlotCount = weekCount - len(knownCount)
    initalState = knownCount + [0] * freeSlotCount
    
    dayToStatusMap = {item.date: {"yes_prob": 0} for item in items}

    resultDump = {
        "meta": {
            "knownCount": knownCount,
            "beginDate": str(beginDate),
            "probMap": probMap
        },
        "summary": {},
        "simulations": []
    }

    f2 = open("result_simulations.jsonlines","w",encoding="utf8")


    for actions, prob in tqdm(completedActions):
        applyCountState(items, initalState)
        for action, idx in actions:
            if action == "nop":
                continue
            items[idx].count = probCountMap[action]
        calculateOneState(items)

        oneSimulation = {"actions": actions, "prob": prob, "days": { item.date : {"triggerStatus": item.triggerStatus, "flightStatus": item.flightStatus} for item in items  }}

        f2.write(json.dumps(oneSimulation) + "\n")

        for item in items:
            dayToStatusMap[item.date][item.flightStatus] = dayToStatusMap[item.date].get(
                item.flightStatus, 0) + 1
            if item.flightStatus == "yes":
                dayToStatusMap[item.date]["yes_prob"] = dayToStatusMap[item.date].get("yes_prob", 0) + prob

        # resultDump["simulations"].append(oneSimulation)

    f2.close()

    resultDump["summary"] = dayToStatusMap

    with open("result_dump.json", "w", encoding="utf8") as f:
        json.dump(resultDump, f, ensure_ascii=False, indent=4)


    return dayToStatusMap    


def main():
    # build initial
    dateDetils = buildEmptyList()
    freeSlotCount = weekCount - len(knownCount)
    initalState = knownCount + [0] * freeSlotCount

    # Action: [date (index), triggerStatus]
    # list of tuple: [List[Action], prob]
    possibleActions = [([("nop",len(knownCount)-1)], 1)]
    completedActions = []

    while len(possibleActions) > 0:
        applyCountState(dateDetils, initalState)
        currentSequence = possibleActions.pop(0)
        # print(currentSequence)
        nextSteps = generateNext(dateDetils, currentSequence)
        # print(nextSteps)
        if nextSteps is None:
            completedActions.append(currentSequence)
        else:
            possibleActions.extend(nextSteps)

    
    print("done")
    print(len(completedActions))
    # pprint(completedActions)
    print("prob sum=",sum([i[1] for i in completedActions]))

    results = getDailyResult(dateDetils, completedActions)
    pprint(results)



if __name__ == "__main__":
    main()

