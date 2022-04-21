
<template>
  <div>
    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        <h1>今天航班熔断了吗？</h1>
        <hr />
        <a-button href="http://www.caac.gov.cn/XXGK/XXGK/TZTG/202104/t20210429_207386.html" target="_blank">民航局文件</a-button>
        <a-button href="https://github.com/jerrylususu/rongduan_or_not" target="_blank">代码库</a-button>

        <p>不考虑奖励航班和控制客座率措施</p>
        <!-- <br /> -->
        开始日期：<a-date-picker
          v-model:value="beginDate"
          @change="inputHandler"
        ></a-date-picker>
        <br />
        周数：<a-input-number
          v-model:value="numberOfWeeks"
          :min="1"
          :max="20"
          @change="inputHandler"
        />
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
            @countChange="countChangeHandler"
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
} from "ant-design-vue";
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
  },
  data() {
    return {
      beginDate: "",
      numberOfWeeks: 12,
      datesDetails: [],
    };
  },
  methods: {
    inputHandler(value) {
      if (!value) return;

      // clear array
      this.datesDetails.splice(0, this.datesDetails.length);

      // repopulate
      for (let i = 1; i <= this.numberOfWeeks; i++) {
        let date = new Date(this.beginDate);
        date.setDate(date.getDate() + (i - 1) * 7);
        let dateString = date.toISOString().split("T")[0];
        this.datesDetails.push({
          date: dateString,
          count: 0,
          triggerStatus: "ok",
          flightStatus: "yes",
        });
      }
    },
    countChangeHandler(param) {
      this.datesDetails[param.index].count = param.count;
      this.reCalculate();
    },
    reCalculate() {
      console.log("recalculating...");
      for (let i = 0; i < this.datesDetails.length; i++) {
        this.datesDetails[i].triggerStatus = "ok";
        this.datesDetails[i].flightStatus = "yes";
      }

      for (let i = 0; i < this.datesDetails.length; i++) {
        let item = this.datesDetails[i];
        let breakWeekCount = 0;
        let advanceWeek = 0;

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
          } else {
            item.triggerStatus = "immediate";
            breakWeekCount = 4;
            advanceWeek = 1;
          }
        }

        let j = 0;
        while (
          breakWeekCount > 0 &&
          i + advanceWeek + j < this.datesDetails.length
        ) {
          if (this.datesDetails[i + advanceWeek + j].flightStatus === "yes") {
            this.datesDetails[i + advanceWeek + j].flightStatus = "no";
            this.datesDetails[
              i + advanceWeek + j
            ].triggerStatus = `broken by ${item.date}`;
            breakWeekCount--;
          }
          j++;
        }
      }
    },
  },
};
</script>

<style>
</style>