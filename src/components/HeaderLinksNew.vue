<template>
    <h3>熔断措施更新于 2022/8/7</h3>
    <a-button size="large" href="http://www.caac.gov.cn/XWZX/MHYW/202208/t20220807_214888.html" target="_blank"><img src="assets/caac_logo.png" style="max-height: 75%; width: auto;"/>民航局文件</a-button> 
    <a-button size="large" href="https://github.com/jerrylususu/rongduan_or_not" target="_blank" type="primary"><github-outlined /> Github</a-button> 
    <a-button size="large" @click="showModel"><img src="assets/piaotips_logo.png" style="max-height: 75%; width: auto;"/>  北美票帝</a-button>
    <a-modal v-model:visible="showPiaoTipsModal" title="北美票帝">
    <template #footer>
        <a-button href="https://piao.tips" target="_blank" >官网 piao.tips</a-button>
        <a-button href="https://weibo.com/airticketna" target="_blank" >微博 @北美票帝</a-button>
      </template>
      <img src="assets/piaotips_large.jpg" style="max-width: 100%; height: auto;"/>
    </a-modal>
    <div class="ad-container">
        <Adsense
            data-ad-client="ca-pub-3973436778637330"
            data-ad-slot="5591115055"
            data-ad-format="auto"
            data-full-width-responsive="true">
        </Adsense>
    </div>
</template>

<script>
import { Button, Modal } from 'ant-design-vue'
import { GithubOutlined } from '@ant-design/icons-vue';
export default {
    components: {
        AButton: Button,
        GithubOutlined,
        AModal: Modal,
    },
    data() {
        return {
            showPiaoTipsModal: false,
        }
    },
    methods: {
        showModel() {
            this.showPiaoTipsModal = true;
        },
    },
}
</script>

<style>

</style>