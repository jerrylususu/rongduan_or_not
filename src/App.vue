<template>
  <flight-view></flight-view>
  
  <component :is="'script'">
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-WKB857318N');
  </component>
</template>

<script>
import FlightView from './components/FlightView.vue'

export default {
  name: 'App',
  components: {
    FlightView
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
