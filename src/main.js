import { createApp } from 'vue'
import App from './App.vue'
import 'ant-design-vue/dist/antd.css';
import Adsense from 'vue-google-adsense/dist/Adsense.min.js'
import ScriptX from 'vue-scriptx'


const app = createApp(App)
app.use(ScriptX)
app.use(Adsense)

app.mount('#app')
