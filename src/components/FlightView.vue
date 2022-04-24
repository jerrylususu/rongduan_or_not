
<template>
  <div>
    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <h1>今天航班熔断了吗？</h1>
        <hr />
        <a-button href="http://www.caac.gov.cn/XXGK/XXGK/TZTG/202104/t20210429_207386.html" target="_blank">民航局文件</a-button>
        <a-button href="https://github.com/jerrylususu/rongduan_or_not" target="_blank" type="primary"><github-outlined /></a-button>

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
          <a-collapse-panel key="simulation" header="（实验性）日期安全性计算">
            <a-switch v-model:checked="enableSimulation" checked-children="开启" un-checked-children="关闭" />
            <strong>实验性！</strong> 
            <p>输入到目前为止已知的熔断信息和自己估计的熔断概率后，计算未来每周航班正常执飞的概率。</p>
            <p>需要输入的概率值之和为 100 %。计算时页面会卡顿，但通常可在 5 秒内计算完毕（周数为 20 周时）。</p>
            <p>结果为航班不受熔断影响正常执飞的概率，显示在每个航班所在行的最后，颜色越深，正常执飞的概率越高，即日期越安全。</p>
            <p>计算原理：在不影响已设定值的前提下，遍历所有可能的熔断/正常组合并记录每种组合对应的概率，最后对每个航次正常执飞的概率求和。</p>
            <br />
            <p>已确定周数：算法假设从第一周至 X 周的阳性病例数是确定且已知的，运行中不会变更这些周的结果。</p>


            <br />

            <a-alert v-show="!enableSimulation" message="未开启本功能，请拨动左上角的开关" type="warning" show-icon />
            <a-alert v-show="!probSumValid" message="概率和不为 100%" type="error" show-icon />
            <a-alert v-show="!initialized" message="未填写首个航班入境日期" type="error" show-icon />
            

            <a-form layout="inline">
              <a-form-item label="正常">
                <a-input-number v-model:value="probOk" addon-after="%" min="0" max="100"></a-input-number>
              </a-form-item>
              <a-form-item label="小熔断">
                <a-input-number v-model:value="probMinor" addon-after="%" min="0" max="100"></a-input-number>
              </a-form-item>
              <a-form-item label="大熔断">
                <a-input-number v-model:value="probMajor" addon-after="%"  min="0" max="100"></a-input-number>
              </a-form-item>
              <a-form-item label="超级熔断">
                <a-input-number v-model:value="probImmediate" addon-after="%"  min="0" max="100"></a-input-number>
              </a-form-item>
              <a-form-item label="已确定周数（包含）">
                <a-input-number v-model:value="knownWeekCount" addon-before="至第" addon-after="周" min="0" :max="numberOfWeeks"></a-input-number>
              </a-form-item>
            </a-form>
            <a-form-item>
              <a-button type="primary" @click="runSimulation" :disabled="!simulationEnabled">计算</a-button>
            </a-form-item>
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
            :showProb="item.showProb && simulationEnabled"
            :yesProb="item.yesProb"
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
  Form,
  Alert,
  Switch
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
    AForm: Form,
    AFormItem: Form.Item,
    AAlert: Alert,
    ASwitch: Switch,
  },
  data() {
    return {
      beginDate: "",
      numberOfWeeks: 20,
      datesDetails: [],
      knownWeekCount: 0,
      probOk: 50,
      probMinor: 40,
      probMajor: 8,
      probImmediate: 2,
      enableSimulation: false,
    };
  },
  computed: {
    probSumValid() {
      return this.probOk + this.probMinor + this.probMajor + this.probImmediate === 100;
    },
    initialized() {
      return this.datesDetails.length > 0;
    },
    simulationEnabled() {
      return this.initialized && this.probSumValid && this.enableSimulation;
    }
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

      let results = simulationMain({
        "datesDetails": toRaw(this.datesDetails),
        "beginDate": toRaw(this.beginDate),
        "numOfWeeks": this.numberOfWeeks,
        "knownWeekCount": this.knownWeekCount,
        "probMap": {
          "ok": this.probOk / 100,
          "minor": this.probMinor / 100,
          "major": this.probMajor / 100,
          "immediate": this.probImmediate / 100
        }
      })

      console.log("sim done")

      for(let i = this.knownWeekCount + 1; i < this.datesDetails.length; i++) {
        let item = this.datesDetails[i];
        item.yesProb = results[item.date]["yes_prob"];
        item.showProb = true;
      }

      console.log(results);

    }
  },
};
</script>

<style>
</style>