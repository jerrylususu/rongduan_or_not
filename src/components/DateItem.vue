<template>
    <a-card :class="[flightStatus]">
        {{date}}
        <a-input-number v-model:value="localCount" @change="countChangeHandler" :min="0"></a-input-number>
        <a-button :class="triggerStatus">{{triggerStatusName}}</a-button>
        <span v-if="flightStatus === 'yes' "><check-outlined /></span>
        <span v-else> <stop-outlined /></span>
    </a-card>
</template>

<script>
  import { Button, InputNumber, Card } from 'ant-design-vue';
  import { CheckOutlined, StopOutlined } from '@ant-design/icons-vue';

export default {
    components: {
      AButton: Button,
      AInputNumber: InputNumber,
      ACard: Card,
      CheckOutlined,
      StopOutlined
    },
    props: {
        date: {
            type: String,
            required: true
        },
        count: {
            type: Number,
            required: true
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
    },
    emits: ['countChange'],
    data() {
        return {
            localCount: this.count,
            triggerStatusMap: {
                "ok": "正常",
                "minor": "小熔断",
                "major": "大熔断",
                "immediate": "超级熔断",
            },
        }
    },
    methods: {
        countChangeHandler(value) {
            this.localCount = value
            this.$emit('countChange', {
                date: this.date,
                count: this.localCount,
                index: this.index
            })
        }
    },
    computed: {
        triggerStatusName() {
            if(this.triggerStatus in this.triggerStatusMap) {
                return this.triggerStatusMap[this.triggerStatus]
            } else {
                return this.triggerStatus.replace("broken by", "熔断，触发于")
            }
            
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

.yes {
    background-color: #81c784;
}
.no {
    background-color: #6c757d;
}




</style>