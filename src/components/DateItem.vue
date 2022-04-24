<template>
    <a-card :class="[flightStatus]">
        第 {{index+1}} 周:  {{date}}
        <a-switch v-model:checked="localEnabled" size="small" @change="enabledChangeHandler"></a-switch>
        <a-input-number v-model:value="localCount" @change="countChangeHandler" :min="0" :disabled="!localEnabled"></a-input-number>
        <a-button :class="triggerStatus">{{surelyStr + triggerStatusName}}</a-button>
        <span v-if="flightStatus === 'yes' "><check-outlined /></span>
        <span v-else> <stop-outlined /></span>
        <a-button type="dashed" :style="probColor" v-if="showProb">{{(yesProb * 100).toFixed(2) + '%' }}</a-button>
    </a-card>
</template>

<script>
  import { Button, InputNumber, Card, Switch } from 'ant-design-vue';
  import { CheckOutlined, StopOutlined } from '@ant-design/icons-vue';
  import { lerpColor } from '../utils/simulation';

export default {
    components: {
      AButton: Button,
      AInputNumber: InputNumber,
      ACard: Card,
      CheckOutlined,
      StopOutlined,
      ASwitch: Switch,
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
        showProb: {
            type: Boolean,
            required: false,
            default: false,
        },
        yesProb: {
            type: Number,
            required: false,
            default: 0,
        }
    },
    emits: ['itemChange'],
    data() {
        return {
            localCount: this.count,
            triggerStatusMap: {
                "ok": "正常",
                "minor": "小熔断",
                "major": "大熔断",
                "immediate": "超级熔断",
                "cancelled": "取消",
            },
            localEnabled: this.enabled,
        }
    },
    methods: {
        countChangeHandler(value) {
            this.localCount = value
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
        probColor() {
            let textColor = this.yesProb > 0.6 ? "white" : "black"
            return {
                "background-color": lerpColor(0xe3f2fd, 0x0d47a1, this.yesProb),
                "color": textColor,
            }
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