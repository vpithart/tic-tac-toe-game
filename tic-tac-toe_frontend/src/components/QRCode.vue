<template>
  <div>
    <img :src="qrCodeDataUrl">
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import QRCode from 'qrcode'

export default defineComponent({
  name: 'QRCode',
  props: {
    text: String
  },
  data() {
    return {
      qrCodeDataUrl: '' as string
    }
  },
  async created() {
    this.qrCodeDataUrl = await QRCode.toDataURL(this.text || '', {width: 500})
  },
})
</script>

<style scoped>
img {
  width: 100%;
}
</style>
