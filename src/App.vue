<template>

    <div v-if="newVersionEnabled">
        <flight-view-new></flight-view-new>
    </div>
    <div v-else>
        <flight-view></flight-view>
    </div>

    <a-row justify="space-around">
      <a-col :lg="12" :md="24">
        开启新版：<a-switch v-model:checked="newVersionEnabled"></a-switch>
      </a-col>
    </a-row>


  <component :is="'script'">
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-WKB857318N');
  </component>
</template>

<script>
import { Switch, Row, Col } from 'ant-design-vue';
import FlightView from './components/FlightView.vue';
import FlightViewNew from './components/FlightViewNew.vue';

export default {
  name: 'AppNew',
  components: {
    FlightView,
    FlightViewNew,
    ASwitch: Switch,
    ARow: Row,
    ACol: Col,  
  },
  data() {
    return {
        newVersionEnabled: true,
    }
  },
  created () {
      document.title = "今天航班熔断了吗？";
  },
  mounted() {
    let gaScript = document.createElement('script')
    gaScript.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-WKB857318N')
    document.head.appendChild(gaScript)
  },
}
</script>

<style>

</style>
