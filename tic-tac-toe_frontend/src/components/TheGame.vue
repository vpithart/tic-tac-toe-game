<template>
  <section class="container board">
  </section>
  <section class="container">
    <p>Game ID {{ $route.params.id }}</p>
    <button type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: 'TheGame',
  props: {
    id: String
  },
  data() {
    return {
      socketAddress: '',
      socket: WebSocket,
      socketState: undefined
    }
  },
  methods: {
    leaveGame() {
      if (confirm('leave the game?'))
      {
        this.$router.push('/')
      }
    },
    openWebsocket() {
      this.socketAddress = 'ws'

      if (window.location.protocol === 'https') this.socketAddress += 's'
      this.socketAddress += '://'
      this.socketAddress += window.location.host
      this.socketAddress += '/api/websockets'
      this.socketAddress += '/game?' + this.$route.params.id

      // this.socket = new WebSocket(this.socketAddress);
      let newSocket:WebSocket;
      newSocket = new WebSocket(this.socketAddress);
      newSocket.onclose =  () => {
       setTimeout(this.openWebsocket, 15000)
      }
      newSocket.onmessage = this.processMessage
      newSocket.onopen = () => {
        newSocket.send(JSON.stringify({ble: 124}))
      }
    },
    processMessage(msg:MessageEvent) {
      console.log('got:', msg.data)
    }
  },
  created() {
    this.openWebsocket()
  },

})
</script>

<style scoped>
.board {
  width: 95vw;
  height: 95vw;
  border: 1px solid gray;
}
section + section {
  margin-top: 1em;
}
</style>
