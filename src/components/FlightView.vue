
<template>
  <div>
    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <h1>今天航班熔断了吗？</h1>
        <hr />
        <a-button href="http://www.caac.gov.cn/XXGK/XXGK/TZTG/202104/t20210429_207386.html" target="_blank">民航局文件</a-button>
        <a-button href="https://github.com/jerrylususu/rongduan_or_not" target="_blank"><github-outlined /></a-button>

        <p>不考虑奖励航班和控制客座率措施。<strong>仅供参考！</strong></p>
        <!-- <br /> -->
        首个航班入境日期：<a-date-picker
          v-model:value="beginDate"
          @change="inputHandler"
        ></a-date-picker>
        <br />
        周数：<a-input-number
          v-model:value="numberOfWeeks"
          :min="1"
          :max="40"
          @change="inputHandler"
        />
        
        <p>图例：日期，取消开关，阳性数量 -> 熔断状态，航班状态 <br/>
        地区提示：美国：航司可能对航班进行<a href="https://piao.tips/7bc7e7ee15/" target="_blank">「规律性取消」</a>，可使用航班卡片中的开关手动取消特定航班。</p>

        <a-collapse>
          <a-collapse-panel key="states" header="状态说明">
            <p>正常：航班状态正常（0~4 例阳性，不触发熔断）</p>
            <p>小熔断：5~9 例阳性，触发航班入境第四周起的 2 周熔断</p>
            <p>大熔断：10~30 例阳性，触发航班入境第四周起的 4 周熔断（若连续两周 10 例或以上阳性，立刻触发 4 周熔断）</p>
            <p>超级熔断：30 例以上阳性，立即触发 4 周熔断</p>
            <p>(稳)：（实验性）若触发连续熔断，熔断恢复后的头两班是一定能正常执飞的。</p>
          </a-collapse-panel>
        </a-collapse>
      </a-col>
    </a-row>

    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <div v-for="(item, index) in datesDetails" :key="item.date">
          <date-item
            :date="item.date"
            :count="item.count"
            :index="index"
            :triggerStatus="item.triggerStatus"
            :flightStatus="item.flightStatus"
            :enabled="item.enabled"
            :surely="item.surely"
            @itemChange="itemChangeHandler"
          ></date-item>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import {
  Button,
  DatePicker,
  InputNumber,
  Space,
  Row,
  Col,
  Collapse,
} from "ant-design-vue";
  import { GithubOutlined } from '@ant-design/icons-vue';

import DateItem from "./DateItem.vue";
//   const ButtonGroup = Button.Group;

export default {
  components: {
    AButton: Button,
    ADatePicker: DatePicker,
    ASpace: Space,
    AInputNumber: InputNumber,
    DateItem,
    ARow: Row,
    ACol: Col,
    GithubOutlined,
    ACollapse: Collapse,
    ACollapsePanel: Collapse.Panel,
  },
  data() {
    return {
      beginDate: "",
      numberOfWeeks: 20,
      datesDetails: [],
    };
  },
  methods: {
    inputHandler(value) {
      if (!value) return;

      // repopulate
      let targetDatesDetails = []
      for (let i = 1; i <= this.numberOfWeeks; i++) {
        let date = new Date(this.beginDate);
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

      for(let i = 0; i < targetDatesDetails.length; i++) {
        let match = this.datesDetails.filter(x => x.date === targetDatesDetails[i].date)
        if (match.length == 1) {
          targetDatesDetails[i].count = match[0].count;
          targetDatesDetails[i].enabled = match[0].enabled;
        }
        this.datesDetails.push(targetDatesDetails[i]);
      }

      this.datesDetails = targetDatesDetails;

      this.reCalculate();
    },
    itemChangeHandler(param) {
      this.datesDetails[param.index].count = param.count;
      this.datesDetails[param.index].enabled = param.enabled;
      this.reCalculate();
    },
    reCalculate() {
      console.log("recalculating...");

      // 状态重置
      for (let i = 0; i < this.datesDetails.length; i++) {
        let item = this.datesDetails[i];

        item.triggerStatus = "ok";
        item.flightStatus = "yes";
        item.surely = false;

        if (!item.enabled) {
          item.triggerStatus = "cancelled";
          item.flightStatus = "no";
        }
      }

      // 计算熔断
      for (let i = 0; i < this.datesDetails.length; i++) {
        let item = this.datesDetails[i];
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
              let prevItem = this.datesDetails[i - 1];
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
          (i + advanceWeek + j < this.datesDetails.length)
        ) {
          let futureItem = this.datesDetails[i + advanceWeek + j];
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

      // 计算稳的航班
      // 稳的航班：连续触发熔断（或者被取消）的航班和被熔断的航班相连，熔断结束后的头两个航班是一定安全的
      let i = 0;
      let surelyMarked = false
      while (i < this.datesDetails.length) {
        
        if (this.datesDetails[i].flightStatus === "no" 
            && i - 1 >= 0 
            &&  ["major", "minor", "immediate"].includes(this.datesDetails[i-1].triggerStatus)) {
          console.log(i)
          while (this.datesDetails[i].flightStatus === "no") {
            i++;
          }
          let safeCount = 2;
          while (safeCount > 0 && i < this.datesDetails.length) {
            if (this.datesDetails[i].flightStatus === "yes") {
              safeCount--;
              this.datesDetails[i].surely = true;
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


    },
  },
};
</script>

<style>
</style>