
<template>
  <div>
    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <h1>今天航班熔断了吗？</h1>
        <hr />
        一个简单的熔断计算器：填入已知的阳性病例信息，计算未来会被熔断的航班。
        <br />
        <header-links-new></header-links-new>
        <p>不考虑奖励航班和控制客座率措施。<strong>仅供参考！</strong></p>

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
            <p>正常：航班状态正常（阳性数小于5，或阳性数不超过本航班入境人数的4%，不触发熔断）</p>
            <p>小熔断：阳性数大于等于5，且超过入境人数的4%，且不超过入境人数的8%，触发航班入境第四周起的 1 周熔断</p>
            <p>小熔断：阳性数大于等于5，且超过入境人数的8%，触发航班入境第四周起的 2 周熔断</p>
            <hr>
            <p>其他注释：统计至落地日+5天，默认航班客座率为75%</p>
          </a-collapse-panel>
        </a-collapse>
      </a-col>
    </a-row>

    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <div v-for="(item, index) in datesDetails" :key="item.date">
          <date-item-new
            :date="item.date"
            :count="item.count"
            :index="index"
            :triggerStatus="item.triggerStatus"
            :flightStatus="item.flightStatus"
            :enabled="item.enabled"
            :surely="item.surely"
            @itemChange="itemChangeHandler"
          ></date-item-new>
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
  Form,
  Alert,
  Switch
} from "ant-design-vue";


import DateItemNew from "./DateItemNew.vue";
import HeaderLinksNew from "./HeaderLinksNew.vue";
import {calculate, buildEmptyList, simulationMain } from "../utils/simulation_new.js";
import { toRaw } from "@vue/reactivity";

export default {
  components: {
    AButton: Button,
    ADatePicker: DatePicker,
    ASpace: Space,
    AInputNumber: InputNumber,
    DateItemNew,
    ARow: Row,
    ACol: Col,
    ACollapse: Collapse,
    ACollapsePanel: Collapse.Panel,
    AForm: Form,
    AFormItem: Form.Item,
    AAlert: Alert,
    ASwitch: Switch,
    HeaderLinksNew,
  },
  data() {
    return {
      beginDate: "",
      numberOfWeeks: 10,
      datesDetails: [],
      knownWeekCount: 0,
    };
  },
  computed: {
    initialized() {
      return this.datesDetails.length > 0;
    },
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
  },
};
</script>

<style>
</style>