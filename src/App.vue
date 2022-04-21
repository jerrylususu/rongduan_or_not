<template>
  <flight-view></flight-view>
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
  }
}
</script>

<style>

</style>
