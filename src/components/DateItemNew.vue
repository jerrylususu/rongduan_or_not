<template>
    <a-card :class="[flightStatus]">
        第 {{index+1}} 周:  {{date}}
        <a-radio-group v-model:value="localCount" @change="countChangeHandler" :disabled="!localEnabled">
            <a-radio-button value="0">正常</a-radio-button>
            <a-radio-button value="5">小熔断</a-radio-button>
            <a-radio-button value="10">大熔断</a-radio-button>
        </a-radio-group>
        <a-switch v-model:checked="localEnabled" size="small" @change="enabledChangeHandler"></a-switch>
        <!-- <a-input-number v-model:value="localCount" :min="0" :disabled="!localEnabled"></a-input-number> -->
        <a-button :class="triggerStatus">{{surelyStr + triggerStatusName}}</a-button>
        <span v-if="flightStatus === 'yes' "><check-outlined /></span>
        <span v-else> <stop-outlined /></span>
    </a-card>
</template>

<script>
  import { Button, InputNumber, Card, Switch, Radio } from 'ant-design-vue';
  
  import { CheckOutlined, StopOutlined } from '@ant-design/icons-vue';


export default {
    components: {
      AButton: Button,
      AInputNumber: InputNumber,
      ACard: Card,
      CheckOutlined,
      StopOutlined,
      ASwitch: Switch,
      ARadioGroup: Radio.Group,
      ARadioButton: Radio.Button,
    },
    props: {
        date: {
            type: String,
            required: true
        },
        count: {
            type: Number,
            required: false,
            default: 0,
        },
        index: {
            type: Number,
            required: true
        },
        triggerStatus: {
            type: String,
            required: true
        },
        flightStatus: {
            type: String,
            required: true
        },
        enabled: {
            type: Boolean,
            required: true,
        },
        surely: {
            type: Boolean,
            required: true,
        },
    },
    emits: ['itemChange'],
    data() {
        return {
            localCount: this.count,
            triggerStatusMap: {
                "ok": "正常",
                "minor": "小熔断",
                "major": "大熔断",
                "cancelled": "取消",
            },
            localEnabled: this.enabled,
            size: "small"
        }
    },
    methods: {
        countChangeHandler(event) {
            console.log("here!")
            console.log(event)
            console.log(event.target.value)
            this.localCount = parseInt(event.target.value)
            this.$emit('itemChange', {
                date: this.date,
                count: this.localCount,
                enabled: this.localEnabled,
                index: this.index
            })
        },
        enabledChangeHandler(value) {
            this.localEnabled = value
            if (!this.localEnabled) {
                this.localCount = 0
            }
            this.$emit('itemChange', {
                date: this.date,
                count: this.localCount,
                enabled: this.localEnabled,
                index: this.index
            })
        },
    },
    computed: {
        triggerStatusName() {
            if(this.triggerStatus in this.triggerStatusMap) {
                return this.triggerStatusMap[this.triggerStatus]
            } else {
                return this.triggerStatus.replace("broken by", "熔断，触发于")
            }

        },
        surelyStr() {
            return this.surely ? "(稳)" : ""
        },
    },
    watch: { // 避免 props 和本地状态不同步
        count: {
            handler(value) {
                this.localCount = value
            },
            immediate: true
        },
        enabled: {
            handler(value) {
                this.localEnabled = value
            },
            immediate: true
        },
    }
}
</script>

<style scoped>
.ok {
    background-color: #28a745;
}
.minor {
    background-color: #ef5350;
}
.major {
    background-color: #f44336;
}
.immediate {
    background-color: #ff1744;
}
.cancelled {
    background-color: #78909c;
}

.yes {
    background-color: #81c784;
}
.no {
    background-color: #6c757d;
}




</style>