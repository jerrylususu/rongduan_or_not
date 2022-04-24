
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

        <a-button @click="runSimulation">Go</a-button>


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
import {calculate, buildEmptyList, simulationMain } from "../utils/simulation.js";
import { toRaw } from "@vue/reactivity";
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
      let targetDatesDetails = buildEmptyList(this.numberOfWeeks, this.beginDate);

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
      this.datesDetails = calculate(this.datesDetails);
    },
    runSimulation() {
      simulationMain({
        "datesDetails": toRaw(this.datesDetails),
        "beginDate": toRaw(this.beginDate),
        "numOfWeeks": this.numberOfWeeks,
        "knownWeekCount": 4,
        "probMap": {
          "ok": 0.5,
          "minor": 0.5,
          "major": 0,
          "immediate": 0
        }
      })
    }
  },
};
</script>

<style>
</style>